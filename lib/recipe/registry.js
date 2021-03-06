'use strict';

var Path = require('path');
var _ = require('lodash');
var loadPlugins = require('gulp-load-plugins');
var safeRequireDir = require('../helpers/safe_require_dir');
var log = require('gulplog');

var _replaceString = /^gulp[-.]ccr[-.]/g;

function ConfigurableRecipeRegistry(recipes) {
	this.recipes = recipes;
}

ConfigurableRecipeRegistry.prototype.size = function () {
	return _.size(this.recipes);
};

ConfigurableRecipeRegistry.prototype.lookup = function (name) {
	return this.recipes[name];
};

ConfigurableRecipeRegistry.replaceString = _replaceString;

ConfigurableRecipeRegistry.builder = function (type) {
	var recipes = {};

	return {
		dir: function (base, path) {
			var sources;

			sources = safeRequireDir(Path.join(base, path));
			_.defaults(recipes, sources);
			return this;
		},
		npm: function (options) {
			var sources;

			sources = loadPlugins(options);
			lazyDefaults(recipes, sources, type);
			return this;
		},
		require: function (moduleName) {
			var name;

			name = moduleName.replace(_replaceString, '');
			if (!(name in recipes)) {
				try {
					recipes[name] = require(moduleName);
				} catch (ex) {
					log.error('gulp-chef: recipe-registry:', 'error loading module: ' + moduleName);
				}
			}
			return this;
		},
		build: function () {
			return new ConfigurableRecipeRegistry(recipes);
		}
	};
};

function lazyDefaults(target, source, type) {
	var properties;

	properties = Object.getOwnPropertyNames(source);
	properties.forEach(function (property) {
		if (!target.hasOwnProperty(property)) {
			assign(property);
		}
	});

	function assign(property) {
		var descriptor;

		descriptor = Object.getOwnPropertyDescriptor(source, property);
		if (descriptor.get) {
			Object.defineProperty(target, property, {
				enumerable: true,
				get: function () {
					var inst;

					inst = descriptor.get();
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

module.exports = ConfigurableRecipeRegistry;
