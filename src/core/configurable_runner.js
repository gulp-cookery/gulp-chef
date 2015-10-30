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

var ConfigurationError = require('../errors/configuration_error');

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
	createReferenceTaskRunner: createReferenceTaskRunner,
	createParallelTaskRunner: createParallelTaskRunner,
	createWrapperTaskRunner: createWrapperTaskRunner
};
