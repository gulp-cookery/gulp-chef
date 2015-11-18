"use strict";

var _ = require('lodash');

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
};

Registry.prototype.get = function (name) {
	return this._tasks[name];
};

Registry.prototype.set = function (name, task) {
	return (this._tasks[name] = task);
};

Registry.prototype.tasks = function () {
	return _.clone(this._tasks);
};

module.exports = Registry;
