'use strict';
var Sinon = require('sinon');
var _ = require('lodash');
var base = process.cwd();

var ConfigurableTaskRunnerRegistry = require(base + '/src/core/configurable_runner_registry');

module.exports = function () {
	return {
		recipes: new ConfigurableTaskRunnerRegistry({
			'recipe-task': Sinon.spy()
		}),
		streams: new ConfigurableTaskRunnerRegistry({
			merge: fakeStreamRunner,
			'stream-task': fakeStreamRunner
		})
	};

	function fakeStreamRunner(gulp, config, stream, tasks) {
		tasks.forEach(function (task) {
			task.run(gulp, config, stream, done);
		});
	}

	function done() {
	}
};
