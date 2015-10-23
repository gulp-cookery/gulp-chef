'use strict';

var _ = require('lodash');
var ConfigurationError = require('./errors/configuration_error');

var regexRuntimeOptions = /^([.#]?)([_\w][-_\s\w]*)([!?]?)$/;

function getTaskRuntimeInfo(name) {
	var match;

	name = _.trim(name);
	match = regexRuntimeOptions.exec(name);
	if (!match) {
		throw new ConfigurationError(name, 'invalid task name: ' + name);
	}
	return {
		name: match[2] || name,
		hidden: match[1] || '',
		runtime: match[3] || ''
	};
}

function createReferenceTask(taskName) {
	return function(gulp, config, stream, done) {
		var task = gulp.task(taskName);
		if (!task) {
			throw new ConfigurationError(taskName, 'referring task not found: ' + taskName);
		}
		if (task.run) {
			return task.run(gulp, config, stream, done);
		}
		// support for tasks registered directlly via gulp.task().
		return task.call(gulp, done);
	};
}

module.exports = {
	getTaskRuntimeInfo: getTaskRuntimeInfo,
	createReferenceTask: createReferenceTask
};
