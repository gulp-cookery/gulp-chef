'use strict';

var _ = require('lodash');
var observable = require('../helpers/observable');

/**
 * @constructor
 *
 * Reference:
 * https://github.com/gulpjs/undertaker-registry/blob/master/index.js
 *
 */
function Registry(listener) {
	this._tasks = {};
	this._refers = {};
	this._listener = listener || function () {};
}

Registry.prototype.init = function (gulp) {
	this.gulp = gulp;
	this._listener(this);
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

Registry.prototype.refer = function (name, listener) {
	var task, listen;

	task = this._tasks[name];
	if (task) {
		if (listener) {
			process.nextTick(function () {
				listener(task);
			});
		}
	} else {
		listen = this._refers[name] || (this._refers[name] = observable());
		if (listener) {
			listen(listener);
		}
	}
	return task;
};

Registry.prototype.missing = function () {
	var self, gulp;

	self = this;
	gulp = this.gulp;
	return Object.keys(self._refers).filter(function (ref) {
		var task = gulp.task(ref);

		if (task) {
			self._refers[ref].notify(task);
			return false;
		}
		return true;
	});
};

module.exports = Registry;
