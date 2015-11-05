'use strict';
var _ = require('lodash');

var Configuration = require('./configuration');
var ConfigurationError = require('./configuration_error');

var REGEX_RUNTIME_OPTIONS = /^([.#]?)([_\w][-_\s\w]*)([!?]?)$/;

var CONSTANT = {
	VISIBILITY: {
		/** hidden configurable task can't be run from cli, but still functional */
		HIDDEN: '.',
		/** disabled configurable task is not processed and not functional, including all it's descendants */
		DISABLED: '#',
		/** normal configurable task can be run from cli */
		NORMAL: ''
	},
	RUNTIME: {
		/** configurable task can only run in production mode */
		PRODUCTION: '!',
		/** configurable task can only run in development mode */
		DEVELOPMENT: '?',
		/** configurable task can run in both production and development mode */
		ALL: ''
	}
};

function ConfigurableTaskFactory(stuff, runnerFactory) {
	this.stuff = stuff;
	this.runnerFactory = runnerFactory;
}

ConfigurableTaskFactory.prototype.one = function(prefix, name, rawConfig, parentConfigs) {

};

ConfigurableTaskFactory.prototype.multiple = function(prefix, subTaskConfigs, parentConfigs) {

};

// TODO: make sure config is inherited at config time and injectable at runtime.
ConfigurableTaskFactory.prototype.create = function(prefix, taskInfo, taskConfig, configurableRunner) {
	// invoked from stream processor
	var run = function(gulp, injectConfig, stream, done) {
		// inject and realize runtime configuration.
		// TODO: let json-normalizer add defaults.
		var config = Configuration.realize(taskConfig, injectConfig, configurableRunner.defaults);
		return configurableRunner(gulp, config, stream, done);
	};
	// invoked from gulp
	var configurableTask = function(done) {
		return run(this, taskConfig, null, done);
	};
	configurableTask.displayName = prefix + taskInfo.name;
	configurableTask.description = taskInfo.description || configurableRunner.description;
	configurableTask.visibility = taskInfo.visibility;
	configurableTask.runtime = taskInfo.runtime;
	configurableTask.run = run;
	configurableTask.config = taskConfig;
	return configurableTask;
};

function getTaskRuntimeInfo(name) {
	var match;

	name = _.trim(name);
	match = REGEX_RUNTIME_OPTIONS.exec(name);
	if (!match) {
		throw new ConfigurationError(__filename, 'invalid task name: ' + name);
	}
	return {
		name: match[2] || name,
		visibility: match[1] || '',
		runtime: match[3] || ''
	};
}

function isVisible(task) {
	return task.visibility === CONSTANT.VISIBILITY.NORMAL;
}

function isDisabled(task) {
	return task.visibility === CONSTANT.VISIBILITY.DISABLED;
}

ConfigurableTaskFactory.CONSTANT = CONSTANT;
ConfigurableTaskFactory.getTaskRuntimeInfo = getTaskRuntimeInfo;
ConfigurableTaskFactory.isVisible = isVisible;
ConfigurableTaskFactory.isDisabled = isDisabled;
ConfigurableTaskFactory.create = ConfigurableTaskFactory.prototype.create;

module.exports = ConfigurableTaskFactory;
