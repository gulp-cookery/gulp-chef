'use strict';

function ConfigurableTaskRegistry(tasks) {
	this.tasks = tasks;
}

ConfigurableTaskRegistry.prototype.lookup = function(name) {
	return this.tasks[name];
}

module.exports = ConfigurableTaskRegistry;
