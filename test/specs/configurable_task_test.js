'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
//var SinonChai = require("sinon-chai");
//var Promised = require("chai-as-promised");
var expect = Chai.expect;
//Chai.should();
//Chai.use(SinonChai);
//Chai.use(Promised);

var _ = require('lodash');
var base = process.cwd();

var ConfigurableTask = require(base + '/src/configurable_task');
var ConfigurationError = require(base + '/src/errors/configuration_error');

var FakeGulp = require('./fake_gulp');
var test = require(base + '/test/testcase_runner');

function done(err) {
}

function createSpyGulpTask(gulp, name) {
	var task = Sinon.spy();
	task.displayName = name;
	gulp.task(task);
	return task;
}

function createSpyConfigurableTask(gulp, name) {
	var task = createSpyGulpTask(gulp, name);
	task.run = Sinon.spy();
	return task;
}

describe('Core', function () {
	describe('ConfigurableTask', function () {
		describe('getTaskRuntimeInfo()', function () {
			var testCases = [{
				title: 'should accept normal task name',
				value: 'build',
				expected: {
					name: 'build',
					hidden: '',
					runtime: ''
				}
			}, {
				title: 'should accept task name with space, underscore, dash',
				value: '_build the-project',
				expected: {
					name: '_build the-project',
					hidden: '',
					runtime: ''
				}
			}, {
				title: 'should accept . prefix and mark task hidden',
				value: '.build',
				expected: {
					name: 'build',
					hidden: '.',
					runtime: ''
				}
			}, {
				title: 'should accept # prefix and mark task undefined',
				value: '#build',
				expected: {
					name: 'build',
					hidden: '#',
					runtime: ''
				}
			}, {
				title: 'should accept ! postfix and mark task available in production mode only',
				value: 'build!',
				expected: {
					name: 'build',
					hidden: '',
					runtime: '!'
				}
			}, {
				title: 'should accept ? postfix and mark task available in development mode only',
				value: 'build?',
				expected: {
					name: 'build',
					hidden: '',
					runtime: '?'
				}
			}, {
				title: 'should throw if invalid name',
				value: 'build?!',
				error: ConfigurationError
			}, {
				title: 'should throw if invalid name',
				value: '?build',
				error: ConfigurationError
			}];
			test(ConfigurableTask.getTaskRuntimeInfo, testCases);
		});
		describe('createReferenceTaskRunner()', function () {
			var gulp, gulpTask, configurableTask;

			beforeEach(function () {
				gulp = new FakeGulp();
				gulpTask = createSpyGulpTask(gulp, 'spy');
				configurableTask = createSpyConfigurableTask(gulp, 'configurable');
			});

			it('should throw at runtime if the referring task not found', function() {
				var actual = ConfigurableTask.createReferenceTaskRunner('not-exist');
				expect(function () { actual.call(gulp, gulp, {}, null, done); }).to.throw(ConfigurationError);
			});

			it('should wrap a normal gulp task', function() {
				var actual = ConfigurableTask.createReferenceTaskRunner('spy');
				expect(actual).to.be.a('function');
				actual.call(gulp, gulp, {}, null, done);
				expect(gulpTask.calledOn(gulp)).to.be.true;
				expect(gulpTask.calledWithExactly(done)).to.be.true;
			});

			it("should call target's run() at runtime if already a ConfigurableTask", function() {
				var actual = ConfigurableTask.createReferenceTaskRunner('configurable');
				expect(actual).to.be.a('function');
				actual.call(gulp, gulp, {}, null, done);
				expect(configurableTask.run.calledOn(configurableTask)).to.be.true;
				expect(configurableTask.run.calledWithExactly(gulp, {}, null, done)).to.be.true;
			});
		});
		describe('createParallelTaskRunner()', function () {
			var gulp, spy, configurable, run, tasks;

			beforeEach(function () {
				gulp = new FakeGulp();

				spy = Sinon.spy();
				spy.displayName = 'spy';
				gulp.task(spy);

				run = Sinon.spy();
				configurable = Sinon.spy();
				configurable.displayName = 'configurable';
				gulp.task(configurable);
				configurable.run = run;

				tasks = [
					fn(),
					fn(),
					fn()
				];

				function fn(f) {
					var task = function () {};
					task.run = Sinon.spy(f);
					return task;
				}
			});

			it('should create a function', function() {
				var actual = ConfigurableTask.createParallelTaskRunner(tasks);
				expect(actual).to.be.a('function');
			});

			it('should each tasks eventually be called when call the generated function', function() {
				var actual = ConfigurableTask.createParallelTaskRunner(tasks);
				actual.call(gulp, gulp, {}, null, done);
				expect(tasks[0].run.called).to.be.true;
				expect(tasks[1].run.called).to.be.true;
				expect(tasks[2].run.called).to.be.true;
			});
		});
	});
});
