'use strict';

var _ = require('lodash');

/**
 * @constructor
 *
 * Reference:
 * https://github.com/gulpjs/undertaker-registry/blob/master/index.js
 *
 */
function Registry(listener) {
	this._tasks = {};
	this._refers = [];
	this._listener = listener || function () {};
}

Registry.prototype.init = function (gulp) {
	this.gulp = gulp;
	this._listener(gulp);
};

Registry.prototype.get = function (name) {
	return this._tasks[name];
};

Registry.prototype.set = function (name, task) {
	this._tasks[name] = task;
	return task;
};

Registry.prototype.tasks = function () {
	return _.clone(this._tasks);
};

Registry.prototype.refer = function (name) {
	var task;

	task = this._tasks[name];
	if (!task) {
		this._refers.push(name);
	}
	return task;
};

Registry.prototype.missing = function (gulp) {
	return this._refers.filter(function (ref) {
		return !gulp.task(ref);
	});
};

module.exports = Registry;
