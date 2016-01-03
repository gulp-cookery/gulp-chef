'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var _ = require('lodash');

var base = process.cwd();

var ConfigurableRecipeFactory = require(base + '/lib/recipe/factory');

var FakeFactory = require(base + '/test/fake/factory');
var createFakeStuff = require(base + '/test/fake/stuff');

describe('Core', function () {
	describe('ConfigurableRecipeFactory', function () {
		var gulp, stuff, factory;

		gulp = FakeFactory.createFakeGulp();
		stuff = createFakeStuff();
		factory = new ConfigurableRecipeFactory(stuff, gulp.registry());

		function done() {
		}

		function test(name, method) {
			var taskInfo = {
				name: name
			};
			var rawConfig = {
				id: 'recipe-config'
			};

			it('should return a ' + method + ' recipe', function () {
				var actual;

				actual = factory[method](taskInfo, rawConfig);
				expect(actual).to.be.a('function');
			});
			it('should refer to correct recipe', function () {
				var actual, context, lookup;

				lookup = stuff[method + 's'].lookup(name);
				context = {
					gulp: gulp,
					config: rawConfig,
					upstream: null
				};

				actual = factory[method](taskInfo, rawConfig);
				expect(actual.schema.title).to.equal(name);

				actual.call(context, done);
				expect(lookup.called).to.be.true;
				expect(lookup.calledOn(context)).to.be.true;
				expect(lookup.calledWithExactly(done)).to.be.true;
			});
		}

		describe('#flow()', function () {
			var name = 'non-existent';
			var array = [
				'task-task',
				function () {}
			];
			var object = {
				'task-task': {},
				'inline': function () {}
			};
			var rawConfig = {};

			test('flow-task', 'flow');
			it.skip('should return series recipe if taskInfo.task is an array', function () {
				var actual;
				var taskInfo = {
					name: name,
					task: array
				};

				actual = factory.flow(taskInfo, rawConfig);
				expect(actual).to.be.a('function');
				expect(actual.schema.title).to.equal('series');
			});
			it.skip('should return parallel recipe if taskInfo.task is an object', function () {
				var actual;
				var taskInfo = {
					name: name,
					task: object
				};

				actual = factory.flow(taskInfo, rawConfig);
				expect(actual).to.be.a('function');
				expect(actual.schema.title).to.equal('parallel');
			});
		});
		describe('#reference()', function () {
			it('should always return a recipe even if the referring task not found', function () {
				var taskInfo = {
					name: 'reference-task',
					task: 'non-existent'
				};
				var actual;

				actual = factory.reference(taskInfo);
				expect(actual).to.be.a('function');
			});
			it('should throw at runtime if the referring task not found', function () {
				var taskInfo = {
					name: 'reference-task',
					task: 'non-existent'
				};
				var context = {
					gulp: gulp,
					config: {}
				};
				var actual, expr;

				actual = factory.reference(taskInfo);
				expr = function () {
					actual.call(context, done);
				};
				expect(expr).to.throw(Error);
			});
			it('should wrap a normal gulp task', function () {
				var gulpTask = gulp.task('gulp-task');
				var taskInfo = {
					name: 'reference-task',
					task: gulpTask.displayName
				};
				var context = {
					gulp: gulp,
					config: {}
				};
				var actual;

				actual = factory.reference(taskInfo);
				expect(actual).to.be.a('function');
				actual.call(context, done);
				expect(gulpTask.calledOn(context)).to.be.true;
				expect(gulpTask.calledWithExactly(done)).to.be.true;
			});
			it("should wrap a configurable task and call target's run() at runtime", function () {
				var configurableTask = gulp.task('configurable-task');
				var taskInfo = {
					name: 'reference-task',
					task: configurableTask.displayName
				};
				var context = {
					gulp: gulp,
					config: {}
				};
				var actual;

				actual = factory.reference(taskInfo);
				expect(actual).to.be.a('function');
				actual.call(context, done);
				expect(configurableTask.run.calledOn(context)).to.be.true;
				expect(configurableTask.run.calledWithExactly(done)).to.be.true;
			});
		});
		describe('#stream()', function () {
			test('stream-task', 'stream');
		});
		describe('#task()', function () {
			test('task-task', 'task');
		});
	});
});
