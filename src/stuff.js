'use strict';

var ConfigurableTaskRunnerRegistry = require('./core/configurable_runner_registry');

var cwd = process.cwd();

module.exports = function (options) {
	return {
		flows: ConfigurableTaskRunnerRegistry.builder()
			.dir(cwd, 'gulp/flows')
			.npm(options)
			.dir(__dirname, 'flows')
			.build(),
		streams: ConfigurableTaskRunnerRegistry.builder()
			.dir(cwd, 'gulp/streams')
			.npm(options)
			.dir(__dirname, 'streams')
			.build(),
		recipes: ConfigurableTaskRunnerRegistry.builder()
			.dir(cwd, 'gulp')
			.dir(cwd, 'gulp/tasks')
			.npm(options)
			.dir(__dirname, 'tasks')
			.build()
	};
};
