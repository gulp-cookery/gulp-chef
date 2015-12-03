'use strict';

var _ = require('lodash');
var semver = require('semver');

function DependencyManager(store) {
	this._store = store;
	this._registry = {};
}

DependencyManager.prototype.register = function (dependencies) {
	_.forOwn(dependencies, function (version, name) {
		if (absent(name) && newer(name, version)) {
			this._registry[name] = version;
		}
	});

	function absent(name) {
	}

	function newer(name, version) {
	}
};

DependencyManager.prototype.flush = function () {
	_.defaults(this._store, this._registry);
	return _.size(this._registry) > 0;
}

module.exports = DependencyManager;