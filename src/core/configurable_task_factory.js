'use strict';
var _ = require('lodash'),
	log = require('gulp-util').log;

var Configuration = require('./configuration'),
	ConfigurationError = require('./configuration_error'),
	UniqueNames = require('../helpers/unique_names'),
	metadata = require('./metadata');

function ConfigurableTaskFactory(stuff, runnerFactory, registry) {
	this.stuff = stuff;
	this.runnerFactory = runnerFactory;
	this.registry = registry;
}

function buildMetadataTree(task, subTasks) {
	var nodes;

	if (subTasks) {
		nodes = subTasks.map(function (task) {
			var meta = metadata.get(task);
			return meta.tree;
		});
	} else {
		nodes = [];
	}
	metadata.set(task, task.displayName, nodes);
}

ConfigurableTaskFactory.prototype.one = function (prefix, name, rawConfig, parentConfig) {
	var self, stuff, schema, configs, taskInfo, runner, task, subTasks;

	self = this;
	stuff = this.stuff;

	taskInfo = Configuration.getTaskRuntimeInfo(name);

	if (rawConfig.debug) {
		debugger;
	}

	schema = getTaskSchema(taskInfo.name);
	configs = Configuration.sort(taskInfo, rawConfig, parentConfig, schema);

	if (Configuration.isDisabled(configs.taskInfo)) {
		return null;
	}

	runner = this.runnerFactory.create(prefix, configs, createSubTasks);
	if (! runner) {
		log("Warning: can't infer to a proper recipe task: " + taskInfo.name + ': task will do nothing.');
		runner = function (gulp, config, stream, done) { done(); };
	}
	task = this.create(prefix, taskInfo, configs.taskConfig, runner);
	buildMetadataTree(task, subTasks);
	return task;

	function getTaskSchema(name) {
		var configurableTask = stuff.streams.lookup(name) || stuff.recipes.lookup(name);
		return configurableTask && configurableTask.schema;
	}

	function createSubTasks(prefix, subTaskConfigs, parentConfig) {
		subTasks = self.multiple(prefix, subTaskConfigs, parentConfig);
		return subTasks;
	}
};

ConfigurableTaskFactory.prototype.multiple = function (prefix, subTaskConfigs, parentConfig) {
	var self;

	self = this;
	subTaskConfigs = _array() || _object();
	return subTaskConfigs.reduce(function (tasks, config) {
		var task = self.one(prefix, config.name, config, parentConfig);
		if (task) {
			tasks.push(task);
		}
		return tasks;
	}, []);

	function _array() {
		var names;

		if (Array.isArray(subTaskConfigs)) {
			names = new UniqueNames();
			return subTaskConfigs.map(objectify).map(uniquify);
		}

		function objectify(config) {
			if (typeof config === 'string') {
				config = {
					name: config,
					task: config
				};
			} else if (typeof config === 'function') {
				config = {
					name: config.displayName || config.name,
					task: config
				};
			}
			names.put(config.name);
			return config;
		}

		function uniquify(config) {
			config.name = names.get(config.name);
			return config;
		}
	}

	function _object() {
		var orders;

		if (_.isPlainObject(subTaskConfigs)) {
			orders = 0;
			subTaskConfigs = _.map(subTaskConfigs, uniquify);	// NOTE: becomes an array
			return sort(subTaskConfigs);
		}

		function uniquify(config, name) {
			if ('order' in config) {
				++orders;
			}
			config.name = name;
			return config;
		}

		function sort(subTaskConfigs) {
			if (orders !== 0) {
				if (orders !== _.size(subTaskConfigs)) {
					throw new ConfigurationError('ConfigurableTaskFactory', 'some sub-tasks defined "order" some don\'t, don\'t know how to sort');
				}
				subTaskConfigs = subTaskConfigs.sort(comparator);
			}
			return subTaskConfigs;
		}

		function comparator(a, b) {
			if ('order' in a && 'order' in b) {
				return a.order - b.order;
			}
			// try to make it a stable sort even if 'order' property not present.
			return 0;
		}
	}

	function create(tasks, prefix, taskConfig, parentConfig) {
		var task = self.one(prefix, taskConfig.name, taskConfig, parentConfig);
		if (task) {
			tasks.push(task);
		}
		return tasks;
	}
};

ConfigurableTaskFactory.prototype.create = function (prefix, taskInfo, taskConfig, configurableRunner) {
	var registry = this.registry;
	// make sure config is inherited at config time and injected, realized at runtime.
	// invoked from stream processor
	var run = function (gulp, injectConfig, stream, done) {
		// inject and realize runtime configuration.
		var config = Configuration.realize(taskConfig, injectConfig, configurableRunner.defaults);
		return configurableRunner(gulp, config, stream, done);
	};
	// invoked from gulp
	var configurableTask = function (done) {
		// NOTE: gulp 4.0 task are called on undefined context. So we need gulp reference from registry here.
		return run(registry.gulp, taskConfig, null, done);
	};
	var name = (taskInfo.name || configurableRunner.displayName || configurableRunner.name || '<anonymous>');
	configurableTask.displayName = prefix + name;
	configurableTask.description = taskInfo.description || configurableRunner.description || '';
	configurableTask.visibility = taskInfo.visibility;
	configurableTask.runtime = taskInfo.runtime;
	configurableTask.run = run;
	configurableTask.config = taskConfig;
	if (Configuration.isVisible(configurableTask)) {
		this.registry.set(configurableTask.displayName, configurableTask);
		metadata.set(configurableTask, configurableTask.displayName);
	} else {
		metadata.set(configurableTask, '<' + name + '>');
	}
	return configurableTask;
};

module.exports = ConfigurableTaskFactory;
