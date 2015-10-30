'use strict';

var _ = require('lodash');

function ConfigurableRunnerRegistry(tasks) {
	this.tasks = tasks;
}

ConfigurableRunnerRegistry.prototype.size = function () {
	return _.size(this.tasks);
};

ConfigurableRunnerRegistry.prototype.lookup = function(name) {
	return this.tasks[name];
};

module.exports = ConfigurableRunnerRegistry;
