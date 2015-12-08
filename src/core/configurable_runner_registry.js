'use strict';

var Path = require('path'),
	_ = require('lodash'),
	loadPlugins = require('gulp-load-plugins'),
	safeRequireDir = require('../helpers/safe_require_dir');

var defaults = {
	camelize: false,
	pattern: ['gulp-recipe-*'],
	replaceString: /^gulp[-.]recipe[-.]/g
};

function ConfigurableTaskRunnerRegistry(runners) {
	this.runners = runners;
}

ConfigurableTaskRunnerRegistry.prototype.size = function () {
	return _.size(this.runners);
};

ConfigurableTaskRunnerRegistry.prototype.lookup = function (name) {
	return this.runners[name];
};

ConfigurableTaskRunnerRegistry.builder = function (type) {
	var runners = {};

	return {
		dir: function (base, path) {
			var recipes = safeRequireDir(Path.join(base, path));
			_.defaults(runners, recipes);
			return this;
		},
		npm: function (options) {
			var recipes = loadPlugins(_.defaults(options || {}, defaults));
			lazyDefaults(runners, recipes, type);
			return this;
		},
		build: function() {
			return new ConfigurableTaskRunnerRegistry(runners);
		}
	};
};

function lazyDefaults(target, source, type) {
	var properties = Object.getOwnPropertyNames(source);
	properties.forEach(function (property) {
		if (!target.hasOwnProperty(property)) {
			assign(property);
		}
	});

	function assign(property) {
		var descriptor = Object.getOwnPropertyDescriptor(source, property);
		if (descriptor.get) {
			Object.defineProperty(target, property, {
				get: function () {
					var inst = descriptor.get();
					if (inst.type === type) {
						return inst;
					}
				}
			});
		} else {
			target[property] = source[property];
		}
	}
}

module.exports = ConfigurableTaskRunnerRegistry;
