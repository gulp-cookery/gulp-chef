'use strict';

var Sinon = require('sinon'),
	Chai = require('chai'),
	expect = Chai.expect;

var _ = require('lodash');

var base = process.cwd();

var ConfigurableRecipeFactory = require(base + '/src/core/configurable_recipe_factory'),
	ConfigurationError = require(base + '/src/core/configuration_error'),
	Registry = require(base + '/src/core/registry');

var FakeFactory = require(base + '/test/fake/factory');
var createFakeStuff = require(base + '/test/fake/stuff');

describe('Core', function () {
	describe('ConfigurableRecipeFactory', function () {
		var gulp, factory, registry, stuff, gulpTask, subTasks, asObject, asArray,
			configurableTask, createConfigurableTasks;

		function done(err) {
		}

		beforeEach(function () {
			registry = new Registry();
			stuff = createFakeStuff();
			createConfigurableTasks = Sinon.spy(function (prefix, subTaskConfigs) {
				return subTasks = _.map(subTaskConfigs, function (config, name) {
					return FakeFactory.createSpyConfigurableTask(name);
				});
			});
			factory = new ConfigurableRecipeFactory(stuff, registry);
			gulp = FakeFactory.createFakeGulp();

			// task: gulp-task
			gulpTask = gulp.task('gulp-task');

			// task: configurable-task
			configurableTask = gulp.task('configurable-task');

			asObject = {
				task1: {},							// sub-config task
				task2: 'gulp-task-by-ref',			// reference to registered gulp task
				task3: 'configurable-task-by-ref',	// reference to registered configurable task
				task4: gulpTask,					// registered gulp task
				task5: configurableTask,			// registered configurable task
				task6: Sinon.spy()					// stand-alone gulp task (not registered to gulp)
			};
			asArray = [
				{ name: 'task1' },					// sub-config task
				'gulp-task-by-ref',					// reference to registered gulp task
				'configurable-task-by-ref',			// reference to registered configurable task
				gulpTask,							// registered gulp task
				configurableTask,					// registered configurable task
				Sinon.spy()							// stand-alone gulp task (not registered to gulp)
			];
		});

		function flexibleSubTaskTypes(method, recipes) {
			describe('flexible sub-task types', function () {
				var prefix;

				prefix = '';

				[{
					name: 'should be able to take sub-tasks as an object',
					subTaskConfigs: 'object'
				}, {
					name: 'should be able to take sub-tasks as an array',
					subTaskConfigs: 'array'
				}].forEach(test);

				function test(testCase) {
					it(testCase.name, function () {
						recipes.forEach(function (name) {
							var configs = _configs(name, testCase.subTaskConfigs, testCase.task);
							var actual = factory[method](prefix, configs, createConfigurableTasks);
							expect(actual).to.be.a('function');
						});
					});
				}

				function _configs(name, subTaskConfigs, task) {
					var result = {
						taskInfo: {
							name: name
						},
						taskConfig: {
						}
					};
					if (subTaskConfigs) {
						result.subTaskConfigs = (typeof subTaskConfigs === 'string') ? get(subTaskConfigs) : subTaskConfigs;
					} else if (task) {
						result.taskInfo.task = (typeof task === 'string') ? get(task) : task;
					}
					return result;

					function get(type) {
						return type === 'object' ? asObject : asArray;
					}
				}
			});
		}

		describe('#task()', function () {
			var name = 'recipe-task',
				configs = {
					taskInfo: {
						name: name
					},
					taskConfig: {
						id: 'recipe-config'
					}
				};
			it('should return a task recipe', function () {
				var actual = factory.task(name, configs);
				expect(actual).to.be.a('function');
			});
			it('should refer to correct recipe', function () {
				var actual = factory.task(name, configs);
				actual(gulp, configs.taskConfig, null, done);
				expect(stuff.tasks.lookup(name).called).to.be.true;
				expect(stuff.tasks.lookup(name).calledWithExactly(gulp, configs.taskConfig, null, done)).to.be.true;
			});
		});
		describe('#flow()', function () {
			flexibleSubTaskTypes('flow', ['series', 'parallel']);
		});
		describe('#stream()', function () {
			var prefix = '',
				configs = {
					taskInfo: {
						name: 'stream-task'
					},
					taskConfig: {
					},
					subTaskConfigs: {
						task1: {},
						task2: {}
					}
				};

			it('should return a stream recipe', function () {
				var actual = factory.stream(prefix, configs, createConfigurableTasks);
				expect(actual).to.be.a('function');
			});

			flexibleSubTaskTypes('stream', ['queue', 'merge']);
		});
		describe('#reference()', function () {
			it('should throw at runtime if the referring task not found', function () {
				var ctx = {
					gulp: gulp,
					config: {}
				};
				var actual = factory.reference('non-existent');
				expect(function () { actual.call(ctx, done); }).to.throw(ConfigurationError);
			});

			it('should wrap a normal gulp task', function () {
				var ctx = {
					gulp: gulp,
					config: {}
				};
				var actual = factory.reference(gulpTask.displayName);
				expect(actual).to.be.a('function');
				actual.call(ctx, done);
				expect(gulpTask.calledOn(ctx)).to.be.true;
				expect(gulpTask.calledWithExactly(done)).to.be.true;
			});

			it("should call target's run() at runtime if already a ConfigurableTask", function () {
				var ctx = {
					gulp: gulp,
					config: {}
				};
				var actual = factory.reference(configurableTask.displayName);
				expect(actual).to.be.a('function');
				actual.call(ctx, done);
				expect(configurableTask.run.calledOn(ctx)).to.be.true;
				expect(configurableTask.run.calledWithExactly(done)).to.be.true;
			});
		});
	});
});
