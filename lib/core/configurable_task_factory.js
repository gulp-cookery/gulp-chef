/* eslint consistent-this: 0 */
'use strict';

var _ = require('lodash');
var log = require('gulp-util').log;

var Configuration = require('./configuration');
var metadata = require('./metadata');

function ConfigurableTaskFactory(stuff, recipeFactory, registry) {
	this.stuff = stuff;
	this.recipeFactory = recipeFactory;
	this.registry = registry;
}

ConfigurableTaskFactory.prototype.one = function (prefix, rawName, rawConfig, parentConfig) {
	var self, configs, taskInfo, recipe, task, subTasks, childPrefix;

	self = this;

	taskInfo = Configuration.getTaskRuntimeInfo(rawName, rawConfig);
	recipe = this.recipeFactory.create(taskInfo, rawConfig);
	if (!recipe) {
		log("Warning: can't infer to a proper recipe task: " + taskInfo.name);
		return null;
	}

	configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
	if (Configuration.isDisabled(configs.taskInfo)) {
		return null;
	}

	task = this.create(prefix, taskInfo, configs.taskConfig, recipe);

	if (_.size(configs.subTaskConfigs)) {
		childPrefix = Configuration.isVisible(configs.taskInfo) ? prefix + configs.taskInfo.name + ':' : prefix;
		subTasks = self.multiple(childPrefix, configs.subTaskConfigs, configs.taskConfig);
		recipe.setSubTasks(subTasks);
		metadata.build(task, subTasks);
	}
	return task;
};

ConfigurableTaskFactory.prototype.multiple = function (prefix, subTaskConfigs, parentConfig) {
	var self;

	self = this;
	return (array() || arrayify()).reduce(function (result, config) {
		var task;

		task = self.one(prefix, config.name, config, parentConfig);
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
					name: value,
					task: value
				};
			}
			if (typeof value === 'function') {
				return {
					name: value.displayName || value.name || 'anonymous',
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
			config: taskConfig
		};
		return run.call(context, done);
	};

	name = taskInfo.name || recipe.displayName || recipe.name || '<anonymous>';
	configurableTask.displayName = name;
	set(configurableTask, 'description', taskInfo.description || recipe.description);
	set(configurableTask, 'visibility', taskInfo.visibility);
	set(configurableTask, 'runtime', taskInfo.runtime);
	configurableTask.recipe = recipe;
	configurableTask.run = run;
	configurableTask.config = taskConfig;
	// TODO: also keep raw config for problem diagnosis?
	if (Configuration.isVisible(configurableTask)) {
		this.registry.set(prefix + configurableTask.displayName, configurableTask);
		metadata.set(configurableTask, configurableTask.displayName);
	} else {
		metadata.set(configurableTask, '<' + name + '>');
	}
	return configurableTask;

	function set(target, property, value) {
		if (typeof value !== 'undefined') {
			target[property] = value;
		}
	}
};

module.exports = ConfigurableTaskFactory;
