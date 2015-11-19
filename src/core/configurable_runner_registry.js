'use strict';

var _ = require('lodash');

function ConfigurableTaskRunnerRegistry(tasks) {
	this.tasks = tasks;
}

ConfigurableTaskRunnerRegistry.prototype.size = function () {
	return _.size(this.tasks);
};

ConfigurableTaskRunnerRegistry.prototype.lookup = function (name) {
	return this.tasks[name];
};

module.exports = ConfigurableTaskRunnerRegistry;
