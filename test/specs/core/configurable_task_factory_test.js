'use strict';

var Sinon = require('sinon'),
	Chai = require('chai'),
	expect = Chai.expect;

var _ = require('lodash');

var base = process.cwd();

var ConfigurableTaskRunnerFactory = require(base + '/src/core/configurable_runner_factory'),
	ConfigurableTaskFactory = require(base + '/src/core/configurable_task_factory'),
	Configuration = require(base + '/src/core/configuration'),
	ConfigurationError = require(base + '/src/core/configuration_error'),
	Registry = require(base + '/src/core/registry');

var createFakeStuff = require(base + '/test/fake/stuff'),
	FakeFactory = require(base + '/test/fake/factory');

describe('Core', function () {
	describe('ConfigurableTaskFactory', function () {
		var gulp, factory, gulpTask, configurableTask;

		beforeEach(function () {
			var stuff = createFakeStuff(),
				registry = new Registry();
			gulp = FakeFactory.createFakeGulp();
			gulp.registry(registry);
			factory = new ConfigurableTaskFactory(stuff, new ConfigurableTaskRunnerFactory(stuff), registry);
			gulpTask = gulp.task('gulp-task');
			configurableTask = gulp.task('configurable-task');
		});

		describe('#create()', function () {
			var taskInfo, taskConfig, stream, configurableRunner;

			taskInfo = {
				name: 'configurable-task',
				visibility: Configuration.CONSTANT.VISIBILITY.NORMAL,
				runtime: Configuration.CONSTANT.RUNTIME.ALL
			};

			taskConfig = {
				name: 'taskConfig'
			};

			stream = {
				name: 'fake stream'
			};

			function done(err) {
			}

			beforeEach(function () {
				configurableRunner = Sinon.spy();
			});

			it('should return a ConfigurableTask (i.e. a function with run() method)', function () {
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				expect(actual).to.be.a('function');
				expect(actual.run).to.be.a('function');
				expect(actual.displayName).to.equal(taskInfo.name);
				expect(actual.visibility).to.equal(taskInfo.visibility);
				expect(actual.runtime).to.equal(taskInfo.runtime);
			});
			it('should return a ConfigurableTask with the given prefix name', function () {
				var prefix = 'dev:',
					actual = factory.create(prefix, taskInfo, taskConfig, configurableRunner);
				expect(actual.displayName).to.equal(prefix + taskInfo.name);
			});
			it('should invoke configurableRunner() when act as a gulp task', function () {
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				actual(done);
				expect(configurableRunner.calledWith(gulp, taskConfig, null, done)).to.be.true;
			});
			it('should invoke configurableRunner() in run() method whe act as a configurable task', function () {
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				actual.run(gulp, taskConfig, stream, done);
				expect(configurableRunner.calledWith(gulp, taskConfig, stream, done)).to.be.true;
			});
			it('should be able to inject value and resolve config at runtime when act as a configurable task', function () {
				var taskConfig = {
						template: 'inject-value: {{inject-value}}'
					},
					injectConfig = {
						'inject-value': 'resolved-value'
					},
					expectedConfig = {
						template: 'inject-value: resolved-value',
						'inject-value': 'resolved-value'
					};
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				actual.run(gulp, injectConfig, stream, done);
				expect(configurableRunner.calledWith(gulp, expectedConfig, stream, done)).to.be.true;
			});
		});
		describe('#one()', function () {
			it('should resolve to a recipe task', function () {
				var actual = factory.one('', 'recipe-task', {}, {});
				expect(actual).to.be.a('function');
			});
			it('should resolve to a stream task', function () {
				var actual = factory.one('', 'stream-task', {}, {});
				expect(actual).to.be.a('function');
			});
			it('should resolve to a non-existent task with sub-task configs to a merge stream task', function () {
				var actual = factory.one('', 'non-existent-stream-task-with-sub-task-configs', {
					'recipe-task': {},
					'stream-task': {},
					'non-existent-but-with-src-and-dest-defined': {
						src: 'src',
						dest: 'dist'
					}
				}, {});
				expect(actual).to.be.a('function');
			});
			it('should not throw even can not resolve to a task', function () {
				var actual = factory.one('', 'non-existent', {}, {});
				expect(actual).to.be.a('function');
			});
		});
		describe('#multiple()', function () {
			describe('when take subTaskConfigs as an array', function () {
				it('should returns an array', function () {
					var subTaskConfigs = [
						{ name: 'task-1' },
						{ name: 'task-2' }
					];
					var actual = factory.multiple('', subTaskConfigs, {});
					expect(actual).to.be.an('array');
					expect(actual.length).to.equal(2);
				});
				it('should process each config defined in subTaskConfigs', function () {
					Sinon.spy(factory, 'one');
					var subTaskConfigs = [
						{ name: 'task-1' },
						{ name: 'task-2' }
					];
					factory.multiple('', subTaskConfigs, {});
					expect(factory.one.calledTwice).to.be.true;
					factory.one.restore();
				});
				it('should give tasks names if not provided', function () {
					var subTaskConfigs = [
						{ name: 'task-1' },
						{ options: {} }
					];
					var actual = factory.multiple('', subTaskConfigs, {});
					expect(actual[0].displayName).to.be.a('string');
					expect(actual[1].displayName).to.be.a('string');
				});
				it('should dereference task references', function () {
					var subTaskConfigs = [
						{ name: 'task1' },
						'gulp-task-by-ref',			// reference to registered gulp task
						'configurable-task-by-ref',	// reference to registered configurable task runner
						gulpTask,					// registered gulp task
						configurableTask,			// registered configurable task runner
						Sinon.spy()					// stand-alone gulp task (not registered to gulp)
					];
					var actual = factory.multiple('', subTaskConfigs, {});
					expect(actual.length).to.equal(6);
					expect(actual[0].displayName).to.equal('task1');
					expect(actual[1].displayName).to.equal('gulp-task-by-ref');
					expect(actual[2].displayName).to.equal('configurable-task-by-ref');
					expect(actual[3].displayName).to.equal('gulp-task');
					expect(actual[4].displayName).to.equal('configurable-task');
					expect(actual[5].displayName).to.be.a('string');
				});
			});
			describe('when take subTaskConfigs as an object', function () {
				it('should returns an array', function () {
					var subTaskConfigs = {
						'task-1': {},
						'task-2': {}
					};
					var actual = factory.multiple('', subTaskConfigs, {});
					expect(actual).to.be.an('array');
					expect(actual.length).to.equal(2);
				});
				it('should process each config defined in subTaskConfigs', function () {
					Sinon.spy(factory, 'one');
					var subTaskConfigs = {
						'task-1': {},
						'task-2': {}
					};
					factory.multiple('', subTaskConfigs, {});
					expect(factory.one.calledTwice).to.be.true;
					factory.one.restore();
				});
				it('should sort tasks by "order" if provided', function () {
					var subTaskConfigs = {
						'task-1': { order: 2 },
						'task-2': { order: 1 }
					};
					var actual = factory.multiple('', subTaskConfigs, {});
					expect(actual[0].displayName).to.equal('task-2');
					expect(actual[1].displayName).to.equal('task-1');
				});
				it('should throw if not all tasks defined "order" property', function () {
					var subTaskConfigs = {
						'task-1': {},
						'task-2': { order: 1 }
					};
					function call() {
						factory.multiple('', subTaskConfigs, {})
					}
					expect(call).to.throw(ConfigurationError);
				});
				it('should dereference task references', function () {
					var subTaskConfigs = {
						task1: {},							// sub-config task
						task2: 'gulp-task-by-ref',			// reference to registered gulp task
						task3: 'configurable-task-by-ref',	// reference to registered configurable task runner
						task4: gulpTask,					// registered gulp task
						task5: configurableTask,			// registered configurable task runner
						task6: Sinon.spy()					// stand-alone gulp task (not registered to gulp)
					};
					var actual = factory.multiple('', subTaskConfigs, {});
					expect(actual.length).to.equal(6);
					expect(actual[0].displayName).to.equal('task1');
					expect(actual[1].displayName).to.equal('gulp-task-by-ref');
					expect(actual[2].displayName).to.equal('configurable-task-by-ref');
					expect(actual[3].displayName).to.equal('gulp-task');
					expect(actual[4].displayName).to.equal('configurable-task');
					expect(actual[5].displayName).to.be.a('string');
				});
			});
		});
	});
});
