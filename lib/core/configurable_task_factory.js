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

function buildMetadataTree(task, subTasks) {
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
	metadata.set(task, task.displayName, nodes);
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

	recipe = this.recipeFactory.create(prefix, configs, createSubTasks);
	if (!recipe) {
		log("Warning: can't infer to a proper recipe task: " + taskInfo.name + ': task will do nothing.');
		recipe = this.recipeFactory.noop();
	}
	task = this.create(prefix, taskInfo, configs.taskConfig, recipe);
	buildMetadataTree(task, subTasks);
	return task;

	function getTaskSchema(taskName) {
		var configurableTask;

		configurableTask = stuff.streams.lookup(taskName) || stuff.tasks.lookup(taskName);
		return configurableTask && configurableTask.schema;
	}

	function createSubTasks(_prefix, _subTaskConfigs, _parentConfig) {
		return self.multiple(_prefix, _subTaskConfigs, _parentConfig);
	}
};

ConfigurableTaskFactory.prototype.multiple = function (prefix, subTaskConfigs, parentConfig) {
	var self;

	self = this;
	return (_array() || _arrayify()).reduce(function (tasks, config) {
		var task;

		task = self.one(prefix, config.name, config, parentConfig);
		if (task) {
			tasks.push(task);
		}
		return tasks;
	}, []);

	function _array() {
		var names;

		if (Array.isArray(subTaskConfigs)) {
			names = new UniqueNames();
			return subTaskConfigs.map(objectify).map(preuniquify).map(uniquify);
		}

		function preuniquify(config) {
			names.put(config.name);
			return config;
		}

		function uniquify(config) {
			config.name = names.get(config.name);
			return config;
		}
	}

	function _arrayify() {
		var orders, arrayConfigs;

		if (_.isPlainObject(subTaskConfigs)) {
			orders = 0;
			arrayConfigs = _.map(subTaskConfigs, uniquify).map(objectify);	// NOTE: becomes an array
			return sort(arrayConfigs);
		}

		function uniquify(config, name) {
			if (_.isPlainObject(config)) {
				if ('order' in config) {
					++orders;
				}
				config.name = name;
			}
			return config;
		}

		function sort(_subTaskConfigs) {
			if (orders !== 0) {
				if (orders !== _.size(_subTaskConfigs)) {
					throw new ConfigurationError('ConfigurableTaskFactory', 'some sub-tasks defined "order" some don\'t, don\'t know how to sort');
				}
				return _subTaskConfigs.sort(comparator);
			}
			return _subTaskConfigs;
		}

		function comparator(a, b) {
			if ('order' in a && 'order' in b) {
				return a.order - b.order;
			}
			// try to make it a stable sort even if 'order' property not present.
			return 0;
		}
	}

	function objectify(value) {
		if (typeof value === 'string') {
			return {
				name: value,
				task: value
			};
		} else if (typeof value === 'function') {
			return {
				name: value.displayName || value.name,
				task: value
			};
		}
		return value;
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
	// TODO: also keep raw config?
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
