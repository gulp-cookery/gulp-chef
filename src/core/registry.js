"use strict";

/**
 * @constructor
 *
 * Reference:
 * https://github.com/gulpjs/undertaker-registry/blob/master/index.js
 *
 */
function Registry() {
	this._tasks = {};
}

Registry.prototype.init = function (gulp) {
	// NOTE: gulp 4.0 task are called on undefined context. So we need gulp reference here.
	this.gulp = gulp;
};

Registry.prototype.get = function (name) {
	return this._tasks[name];
};

Registry.prototype.set = function (name, task) {
	return (this._tasks[name] = task);
};

Registry.prototype.tasks = function () {
	var self = this;

	return Object.keys(this._tasks).reduce(function(tasks, name) {
		tasks[name] = self.get(name);
		return tasks;
	}, {});
};

module.exports = Registry;
