'use strict';

var _ = require('lodash');

var base = process.cwd();
var Registry = require(base + '/lib/core/registry');

function FakeGulp() {
	this._registry = new Registry();
}

FakeGulp.prototype.task = function (optionalName, taskFn) {
	var name, task;

	if (typeof optionalName === 'function') {
		task = optionalName;
		name = task.displayName || task.name;
	} else {
		task = taskFn;
		name = optionalName;
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

	function setTasks(result, task, name) {
		result.set(name, task);
		return result;
	}
};

module.exports = FakeGulp;
