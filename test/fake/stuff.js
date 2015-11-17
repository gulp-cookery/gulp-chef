'use strict';
var Sinon = require('sinon'),
	_ = require('lodash'),
	base = process.cwd();

var ConfigurableTaskRunnerRegistry = require(base + '/src/core/configurable_runner_registry');

module.exports = function () {
	return {
		flows: new ConfigurableTaskRunnerRegistry({
			parallel: Sinon.spy(),
			series: Sinon.spy()
		}),
		recipes: new ConfigurableTaskRunnerRegistry({
			copy: Sinon.spy(),
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
