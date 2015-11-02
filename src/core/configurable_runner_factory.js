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
var merge = require('../streams/merge');

var ConfigurableTask = require('./configurable_task');
var ConfigurationError = require('./configuration_error');

function ConfigurableTaskRunnerFactory(stuff) {
	this.stuff = stuff;
}

ConfigurableTaskRunnerFactory.prototype.reference = function (taskName) {

};

function createStreamTaskRunner(prefix, configs, streamTaskRunner, createConfigurableTasks) {
	// TODO: remove stream runner form parent's config.
	var tasks = _createSubTasks();
	return _createStreamTaskRunner(tasks);

	function _createSubTasks() {
		var hidden;

		if (streamTaskRunner) {
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
		if (streamTaskRunner) {
			configs.taskInfo.visibility = ConfigurableTask.CONSTANT.VISIBILITY.HIDDEN;
			return streamTaskRunner;
		}
	}

	function implicitRunner() {
		return merge;
	}
}

function createReferenceTaskRunner(taskName) {
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
}

function createParallelTaskRunner(tasks) {
	if (Array.isArray(tasks)) {
		return function(gulp, config, stream, done) {
			return parallel(gulp, config, stream, tasks);
		};
	}
}

function createWrapperTaskRunner(task) {
	if (typeof task === 'function') {
		return function(gulp, config, stream, done) {
			return task.call(gulp, done);
		}
	}
}

ConfigurableTaskRunnerFactory.createStreamTaskRunner = createStreamTaskRunner;
ConfigurableTaskRunnerFactory.createReferenceTaskRunner = createReferenceTaskRunner;
ConfigurableTaskRunnerFactory.createParallelTaskRunner = createParallelTaskRunner;
ConfigurableTaskRunnerFactory.createWrapperTaskRunner = createWrapperTaskRunner;

module.exports = ConfigurableTaskRunnerFactory;
