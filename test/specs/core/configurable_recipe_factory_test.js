'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var _ = require('lodash');

var base = process.cwd();

var ConfigurableRecipeFactory = require(base + '/lib/core/configurable_recipe_factory');
var ConfigurationError = require(base + '/lib/core/configuration_error');

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
			var configs = {
				taskInfo: {
					name: name
				},
				taskConfig: {
					id: 'recipe-config'
				}
			};

			it('should return a ' + method + ' recipe', function () {
				var actual;

				actual = factory[method](name, configs);
				expect(actual).to.be.a('function');
			});
			it('should refer to correct recipe', function () {
				var actual, context, lookup;

				lookup = stuff[method + 's'].lookup(name);
				context = {
					gulp: gulp,
					config: configs.taskConfig,
					upstream: null
				};
				actual = factory[method](name, configs);
				actual.call(context, done);
				expect(lookup.called).to.be.true;
				expect(lookup.calledOn(context)).to.be.true;
				expect(lookup.calledWithExactly(done)).to.be.true;
			});
		}

		describe('#flow()', function () {
			var name = 'non-existent';
			var configs = {
				taskInfo: {
					name: name
				},
				taskConfig: {
				},
				subTaskConfigs: null
			};
			var array = ['task-task', function () {}];
			var object = {
				'task-task': {},
				'inline': function () {}
			};

			test('flow-task', 'flow');
			it('should return series recipe if subTaskConfigs is array', function () {
				var actual;

				configs.subTaskConfigs = array;
				actual = factory.flow(name, configs);
				expect(actual).to.be.a('function');
				expect(actual.schema.title).to.equal('series');
			});
			it('should return parallel recipe if subTaskConfigs is object', function () {
				var actual;

				configs.subTaskConfigs = object;
				actual = factory.flow(name, configs);
				expect(actual).to.be.a('function');
				expect(actual.schema.title).to.equal('parallel');
			});
		});
		describe('#reference()', function () {
			it('should throw at runtime if the referring task not found', function () {
				var context = {
					gulp: gulp,
					config: {}
				};
				var actual = factory.reference('non-existent');
				var expr = function () {
					actual.call(context, done);
				};

				expect(expr).to.throw(ConfigurationError);
			});

			it('should wrap a normal gulp task', function () {
				var gulpTask = gulp.task('gulp-task');
				var context = {
					gulp: gulp,
					config: {}
				};
				var actual = factory.reference(gulpTask.displayName);

				expect(actual).to.be.a('function');
				actual.call(context, done);
				expect(gulpTask.calledOn(context)).to.be.true;
				expect(gulpTask.calledWithExactly(done)).to.be.true;
			});

			it("should wrap a configurable task and call target's run() at runtime", function () {
				var configurableTask = gulp.task('configurable-task');
				var context = {
					gulp: gulp,
					config: {}
				};
				var actual = factory.reference(configurableTask.displayName);

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
