'use strict';


var async = require('async');
var asyncDone = require('async-done');
var log = require('gulplog');
var _ = require('lodash');

var Configuration = require('../configuration');
var metadata = require('./metadata');
var profile = require('./profile');

/**
 * NOTE: Config is inherited at config time and injected, realized at runtime.
 */
function ConfigurableTaskFactory(recipes, registry, expose) {
	this.recipes = recipes;
	this.registry = registry;
	this.expose = expose;
}

function isVisible(task) {
	return task.name && task.visibility === Configuration.CONSTANT.VISIBILITY.NORMAL || !('visibility' in task);
}

function isDisabled(task) {
	return task.visibility === Configuration.CONSTANT.VISIBILITY.DISABLED;
}

ConfigurableTaskFactory.prototype.one = function (prefix, rawConfig, parentConfig) {
	var self, recipes, taskInfo;

	self = this;
	recipes = this.recipes;

	taskInfo = Configuration.getTaskRuntimeInfo(rawConfig);
	if (isDisabled(taskInfo)) {
		return null;
	}

	return simple() || reference() || auxiliary() || composite() || noop();

	// Simple task should show up in task tree and cli, unless anonymous.
	function simple() {
		var recipe, configs;

		recipe = recipes.inline(taskInfo) || recipes.plugin(taskInfo) || recipes.task(taskInfo);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
			if (!configs.taskInfo.name) {
				configs.taskInfo.visibility = '.';
			}
			return self.create(prefix, configs.taskInfo, configs.taskConfig, recipe);
		}
	}

	// Reference task should show up in task tree and cli, unless anonymous.
	// Skip metadata for reference task on purpose.
	//   (The task tree was already too complicated, no reason to duplicate information.)
	function reference() {
		var recipe, configs, wrapper, result;

		recipe = recipes.reference(taskInfo, resolved);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig);
			wrapper = self.create(prefix, {
				name: '<reference> ' + recipe.displayName,
				type: 'reference',
				visibility: '.'
			}, configs.taskConfig, recipe);
			if (configs.taskInfo.name) {
				//
				//	parent: {
				//		target: 'build'
				//	}
				// or
				//	parent: [{
				//      name: 'target',
				//      task: 'build'
				//	}]
				// normalized to:
				//	parent: [{
				//      name: 'target',
				//      task: 'build'
				//	}]
				// realized to:
				// [{
				//     name: 'parent',
				//     tasks: [{
				// 		   name: 'target',
				//         tasks: [{
				//             name: '<reference> build',
   				//             task: function () {}
				//         }]
				//     }]
				// }]
				// tree:
				//  └─┬ parent
				//    └─┬ target
				//      └── <reference> build
				result = self.create(prefix, configs.taskInfo, configs.taskConfig, wrapper, [wrapper]);
			} else {
				//	parent: [{
				//      task: 'build'
				//	}]
				// or
				// 	parent: ['build']
				// normalized to:
				//	parent: [{
				//      task: 'build'
				//	}]
				// realized to:
				// [{
				//     name: 'parent',
				//     tasks: [{
				// 		   name: '<anonymous>',
				//         tasks: [{
				// 		       name: '<reference> build',
				//             task: function () {}
				//         }]
				//     }]
				// }]
				// tree:
				//  └─┬ parent
				//    └── <reference> build
				result = wrapper;
			}
			return result;
		}

		function resolved(task) {
			// Watch task need refering target's config.
			result.config = task.config;
		}
	}

	// Auxiliary task should show up in task tree, but not in cli by default for simplicity.
	function auxiliary() {
		var recipe, configs, tasks;

		recipe = recipes.stream(taskInfo) || recipes.flow(taskInfo);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
			if (!configs.taskInfo.name || !('visibility' in configs.taskInfo)) {
				configs.taskInfo.visibility = '.';
				configs.taskInfo.name = '<' + configs.taskInfo.recipe + '>';
			}
			tasks = createTasks(configs);
			return self.create(prefix, configs.taskInfo, configs.taskConfig, recipe, tasks);
		}
	}

	// Composite task should show up in task treem, and show up in cli if holding task is a named task.
	function composite() {
		var configs, type, recipe, tasks, wrapper;

		configs = Configuration.sort(taskInfo, rawConfig, parentConfig);
		tasks = configs.taskInfo.parallel || configs.taskInfo.series || configs.taskInfo.task || configs.subTaskConfigs;
		type = _type();
		if (type) {
			tasks = createTasks(configs);
			recipe = recipes.flow({ recipe: type });
			wrapper = self.create(prefix, {
				name: '<' + type + '>',
				visibility: '.'
			}, configs.taskConfig, recipe, tasks);
			if (configs.taskInfo.name) {
				return self.create(prefix, configs.taskInfo, configs.taskConfig, wrapper, [wrapper]);
			}
			configs.taskInfo.visibility = '.';
			return wrapper;
		}

		if (_forward()) {
			tasks = createTasks(configs);
			recipe = function (done) {
				return tasks[0].call(this, done);
			};
			return self.create(prefix, configs.taskInfo, configs.taskConfig, recipe, tasks);
		}

		function _type() {
			if (configs.taskInfo.series) {
				return 'series';
			} else if (configs.taskInfo.parallel) {
				return 'parallel';
			} else if (_.size(tasks) > 1) {
				if (Array.isArray(tasks)) {
					return 'series';
				} else if (_.isPlainObject(tasks)) {
					return 'parallel';
				}
			}
		}

		function _forward() {
			return _.size(tasks) === 1;
		}
	}

	function noop() {
		if (!taskInfo.name) {
			taskInfo.name = '<anonymous>';
		}
		log.warn('configure:', 'the task "' + taskInfo.name + "\" won't do anything, misspelled a recipe name?");
		return self.create(prefix, taskInfo, {}, self.recipes.noop());
	}

	function createTasks(configs) {
		var tasksPrefix, tasks;

		tasks = configs.taskInfo.parallel || configs.taskInfo.series || configs.taskInfo.task || configs.subTaskConfigs;
		if (tasks && _.size(tasks)) {
			tasksPrefix = _tasksPrefix();
			return self.multiple(tasksPrefix, tasks, configs.taskConfig);
		}

		function _tasksPrefix() {
			return (isVisible(configs.taskInfo) && configs.taskInfo.name) ? prefix + configs.taskInfo.name + ':' : prefix;
		}
	}
};

ConfigurableTaskFactory.prototype.multiple = function (prefix, subTaskConfigs, parentConfig) {
	var self;

	self = this;
	return self.arrayify(subTaskConfigs).reduce(create, []);

	function create(result, config) {
		var task;

		task = self.one(prefix, config, parentConfig);
		if (task) {
			result.push(task);
		}
		return result;
	}
};

ConfigurableTaskFactory.prototype.arrayify = function (taskConfigs) {
	return _array() || _arrayify();

	function _array() {
		if (Array.isArray(taskConfigs)) {
			return _.flatten(taskConfigs).map(objectify);
		}

		function objectify(value) {
			if (typeof value === 'string') {
				return {
					task: value
				};
			}
			if (typeof value === 'function') {
				return {
					task: value
				};
			}
			if (_.isPlainObject(value)) {
				return value;
			}
			// array etc.
			return {
				task: value
			};
		}
	}

	function _arrayify() {
		if (_.isPlainObject(taskConfigs)) {
			return Object.keys(taskConfigs).map(objectify).sort(comparator);
		}
		return [{
			task: taskConfigs
		}];

		function objectify(name) {
			var value;

			value = taskConfigs[name];
			if (_.isPlainObject(value)) {
				value.name = name;
				return value;
			}
			return {
				name: name,
				task: value
			};
		}

		// tasks not defined "order" property defaults to 0
		function comparator(a, b) {
			return (a.order || 0) - (b.order || 0);
		}
	}
};

ConfigurableTaskFactory.prototype.create = function (prefix, taskInfo, taskConfig, recipe, tasks) {
	var name;

	var registry = this.registry;
	var branch = tasks && tasks.length > 0;
	var runner;

	if (taskInfo.spit) {
		runner = function (done) {
			var gulp, config;

			gulp = this.gulp;
			config = this.config;
			return recipe.call(this, done)
				.pipe(gulp.dest(config.dest.path, config.dest.options));
		};
	} else {
		runner = recipe;
	}

	function configurableTask(done) {
		var gulp, context, hrtime;

		// NOTE: gulp 4.0 task are called on undefined context.
		// So,
		//   1.We need gulp reference from registry here.
		//     see: [Gulp 4: invoke task on gulp context](https://github.com/gulpjs/gulp/issues/1377)
		//   2.If `this` is undefined, then this task was invoked from gulp.
		//   3.If `this` is defined, then this task was invoked from another configurable task.
		gulp = registry.gulp;
		context = {
			gulp: gulp,
			helper: Configuration
		};

		if (tasks) {
			context.tasks = tasks;
		}

		// this task was invoked by another task
		if (this) {
			// inject and realize runtime configuration
			context.config = Configuration.realize(taskConfig, this.config);
			if (this.upstream) {
				context.upstream = this.upstream;
			}
			if (taskInfo.type === 'reference') {
				return runner.call(context, done);
			}
			return profile(runner, context, done, start, stop);
		}

		// this task was invoked by gulp
		// (by gulp.parallel() actually, and that will show profile messages, so we don't do profile here.)
		context.config = Configuration.realize(taskConfig);
		return runner.call(context, done);

		function start() {
			if (name) {
				hrtime = process.hrtime();
				gulp.emit('start', {
					name: name,
					branch: branch,
					time: Date.now()
				});
			}
		}

		function stop(err, ret) {
			var event;

			if (name) {
				event = {
					name: name,
					branch: branch,
					time: Date.now(),
					duration: process.hrtime(hrtime)
				};
				if (err) {
					event.error = err;
					gulp.emit('error', event);
				} else {
					gulp.emit('stop', event);
				}
			}
		}
	}

	name = taskInfo.name || recipe.displayName || recipe.name || '<anonymous>';
	set(configurableTask, 'description', taskInfo.description || recipe.description);
	set(configurableTask, 'visibility', taskInfo.visibility);
	set(configurableTask, 'tasks', tasks);
	configurableTask.fullName = prefix + name;
	configurableTask.recipe = recipe;
	configurableTask.config = taskConfig;
	if (isVisible(configurableTask)) {
		name = this.expose(prefix, name);
		this.registry.set(name, configurableTask);
		configurableTask.displayName = name;
		metadata.set(configurableTask, name);
	} else {
		configurableTask.displayName = name;
		metadata.set(configurableTask, name);
	}
	if (tasks) {
		metadata.tree(configurableTask, tasks);
	}
	return configurableTask;

	function set(target, property, value) {
		if (typeof value !== 'undefined') {
			target[property] = value;
		}
	}
};

module.exports = ConfigurableTaskFactory;
