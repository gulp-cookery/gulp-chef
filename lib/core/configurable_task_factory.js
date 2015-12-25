/* eslint consistent-this: 0 */
'use strict';

var _ = require('lodash');
var log = require('gulp-util').log;

var Configuration = require('./configuration');
var ConfigurationError = require('./configuration_error');
var UniqueNames = require('../helpers/unique_names');
var metadata = require('./metadata');

function ConfigurableTaskFactory(stuff, recipeFactory, registry) {
	this.stuff = stuff;
	this.recipeFactory = recipeFactory;
	this.registry = registry;
}

function buildMetadataTree(prefix, task, subTasks) {
	var nodes;

	if (subTasks) {
		nodes = subTasks.map(function (subTask) {
			var meta;

			meta = metadata.get(subTask);
			return meta.tree;
		});
	} else {
		nodes = [];
	}
	metadata.set(task, prefix + task.displayName, nodes);
}

ConfigurableTaskFactory.prototype.one = function (prefix, name, rawConfig, parentConfig) {
	var self, stuff, schema, configs, taskInfo, recipe, task, subTasks;

	self = this;
	stuff = this.stuff;

	taskInfo = Configuration.getTaskRuntimeInfo(name);

	schema = getTaskSchema(taskInfo.name);
	configs = Configuration.sort(taskInfo, rawConfig, parentConfig, schema);

	if (Configuration.isDisabled(configs.taskInfo)) {
		return null;
	}

	recipe = this.recipeFactory.create(configs);
	if (!recipe) {
		log("Warning: can't infer to a proper recipe task: " + taskInfo.name + ': task will do nothing.');
		recipe = this.recipeFactory.noop();
	}
	task = this.create(prefix, taskInfo, configs.taskConfig, recipe);
	buildMetadataTree(prefix, task, subTasks);
	return task;

	function getTaskSchema(taskName) {
		var configurableTask;

		configurableTask = stuff.flows.lookup(taskName) || stuff.streams.lookup(taskName) || stuff.tasks.lookup(taskName);
		return configurableTask && configurableTask.schema;
	}

	function createSubTasks(_prefix, _subTaskConfigs, _parentConfig) {
		subTasks = self.multiple(_prefix, _subTaskConfigs, _parentConfig);
		return subTasks;
	}
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
	configurableTask.displayName = prefix + name;
	set(configurableTask, 'description', taskInfo.description || recipe.description);
	set(configurableTask, 'visibility', taskInfo.visibility);
	set(configurableTask, 'runtime', taskInfo.runtime);
	configurableTask.recipe = recipe;
	configurableTask.run = run;
	configurableTask.config = taskConfig;
	// TODO: also keep raw config for problem diagnosis?
	if (Configuration.isVisible(configurableTask)) {
		this.registry.set(configurableTask.displayName, configurableTask);
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
