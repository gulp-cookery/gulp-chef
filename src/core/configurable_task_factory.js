'use strict';
var _ = require('lodash');

var Configuration = require('./configuration'),
	ConfigurationError = require('./configuration_error');

// NOTE: gulp 4.0 task are called on undefined context. So we need gulp reference here.
function ConfigurableTaskFactory(gulp, stuff, runnerFactory, gulpTaskRegistry) {
	this.gulp = gulp;
	this.stuff = stuff;
	this.runnerFactory = runnerFactory;
	this.gulpTaskRegistry = gulpTaskRegistry;
}

ConfigurableTaskFactory.prototype.one = function(prefix, name, rawConfig, parentConfig) {
	var stuff, schema, configs, taskInfo, runner, task;

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

	runner = this.runnerFactory.create(prefix, configs, this.multiple.bind(this));
	if (! runner) {
		throw new ConfigurationError(__filename, "Can't infer to a proper recipe task: " + taskInfo.name);
	}
	task = this.create(prefix, taskInfo, configs.taskConfig, runner);
	if (Configuration.isVisible(task)) {
		// TODO: call parallel for depends and then remove it from taskConfig.
		this.gulpTaskRegistry.register(task, configs.taskInfo.depends);
	}
	return task;

	function getTaskSchema(name) {
		var configurableTask = stuff.streams.lookup(name) || stuff.recipes.lookup(name);
		return configurableTask && configurableTask.schema || {};
	}
};

ConfigurableTaskFactory.prototype.multiple = function(prefix, subTaskConfigs, parentConfig) {
	var self, tasks = [];

	self = this;

	Object.keys(subTaskConfigs).forEach(function (name) {
		var task = self.one(prefix, name, subTaskConfigs[name], parentConfig);
		if (task) {
			tasks.push(task);
		}
	});
	return tasks;
};

// TODO: make sure config is inherited at config time and injectable at runtime.
ConfigurableTaskFactory.prototype.create = function(prefix, taskInfo, taskConfig, configurableRunner) {
	var gulp = this.gulp;
	// invoked from stream processor
	var run = function(gulp, injectConfig, stream, done) {
		// inject and realize runtime configuration.
		// TODO: let json-normalizer add defaults.
		var config = Configuration.realize(taskConfig, injectConfig, configurableRunner.defaults);
		return configurableRunner(gulp, config, stream, done);
	};
	// invoked from gulp
	var configurableTask = function(done) {
		return run(gulp, taskConfig, null, done);
	};
	configurableTask.displayName = prefix + (taskInfo.name || configurableRunner.displayName || configurableRunner.name);
	configurableTask.description = taskInfo.description || configurableRunner.description;
	configurableTask.visibility = taskInfo.visibility;
	configurableTask.runtime = taskInfo.runtime;
	configurableTask.run = run;
	configurableTask.config = taskConfig;
	return configurableTask;
};

module.exports = ConfigurableTaskFactory;
