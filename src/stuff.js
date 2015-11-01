'use strict';

var path = require('path');
var safeRequireDir = require('./util/safe_require_dir');
var ConfigurableRunnerRegistry = require('./core/configurable_runner_registry');

function loadRegistry() {
	var tasks = safeRequireDir.apply(null, arguments);
	return new ConfigurableRunnerRegistry(tasks);
}

var cwd = process.cwd();

module.exports = {
	flows: loadRegistry(path.join(cwd, 'gulp/flows'), './flows'),
	streams: loadRegistry(path.join(cwd, 'gulp/streams'), './streams'),
	recipes: loadRegistry(path.join(cwd, 'gulp'), path.join(cwd, 'gulp/tasks'), './tasks')
};
