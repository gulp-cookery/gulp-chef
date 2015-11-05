'use strict';

var path = require('path'),
	safeRequireDir = require('./util/safe_require_dir'),
	ConfigurableTaskRunnerRegistry = require('./core/configurable_runner_registry');

var cwd = process.cwd();

function loadRegistry() {
	var tasks = safeRequireDir.apply(null, arguments);
	return new ConfigurableTaskRunnerRegistry(tasks);
}

module.exports = {
	flows: loadRegistry(path.join(cwd, 'gulp/flows'), './flows'),
	streams: loadRegistry(path.join(cwd, 'gulp/streams'), './streams'),
	recipes: loadRegistry(path.join(cwd, 'gulp'), path.join(cwd, 'gulp/tasks'), './tasks')
};
