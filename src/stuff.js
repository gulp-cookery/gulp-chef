'use strict';

var ConfigurableTaskRunnerRegistry = require('./core/configurable_runner_registry');

var cwd = process.cwd();

module.exports = {
	flows: ConfigurableTaskRunnerRegistry.builder()
		.dir(cwd, 'gulp/flows')
		.npm({})
		.dir(__dirname, 'flows')
		.build(),
	streams: ConfigurableTaskRunnerRegistry.builder()
		.dir(cwd, 'gulp/streams')
		.npm({})
		.dir(__dirname, 'streams')
		.build(),
	recipes: ConfigurableTaskRunnerRegistry.builder()
		.dir(cwd, 'gulp')
		.dir(cwd, 'gulp/tasks')
		.npm({})
		.dir(__dirname, 'tasks')
		.build()
};
