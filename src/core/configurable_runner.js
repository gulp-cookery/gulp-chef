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
var ConfigurationError = require('../errors/configuration_error');

function getStreamTaskRunnerCreator(registry, createConfigurableTasks) {
	return function create(name, tasks) {
	}
}

function createStreamTaskRunner(taskInfo, taskConfig, prefix, subTasks, registry, createConfigurableTasks) {
	// TODO: remove stream runner form parent's config.
	var tasks = _createSubTasks();
	return _createStreamTaskRunner(taskInfo.name, tasks);

	function _createSubTasks() {
		var hidden;

		if (registry.lookup(taskInfo.name)) {
			hidden = true;
		} else {
			hidden = !!taskInfo.visibility;
		}
		if (!hidden) {
			prefix = prefix + taskInfo.name + ':';
		}

		return createConfigurableTasks(prefix, subTasks, taskConfig);
	}

	function _createStreamTaskRunner(name, tasks) {
		var runner = explicitRunner(name) || implicitRunner(name);
		// NOTE: important! watch the difference of signature between recipe runner and stream runner.
		return function(gulp, config, stream /*, done*/ ) {
			return runner(gulp, config, stream, tasks);
		};
	}

	function explicitRunner(name) {
		var runner = registry.lookup(name);
		if (runner) {
			taskInfo.visibility = ConfigurableTask.CONSTANT.VISIBILITY.HIDDEN;
			return runner;
		}
	}

	function implicitRunner() {
		return registry.lookup('merge');
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
			// support for tasks registered directlly via gulp.task().
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

module.exports = {
	createStreamTaskRunner: createStreamTaskRunner,
	createReferenceTaskRunner: createReferenceTaskRunner,
	createParallelTaskRunner: createParallelTaskRunner,
	createWrapperTaskRunner: createWrapperTaskRunner
};
