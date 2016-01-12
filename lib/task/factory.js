'use strict';

var _ = require('lodash');
var log = require('gulplog');

var Configuration = require('../configuration');
var metadata = require('./metadata');

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
			// TODO: add running time profile.
			if (configs.taskInfo.name) {
				wrapper = self.create(prefix, {
					visibility: '.'
				}, configs.taskConfig, recipe);
				result = self.create(prefix, configs.taskInfo, configs.taskConfig, wrapper, [wrapper]);
			} else {
				configs.taskInfo.visibility = '.';
				result = self.create(prefix, configs.taskInfo, configs.taskConfig, recipe);
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
			// TODO: add running time profile.
			tasks = createTasks(configs);
			return self.create(prefix, configs.taskInfo, configs.taskConfig, recipe, tasks);
		}
	}

	// Composite task should show up in task treem, and show up in cli if holding task is a named task.
	function composite() {
		var configs, type, recipe, tasks, wrapper;

		configs = Configuration.sort(taskInfo, rawConfig, parentConfig);
		tasks = configs.taskInfo.parallel || configs.taskInfo.series || configs.taskInfo.task || configs.subTaskConfigs;
		type = _multiple();
		if (type) {
			tasks = createTasks(configs);
			// NOTE: must call gulp's series or parallel to profile task's running time.
			recipe = function (done) {
				var fn;

				// TODO: use async.map, async.series rather then gulp.parallel, gulp.series.
				fn = this.gulp[type].apply(null, tasks);
				return fn.call(this, done);
			};
			recipe.displayName = '<' + type + '>';
			if (configs.taskInfo.name) {
				wrapper = self.create(prefix, {
					visibility: '.'
				}, configs.taskConfig, recipe, tasks);
				return self.create(prefix, configs.taskInfo, configs.taskConfig, wrapper, [wrapper]);
			}
			configs.taskInfo.visibility = '.';
			return self.create(prefix, configs.taskInfo, configs.taskConfig, recipe, tasks);
		}

		if (_forward()) {
			// TODO: add running time profile.
			tasks = createTasks(configs);
			recipe = function (done) {
				return tasks[0].call(this, done);
			};
			return self.create(prefix, configs.taskInfo, configs.taskConfig, recipe, tasks);
		}

		function _multiple() {
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

	function configurableTask(done) {
		var context;

		// NOTE: gulp 4.0 task are called on undefined context.
		// So,
		//   1.We need gulp reference from registry here.
		//     see: [Gulp 4: invoke task on gulp context](https://github.com/gulpjs/gulp/issues/1377)
		//   2.If `this` is undefined, then this task was invoked from gulp.
		//   3.If `this` is defined, then this task was invoked from another configurable task.
		context = {
			gulp: registry.gulp,
			// inject and realize runtime configuration.
			config: this ? Configuration.realize(taskConfig, this.config) : taskConfig,
			helper: Configuration,
			upstream: this ? this.upstream : null,
			tasks: tasks
		};
		return recipe.call(context, done);
	}

	name = taskInfo.name || recipe.displayName || recipe.name || '<anonymous>';
	set(configurableTask, 'description', taskInfo.description || recipe.description);
	set(configurableTask, 'visibility', taskInfo.visibility);
	set(configurableTask, 'runtime', taskInfo.runtime);
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
