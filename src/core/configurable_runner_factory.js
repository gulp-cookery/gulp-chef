/**
 *
 * Normal GulpTask:
 *
 * function gulpTask(done) {
 * }
 *
 *
 * ConfigurableTask:
 * (signature same as normal gulp task and can be used just as normal gulp task)
 *
 * function configurableTask(done) {
 * }
 *
 *
 * ConfigurableTask Runner:
 * ConfigurableTask Runner is called with config, and be wrapped in ConfigurableTask.run().
 *
 * configurableTask.run = function(gulp, config, stream, done) {
 * }
 *
 * configurableTask.displayName
 * configurableTask.description
 * configurableTask.schema
 *
 */
'use strict';

var parallel = require('../flows/parallel');

var ConfigurableTask = require('./configurable_task');
var ConfigurationError = require('./configuration_error');

function ConfigurableTaskRunnerFactory(stuff) {
	this.stuff = stuff;
}

ConfigurableTaskRunnerFactory.prototype.stream = function (prefix, configs, createConfigurableTasks) {
	var stuff = this.stuff;

	// TODO: remove stream runner form parent's config.
	var tasks = _createSubTasks();
	return _createStreamTaskRunner(tasks);

	function _createSubTasks() {
		var hidden;

		if (stuff.stream.lookup(configs.taskInfo.name)) {
			hidden = true;
		} else {
			hidden = !!configs.taskInfo.visibility;
		}
		if (!hidden) {
			prefix = prefix + configs.taskInfo.name + ':';
		}

		return createConfigurableTasks(prefix, configs.subTaskConfigs, configs.taskConfig);
	}

	function _createStreamTaskRunner(tasks) {
		var runner = explicitRunner() || implicitRunner();
		// NOTE: important! watch the difference of signature between recipe runner and stream runner.
		return function(gulp, config, stream /*, done*/ ) {
			return runner(gulp, config, stream, tasks);
		};
	}

	function explicitRunner() {
		var runner = stuff.stream.lookup(configs.taskInfo.name);
		if (runner) {
			configs.taskInfo.visibility = ConfigurableTask.CONSTANT.VISIBILITY.HIDDEN;
			return runner;
		}
	}

	function implicitRunner() {
		return stuff.stream.lookup('merge');
	}
};

ConfigurableTaskRunnerFactory.prototype.reference = function (taskName) {
	if (typeof taskName === 'string') {
		return function (gulp, config, stream, done) {
			var task = gulp.task(taskName);
			if (!task) {
				throw new ConfigurationError(__filename, 'referring task not found: ' + taskName);
			}
			if (task.run) {
				return task.run(gulp, config, stream, done);
			}
			// support for tasks registered directly via gulp.task().
			return task.call(gulp, done);
		};
	}
};

ConfigurableTaskRunnerFactory.prototype.parallel = function (tasks) {
	if (Array.isArray(tasks)) {
		return function(gulp, config, stream, done) {
			return parallel(gulp, config, stream, tasks);
		};
	}
}

module.exports = ConfigurableTaskRunnerFactory;
