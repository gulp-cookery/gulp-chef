'use strict';

var _ = require('lodash');

function ConfigurableTaskRegistry(tasks) {
	this.tasks = tasks;
}

ConfigurableTaskRegistry.prototype.size = function () {
	return _.size(this.tasks);
};

ConfigurableTaskRegistry.prototype.lookup = function(name) {
	return this.tasks[name];
};

module.exports = ConfigurableTaskRegistry;
