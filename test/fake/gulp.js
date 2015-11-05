'use strict';

function FakeGulp(tasks) {
	this.taskRegistry = tasks || {};
}

FakeGulp.prototype.task = function (name, runner) {
	if (typeof name === 'function') {
		runner = name;
		name = runner.displayName || runner.name;
	}
	if (typeof name === 'string' && typeof runner === 'function') {
		this.taskRegistry[name] = runner;
	}
	return this.taskRegistry[name];
};

module.exports = FakeGulp;
