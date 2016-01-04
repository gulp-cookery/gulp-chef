'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var log = require('gulp-util').log;

var base = process.cwd();

var ConfigurableRecipeFactory = require(base + '/lib/recipe/factory');
var ConfigurableTaskFactory = require(base + '/lib/task/factory');
var Configuration = require(base + '/lib/configuration');
var Registry = require(base + '/lib/task/registry');
var Settings = require(base + '/lib/helpers/settings');
var expose = require(base + '/lib/task/expose');

var createFakeStuff = require(base + '/test/fake/stuff');
var FakeFactory = require(base + '/test/fake/factory');

function assertConfigurableTask(task, name) {
	expect(task).to.be.a('function');
	expect(task.run).to.be.a('function');
	expect(task.displayName).to.equal(name);
};

describe('Core', function () {
	describe('ConfigurableTaskFactory', function () {
		var gulp, registry, settings, factory, gulpTask, configurableTask;

		beforeEach(function () {
			var stuff;

			stuff = createFakeStuff();
			registry = new Registry();
			settings = new Settings();
			gulp = FakeFactory.createFakeGulp();
			gulp.registry(registry);
			factory = new ConfigurableTaskFactory(new ConfigurableRecipeFactory(stuff, registry), registry, expose(registry, settings));
			gulpTask = gulp.task('gulp-task');
			configurableTask = gulp.task('configurable-task');
		});

		describe('#create()', function () {
			var taskInfo, taskConfig, recipe;

			function done() {
			}

			beforeEach(function () {
				taskInfo = {
					name: 'configurable-task',
					visibility: Configuration.CONSTANT.VISIBILITY.NORMAL,
					runtime: Configuration.CONSTANT.RUNTIME.ALL
				};

				taskConfig = {
					id: 'taskConfig'
				};

				recipe = Sinon.spy();
			});

			it('should return a ConfigurableTask (i.e. a function with run() method)', function () {
				var actual;

				actual = factory.create('', taskInfo, taskConfig, recipe);
				assertConfigurableTask(actual, taskInfo.name);
				expect(actual.visibility).to.equal(taskInfo.visibility);
				expect(actual.runtime).to.equal(taskInfo.runtime);
			});
			it('should return a ConfigurableTask with the given name with prefix', function () {
				var actual, prefix;

				prefix = 'dev:';
				actual = factory.create(prefix, taskInfo, taskConfig, recipe);
				assertConfigurableTask(actual, prefix + taskInfo.name);
				expect(actual.displayName).to.equal(prefix + taskInfo.name);
				expect(registry.get(prefix + taskInfo.name)).to.be.a('function');
			});
			it('should accept sub-tasks', function () {
				var actual, tasks;

				tasks = [];
				actual = factory.create('', taskInfo, taskConfig, recipe, tasks);
				expect(actual.tasks).to.be.an('array');
			});
			it('should invoke configurableRunner() method when act as a configurable task: invoked via configurableRunner.run()', function () {
				var context = {
					gulp: gulp,
					config: taskConfig
				};
				var actual;

				actual = factory.create('', taskInfo, taskConfig, recipe);
				assertConfigurableTask(actual, taskInfo.name);

				actual.run.call(context, done);
				expect(recipe.calledOn(context)).to.be.true;
				expect(recipe.calledWith(done)).to.be.true;
			});
			it('should invoke configurableRunner() when act as a gulp task: invoked directly', function () {
				var context = {
					gulp: gulp,
					config: taskConfig,
					helper: Configuration
				};
				var actual;

				actual = factory.create('', taskInfo, taskConfig, recipe);
				assertConfigurableTask(actual, taskInfo.name);

				actual(done);
				expect(recipe.thisValues[0]).to.deep.equal(context);
				expect(recipe.calledWith(done)).to.be.true;
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
					config: injectConfig,
					helper: Configuration
				};
				var actual;

				actual = factory.create('', taskInfo, templateConfig, recipe);
				assertConfigurableTask(actual, taskInfo.name);

				actual.run.call(context, done);
				expect(recipe.thisValues[0].config).to.deep.equal(expectedConfig);
			});
		});
		describe('#one()', function () {
			it('should be able to resolve to a recipe task', function () {
				var name = 'task-task';
				var config = {
					name: name
				};
				var actual;

				actual = factory.one('', config, {});
				assertConfigurableTask(actual, name);
			});
			it('should be able to resolve to a flow task', function () {
				var name = 'flow-task';
				var config = {
					name: name
				};
				var actual;

				actual = factory.one('', config, {});
				assertConfigurableTask(actual, name);
			});
			it('should be able to resolve to a stream task', function () {
				var name = 'stream-task';
				var config = {
					name: name
				};
				var actual;

				actual = factory.one('', config, {});
				assertConfigurableTask(actual, name);
			});
			it('should resolve a non-existent-recipe-with-sub-task-configs to a parallel flow task', function () {
				var name = 'non-existent-recipe-with-sub-task-configs';
				var config = {
					name: name,
					'recipe-task': {},
					'stream-task': {},
					'non-existent-but-with-src-and-dest-defined': {
						src: 'src',
						dest: 'dist'
					}
				};
				var actual;

				actual = factory.one('', config, {});
				assertConfigurableTask(actual, name);
				expect(actual.recipe.displayName).to.equal('<parallel>');
			});
			it('should not throw even can not resolve to a task', function () {
				var name = 'non-existent';
				var config = {
					name: name
				};
				var actual;

				actual = factory.one('', config, {});
				assertConfigurableTask(actual, name);
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
