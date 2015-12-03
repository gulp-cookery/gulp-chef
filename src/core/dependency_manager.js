'use strict';

var semver = require('semver');

function DependencyManager() {
	this._dependencies = {};
}

DependencyManager.prototype.add = function (dependencies) {
	var dep;

	for (dep in dependencies) {
		if (dependencies.hasOwnProperty(dep)) {

		}

	}
};

DependencyManager.prototype.save = function () {
}

module.exports = DependencyManager;