/* eslint consistent-this: 0 */
'use strict';

var _ = require('lodash');
var log = require('gulp-util').log;

var Settings = require('../settings');
var Configuration = require('../core/configuration');
var metadata = require('./metadata');

function ConfigurableTaskFactory(stuff, recipeFactory, registry) {
	this.stuff = stuff;
	this.recipeFactory = recipeFactory;
	this.registry = registry;
}

function isVisible(task) {
	return task.visibility === Configuration.CONSTANT.VISIBILITY.NORMAL || !('visibility' in task);
}

function isDisabled(task) {
	return task.visibility === Configuration.CONSTANT.VISIBILITY.DISABLED;
}

ConfigurableTaskFactory.prototype.one = function (prefix, rawConfig, parentConfig) {
	var self, configs, taskInfo, recipe, task, tasks;

	self = this;

	taskInfo = Configuration.getTaskRuntimeInfo(rawConfig);

	recipe = this.recipeFactory.create(taskInfo);
	if (!recipe) {
		log('configure', "warning: can't infer to a proper recipe task: " + taskInfo.name);
		return null;
	}

	configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
	if (isDisabled(configs.taskInfo)) {
		return null;
	}

	task = this.create(prefix, taskInfo, configs.taskConfig, recipe);

	if (configs.taskInfo.task || _.size(configs.subTaskConfigs)) {
		if (recipe.type === 'task') {
			log('configure', "warning: recipe don't accept sub tasks");
		} else {
			if (_.size(configs.subTaskConfigs) !== 0 && configs.taskInfo.task) {
				log('configure', 'warning: both "task" and sub tasks provided, ');
			}
			tasks = configs.taskInfo.task || configs.subTaskConfigs;
			tasks = self.multiple(_prefix(), tasks, configs.taskConfig);
			metadata.tree(task, tasks);
			task.tasks = tasks;
		}
	}
	return task;

	function _prefix() {
		return isVisible(configs.taskInfo) ? prefix + configs.taskInfo.name + ':' : prefix;
	}
};

ConfigurableTaskFactory.prototype.multiple = function (prefix, subTaskConfigs, parentConfig) {
	var self;

	self = this;
	return (array() || arrayify()).reduce(function (result, config) {
		var task;

		task = self.one(prefix, config, parentConfig);
		if (task) {
			result.push(task);
		}
		return result;
	}, []);

	function array() {
		if (Array.isArray(subTaskConfigs)) {
			return subTaskConfigs.map(objectify);
		}

		function objectify(value) {
			if (_.isPlainObject(value)) {
				value.name = value.name || 'anonymous';
				return value;
			}
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
			// array etc.
			return {
				task: value
			};
		}
	}

	function arrayify() {
		if (_.isPlainObject(subTaskConfigs)) {
			return _.map(subTaskConfigs, objectify)	// NOTE: becomes an array
				.sort(comparator);
		}
		return [{
			task: subTaskConfigs
		}];

		function objectify(value, name) {
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

ConfigurableTaskFactory.prototype.create = function (prefix, taskInfo, taskConfig, recipe) {
	var name;

	var registry = this.registry;

	// make sure config is inherited at config time and injected, realized at runtime.
	// invoked from stream processor
	var run = function (done) {
		var context;

		context = this;
		// inject and realize runtime configuration.
		context.config = Configuration.realize(taskConfig, context.config);
		return recipe.call(context, done);
	};
	// invoked from gulp
	var configurableTask = function (done) {
		var context;

		// NOTE: gulp 4.0 task are called on undefined context. So we need gulp reference from registry here.
		context = {
			gulp: registry.gulp,
			config: taskConfig,
			helper: Configuration
		};
		if (configurableTask.tasks) {
			context.tasks = configurableTask.tasks;
		}
		return run.call(context, done);
	};

	name = taskInfo.name || recipe.displayName || recipe.name || '<anonymous>';
	run.schema = configurableTask.schema;
	configurableTask.displayName = run.displayName = prefix + name;
	set(configurableTask, 'description', taskInfo.description || recipe.description);
	set(configurableTask, 'visibility', taskInfo.visibility);
	set(configurableTask, 'runtime', taskInfo.runtime);
	configurableTask.recipe = recipe;
	configurableTask.run = run;
	configurableTask.config = taskConfig;
	// TODO: also keep raw config for problem diagnosis?
	if (isVisible(configurableTask)) {
		this.registry.set(prefix + name, configurableTask);
		metadata.set(configurableTask, prefix + name);
	} else {
		metadata.set(configurableTask, name);
	}
	return configurableTask;

	function set(target, property, value) {
		if (typeof value !== 'undefined') {
			target[property] = value;
		}
	}
};

module.exports = ConfigurableTaskFactory;
