'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var _ = require('lodash');
var base = process.cwd();

var ConfigurableRunnerRegistry = require(base + '/src/core/configurable_runner_registry');
var ConfigurableRunner = require(base + '/src/core/configurable_runner');
var ConfigurationError = require(base + '/src/errors/configuration_error');

var FakeGulp = require(base + '/test/fake_gulp');
var test = require(base + '/test/testcase_runner');

function done(err) {
}

function createSpyGulpTask(gulp, name, gulpTask) {
	var task = Sinon.spy(gulpTask);
	task.displayName = name;
	gulp.task(task);
	return task;
}

function createSpyConfigurableTask(gulp, name, configurableRunner) {
	var task = createSpyGulpTask(gulp, name);
	task.run = Sinon.spy(configurableRunner);
	return task;
}

describe('Core', function () {
	describe('ConfigurableRunner', function () {
		describe('createStreamTaskRunner()', function () {
			var gulp = new FakeGulp();
			var taskInfo = {
				name: 'stream-task'
			};
			var prefix = '';
			var taskConfig = {
			};
			var streamRunner = function (gulp, config, stream, tasks) {
				tasks.forEach(function (task) {
					task.run(gulp, config, stream, done);
				});
			};
			var registry = new ConfigurableRunnerRegistry({
				'stream-task': Sinon.spy(streamRunner),
				'merge': Sinon.spy(streamRunner)
			});
			var subTaskConfigs = {
				task1: {
				},
				task2: {
				}
			};
			var subTasks;
			var createConfigurableTasks = Sinon.spy(function (prefix, subTaskConfigs, parentConfig) {
				return subTasks = _.map(subTaskConfigs, function(config, name) {
					return createSpyConfigurableTask(gulp, name);
				});;
			});

			it('should create a stream runner', function () {
				var actual = ConfigurableRunner.createStreamTaskRunner(taskInfo, taskConfig, prefix, subTaskConfigs, registry, createConfigurableTasks);
				expect(actual).to.be.a('function');
			});
			it('should invoke sub-tasks at runtime', function () {
				var actual = ConfigurableRunner.createStreamTaskRunner(taskInfo, taskConfig, prefix, subTaskConfigs, registry, createConfigurableTasks);
				actual.call(null, gulp, {}, null, done);
				subTasks.forEach(function(task) {
					expect(task.run.calledOn(task)).to.be.true;
					expect(task.run.calledWithExactly(gulp, {}, null, done)).to.be.true;
				});
			});
		});
		describe('createReferenceTaskRunner()', function () {
			var gulp, gulpTask, configurableTask;

			beforeEach(function () {
				gulp = new FakeGulp();
				gulpTask = createSpyGulpTask(gulp, 'spy');
				configurableTask = createSpyConfigurableTask(gulp, 'configurable');
			});

			it('should throw at runtime if the referring task not found', function() {
				var actual = ConfigurableRunner.createReferenceTaskRunner('not-exist');
				expect(function () { actual.call(gulp, gulp, {}, null, done); }).to.throw(ConfigurationError);
			});

			it('should wrap a normal gulp task', function() {
				var actual = ConfigurableRunner.createReferenceTaskRunner('spy');
				expect(actual).to.be.a('function');
				actual.call(null, gulp, {}, null, done);
				expect(gulpTask.calledOn(gulp)).to.be.true;
				expect(gulpTask.calledWithExactly(done)).to.be.true;
			});

			it("should call target's run() at runtime if already a ConfigurableTask", function() {
				var actual = ConfigurableRunner.createReferenceTaskRunner('configurable');
				expect(actual).to.be.a('function');
				actual.call(null, gulp, {}, null, done);
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
				var actual = ConfigurableRunner.createParallelTaskRunner(tasks);
				expect(actual).to.be.a('function');
			});

			it('should each tasks eventually be called when call the generated function', function() {
				var actual = ConfigurableRunner.createParallelTaskRunner(tasks);
				actual.call(gulp, gulp, {}, null, done);
				expect(tasks[0].run.called).to.be.true;
				expect(tasks[1].run.called).to.be.true;
				expect(tasks[2].run.called).to.be.true;
			});
		});
	});
});
