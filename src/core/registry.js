"use strict";

function Registry() {
	this._tasks = [];
}

Registry.prototype.get = function (name) {
	return this._tasks[name];
};

Registry.prototype.set = function (name, task) {
	return (this._tasks[name] = task);
};

Registry.prototype.init = function (gulp) {
	// NOTE: gulp 4.0 task are called on undefined context. So we need gulp reference here.
	this.gulp = gulp;
};

Registry.prototype.tasks = function () {
	return this._tasks;
};

module.exports = Registry;
