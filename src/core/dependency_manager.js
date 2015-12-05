'use strict';

var fs = require('fs');
var _ = require('lodash');
var semver = require('semver');

/**
 *
 * Notes:
 *
 *  Although there are recipes touches the package.json, e.g. "bump".
 *  But, the dependency checking is performed before running tasks, and,
 *  once there is any dependency not installed, the process will stop,
 *  and prompt the user to run "npm update" to install required modules.
 *  Therefore, the preloaded package.json is safe to add modules
 *  to "devDependencies" field and save back to disk.
 *
 */
function DependencyManager(store) {
	this._store = store;
	this._registry = {};
}

DependencyManager.prototype.register = function (modules) {
	var dependencies = this._store.dependencies || {},
		devDependencies = this._store.devDependencies || {},
		registry = this._registry;
	_.forOwn(modules, registerOnNewer);

	function registerOnNewer(version, name) {
		if (absent(name)) {
			set(name, newer(name, version));
		}
	}

	function absent(name) {
		return !(name in dependencies) && !(name in devDependencies);
	}

	function newer(name, version) {
		version = minver(version);
		if (version && registry[name]) {
			if (semver.compare(version, registry[name]) < 0) {
				return registry[name];
			}
		}
		return version;
	}

	function minver(version) {
		var range;

		if (semver.valid(version)) {
			return version;
		}

		range = semver.validRange(version);
		if (range) {
			var match = /\d+\.\d+\.\d+/.exec(range);
			if (match) {
				return match[0];
			}
		}
	}

	function set(name, version) {
		registry[name] = version;
	}
};

DependencyManager.prototype.flush = function () {
	var dirty, devDependencies = this._store.devDependencies;
	_.forOwn(this._registry, function (version, name) {
		if (! (name in devDependencies)) {
			devDependencies[name] = version ? ('^' + version) : '*';
			dirty = true;
		}
	});
	return dirty;
};

DependencyManager.prototype.save = function (file) {
	var contents = JSON.stringify(this._store, null, 2);
	console.log('contents=' + contents);
	fs.writeFileSync(file, contents, 'utf8');
};

module.exports = DependencyManager;
