'use strict';

var Path = require('path'),
	_ = require('lodash'),
	loadPlugins = require('gulp-load-plugins'),
	safeRequireDir = require('../helpers/safe_require_dir');

var defaults = {
	camelize: false,
	pattern: ['configurable-gulp-recipe-*'],
	replaceString: /^configurable[-.]gulp[-.]recipe[-.]/g
};

function ConfigurableRecipeRegistry(recipes) {
	this.recipes = recipes;
}

ConfigurableRecipeRegistry.prototype.size = function () {
	return _.size(this.recipes);
};

ConfigurableRecipeRegistry.prototype.lookup = function (name) {
	return this.recipes[name];
};

ConfigurableRecipeRegistry.builder = function (type) {
	var recipes = {};

	return {
		dir: function (base, path) {
			var sources = safeRequireDir(Path.join(base, path));
			_.defaults(recipes, sources);
			return this;
		},
		npm: function (options) {
			var sources = loadPlugins(_.defaults(options || {}, defaults));
			lazyDefaults(recipes, sources, type);
			return this;
		},
		build: function() {
			return new ConfigurableRecipeRegistry(recipes);
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

module.exports = ConfigurableRecipeRegistry;
