'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var base = process.cwd();

var ConfigurableRecipeFactory = require(base + '/lib/core/configurable_recipe_factory');
var ConfigurableTaskFactory = require(base + '/lib/core/configurable_task_factory');
var Configuration = require(base + '/lib/core/configuration');
var ConfigurationError = require(base + '/lib/core/configuration_error');
var Registry = require(base + '/lib/core/registry');

var createFakeStuff = require(base + '/test/fake/stuff');
var FakeFactory = require(base + '/test/fake/factory');

describe('Core', function () {
	describe('ConfigurableTaskFactory', function () {
		var gulp, registry, factory, gulpTask, configurableTask;

		beforeEach(function () {
			var stuff;

			stuff = createFakeStuff();
			registry = new Registry();
			gulp = FakeFactory.createFakeGulp();
			gulp.registry(registry);
			factory = new ConfigurableTaskFactory(stuff, new ConfigurableRecipeFactory(stuff, registry), registry);
			gulpTask = gulp.task('gulp-task');
			configurableTask = gulp.task('configurable-task');
		});

		describe('#create()', function () {
			var taskInfo, taskConfig, configurableRunner;

			function done() {
			}

			beforeEach(function () {
				taskInfo = {
					name: 'configurable-task',
					visibility: Configuration.CONSTANT.VISIBILITY.NORMAL,
					runtime: Configuration.CONSTANT.RUNTIME.ALL
				};

				taskConfig = {
					name: 'taskConfig'
				};

				configurableRunner = Sinon.spy();
			});

			it('should return a ConfigurableTask (i.e. a function with run() method)', function () {
				var actual;

				actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				expect(actual).to.be.a('function');
				expect(actual.run).to.be.a('function');
				expect(actual.displayName).to.equal(taskInfo.name);
				expect(actual.visibility).to.equal(taskInfo.visibility);
				expect(actual.runtime).to.equal(taskInfo.runtime);
			});
			it('should return a ConfigurableTask with the given name, and registry with prefix name', function () {
				var actual, prefix;

				prefix = 'dev:';
				actual = factory.create(prefix, taskInfo, taskConfig, configurableRunner);
				expect(actual.displayName).to.equal(taskInfo.name);
				expect(registry.get(prefix + taskInfo.name)).to.be.a('function');
			});
			it('should invoke configurableRunner() when act as a gulp task: invoked directly', function () {
				var actual;

				actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				actual(done);
				expect(configurableRunner.thisValues[0]).to.deep.equal({ gulp: gulp, config: taskConfig });
				expect(configurableRunner.calledWith(done)).to.be.true;
			});
			it('should invoke configurableRunner() method when act as a configurable task: invoked via configurableRunner.run()', function () {
				var context = {
					gulp: gulp,
					config: taskConfig
				};
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);

				actual.run.call(context, done);
				expect(configurableRunner.calledOn(context)).to.be.true;
				expect(configurableRunner.calledWith(done)).to.be.true;
			});
			it('should be able to inject value and resolve config at runtime when act as a configurable task', function () {
				var templateConfig = {
					template: 'inject-value: {{inject-value}}'
				};
				var injectConfig = {
					'inject-value': 'resolved-value'
				};
				var expectedConfig = {
					template: 'inject-value: resolved-value',
					'inject-value': 'resolved-value'
				};
				var context = {
					gulp: gulp,
					config: injectConfig
				};
				var actual = factory.create('', taskInfo, templateConfig, configurableRunner);

				actual.run.call(context, done);
				expect(configurableRunner.thisValues[0].config).to.deep.equal(expectedConfig);
			});
		});
		describe('#one()', function () {
			it('should resolve to a recipe task', function () {
				var actual;

				actual = factory.one('', 'recipe-task', {}, {});
				expect(actual).to.be.a('function');
			});
			it('should resolve to a stream task', function () {
				var actual;

				actual = factory.one('', 'stream-task', {}, {});
				expect(actual).to.be.a('function');
			});
			it('should resolve to a non-existent task with sub-task configs to a merge stream task', function () {
				var actual;

				actual = factory.one('', 'non-existent-stream-task-with-sub-task-configs', {
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
				var actual;

				actual = factory.one('', 'non-existent', {}, {});
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
					var subTaskConfigs = [
						{ name: 'task-1' },
						{ name: 'task-2' }
					];

					Sinon.spy(factory, 'one');
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
						'configurable-task-by-ref',	// reference to registered configurable task
						gulpTask,					// registered gulp task
						configurableTask,			// registered configurable task
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
					var subTaskConfigs = {
						'task-1': {},
						'task-2': {}
					};

					Sinon.spy(factory, 'one');
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
				it('should be order-stable: tasks not defined "order" property defaults to 0', function () {
					var subTaskConfigs = {
						'task-1': {},
						'task-2': { order: 1 },
						'task-3': { order: 2 },
						'task-4': { order: 1 },
						'task-5': 'gulp-task',
						'task-6': {
							order: 0,
							task: 'configurable-task'
						}
					};

					var actual = factory.multiple('', subTaskConfigs, {});

					expect(actual[0].displayName).to.equal('task-1');
					expect(actual[1].displayName).to.equal('task-5');
					expect(actual[2].displayName).to.equal('task-6');
					expect(actual[3].displayName).to.equal('task-2');
					expect(actual[4].displayName).to.equal('task-4');
					expect(actual[5].displayName).to.equal('task-3');
				});
				it('should dereference task references', function () {
					var subTaskConfigs = {
						task1: {},							// sub-config task
						task2: 'gulp-task-by-ref',			// reference to registered gulp task
						task3: 'configurable-task-by-ref',	// reference to registered configurable task
						task4: gulpTask,					// registered gulp task
						task5: configurableTask,			// registered configurable task
						task6: Sinon.spy()					// stand-alone gulp task (not registered to gulp)
					};
					var actual = factory.multiple('', subTaskConfigs, {});

					expect(actual.length).to.equal(6);
					expect(actual[0].displayName).to.equal('task1');
					expect(actual[1].displayName).to.equal('task2');
					expect(actual[2].displayName).to.equal('task3');
					expect(actual[3].displayName).to.equal('task4');
					expect(actual[4].displayName).to.equal('task5');
					expect(actual[5].displayName).to.equal('task6');
				});
			});
		});
	});
});
