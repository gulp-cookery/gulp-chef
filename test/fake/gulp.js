'use strict';

var _ = require('lodash');

var base = process.cwd();
var Registry = require(base + '/src/core/registry');

function FakeGulp() {
	this._registry = new Registry();
}

FakeGulp.prototype.task = function (name, task) {
	if (typeof name === 'function') {
		task = name;
		name = task.displayName || task.name;
	}
	if (typeof name === 'string' && typeof task === 'function') {
		this._registry.set(name, task);
	}
	return this._registry.get(name);
};

FakeGulp.prototype.registry = function (registry) {
	var tasks;

	if (!registry) {
		return this._registry;
	}
	tasks = this._registry.tasks();
	this._registry = _.reduce(tasks, setTasks, registry);
	this._registry.init(this);

	function setTasks(registry, task, name) {
		registry.set(name, task);
		return registry;
	}
};

module.exports = FakeGulp;
