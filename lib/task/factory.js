'use strict';

var log = require('gulplog');
var _ = require('lodash');
var from = require('../helpers/dataflow');

var PluginError = require('gulp-util').PluginError;
var Configuration = require('../configuration');
var metadata = require('./metadata');
var profile = require('./profile');

var SCHEMA_TASK = require('../schema/task.json');
var TASK_METADATAS = Object.keys(SCHEMA_TASK.properties);

var REGEX_RUNTIME_OPTIONS = /^([.#]?)([_\w][-_:\s\w]*)$/;

var CONSTANT = {
	VISIBILITY: {
		/** hidden configurable task can't be run from cli, but still functional */
		HIDDEN: '.',
		/** disabled configurable task is not processed and not functional, including all it's descendants */
		DISABLED: '#',
		/** normal configurable task can be run from cli */
		NORMAL: ''
	}
};

/**
 * NOTE: Config is inherited at config time and injected, realized at runtime.
 */
function ConfigurableTaskFactory(recipes, registry, expose) {
	this.recipes = recipes;
	this.registry = registry;
	this.expose = expose;
}

function getTaskRuntimeInfo(rawConfig) {
	var match, name, taskInfo;

	taskInfo = from(rawConfig).to({}).move(TASK_METADATAS);

	if (taskInfo.name) {
		name = _.trim(taskInfo.name);
		match = REGEX_RUNTIME_OPTIONS.exec(name);
		if (!match) {
			throw new PluginError(__filename, 'invalid task name: ' + name);
		}

		taskInfo.name = match[2] || name;

		if (match[1]) {
			taskInfo.visibility = match[1];
		}
	}

	return taskInfo;
}

function isVisible(task) {
	return task.name && task.visibility === CONSTANT.VISIBILITY.NORMAL || !('visibility' in task);
}

function isDisabled(task) {
	return task.visibility === CONSTANT.VISIBILITY.DISABLED;
}

ConfigurableTaskFactory.CONSTANT = CONSTANT;
ConfigurableTaskFactory.getTaskRuntimeInfo = getTaskRuntimeInfo;
ConfigurableTaskFactory.isVisible = isVisible;
ConfigurableTaskFactory.isDisabled = isDisabled;

ConfigurableTaskFactory.prototype.one = function (prefix, rawConfig, parentConfig) {
	var self, recipes, taskInfo;

	self = this;
	recipes = this.recipes;

	taskInfo = getTaskRuntimeInfo(rawConfig);
	if (isDisabled(taskInfo)) {
		return null;
	}

	return simple() || auxiliary() || reference() || composite() || noop();

	// Simple task should show up in task tree and cli, unless anonymous.
	function simple() {
		var recipe, configs;

		recipe = recipes.inline(taskInfo) || recipes.plugin(taskInfo) || recipes.task(taskInfo);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
			if (!configs.taskInfo.name) {
				configs.taskInfo.visibility = CONSTANT.VISIBILITY.HIDDEN;
			}
			return self.create(prefix, configs.taskInfo, configs.taskConfig, recipe);
		}
	}

	// Reference task should show up in task tree and cli, unless anonymous.
	// Skip metadata for reference task on purpose.
	//   (The task tree was already too complicated, no reason to duplicate information.)
	function reference() {
		var recipe, configs, wrapper, result, displayName, missingName;

		recipe = recipes.reference(taskInfo, resolved);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig);
			displayName = recipe.displayName + ' (reference)';
			missingName = recipe.displayName + ' (missing reference)';
			wrapper = self.create(prefix, {
				name: displayName,
				type: 'reference',
				visibility: CONSTANT.VISIBILITY.HIDDEN
			}, configs.taskConfig, recipe);
			// setup reference missing warning.
			wrapper.displayName = missingName;
			metadata.set(wrapper, missingName);
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
			// remove reference missing warning message.
			wrapper.displayName = displayName;
			metadata.set(wrapper, displayName);
		}
	}

	// Auxiliary task should show up in task tree, but not in cli by default for simplicity.
	function auxiliary() {
		var recipe, configs, tasks;

		recipe = recipes.stream(taskInfo) || recipes.flow(taskInfo);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
			if (configs.taskInfo.name !== 'watch' && (!configs.taskInfo.name || !('visibility' in configs.taskInfo))) {
				configs.taskInfo.visibility = CONSTANT.VISIBILITY.HIDDEN;
				configs.taskInfo.name = '<' + configs.taskInfo.name + '>';
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
				visibility: CONSTANT.VISIBILITY.HIDDEN
			}, configs.taskConfig, recipe, tasks);
			if (configs.taskInfo.name) {
				return self.create(prefix, configs.taskInfo, configs.taskConfig, wrapper, [wrapper]);
			}
			configs.taskInfo.visibility = CONSTANT.VISIBILITY.HIDDEN;
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
	var registry = this.registry;
	var branch = tasks && tasks.length > 0;
	var name, runner;

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

		function stop(err) {
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
	set(configurableTask, 'recipe', taskInfo.recipe);
	set(configurableTask, 'recipeInstance',  taskInfo.recipeInstance || recipe);
	configurableTask.fullName = prefix + name;
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
