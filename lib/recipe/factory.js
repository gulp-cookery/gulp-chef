'use strict';

var PluginError = require('gulp-util').PluginError;

/**
 * A ConfigurableRecipeFactory lookups or creates recipe function of the signature: `function (done)`.
 *
 * @param stuff
 * @constructor
 */
function ConfigurableRecipeFactory(stuff, registry) {
	this.stuff = stuff;
	this.registry = registry;
}

ConfigurableRecipeFactory.prototype.flow = function (taskInfo) {
	return lookup(this.stuff.flows, taskInfo);
};

ConfigurableRecipeFactory.prototype.inline = function (taskInfo) {
	var task;

	task = taskInfo.parallel || taskInfo.series || taskInfo.task;
	if (typeof task === 'function') {
		return task;
	}
};

ConfigurableRecipeFactory.prototype.noop = function () {
	return function (done) {
		done();
	};
};

ConfigurableRecipeFactory.prototype.plugin = function (taskInfo) {
	var plugin, type;

	type = typeof taskInfo.plugin;
	if (type === 'string' || type === 'function') {
		plugin = taskInfo.plugin;
		return runner;
	}

	function runner() {
		var gulp = this.gulp;
		var config = this.config;
		var stream = this.upstream || gulp.src(config.src.globs, config.src.options);

		_load();

		return stream.pipe(plugin(config.options));
	}

	function _load() {
		if (typeof plugin === 'string') {
			try {
				plugin = require(plugin);
			} catch (ex) {
				throw new PluginError('can not load plugin');
			}
		}
	}
};

ConfigurableRecipeFactory.prototype.reference = function (taskInfo, resolved) {
	var registry, name, result;

	registry = this.registry;
	name = taskInfo.parallel || taskInfo.series || taskInfo.task;
	if (typeof name === 'string') {
		result = resolve() || pending();
		result.displayName = name;
		result.description = taskInfo.description;
		return result;
	}

	function resolve() {
		var task, wrapper;

		task = registry.refer(name, resolved);
		if (task) {
			wrapper = function (done) {
				return task.call(this, done);
			};
			wrapper.config = task.config;
			return wrapper;
		}
	}

	function pending() {
		return function (done) {
			var task;

			task = this.gulp.task(name);
			if (typeof task !== 'function') {
				throw new PluginError(__filename, 'referring task not found: ' + name);
			}
			return task.call(this, done);
		};
	}
};

/**
 * if there is configurations not being consumed, then treat them as sub-tasks.
 */
ConfigurableRecipeFactory.prototype.stream = function (taskInfo) {
	return lookup(this.stuff.streams, taskInfo);
};

/**
 * if there is a matching recipe, use it and ignore any sub-configs.
 */
ConfigurableRecipeFactory.prototype.task = function (taskInfo) {
	return lookup(this.stuff.tasks, taskInfo);
};

function lookup(registry, taskInfo) {
	var name, recipe;

	name = taskInfo.recipe || taskInfo.name;
	recipe = registry.lookup(name);
	if (recipe) {
		taskInfo.recipe = name;
		taskInfo.recipeInstance = recipe;
	}
	return recipe;
}

module.exports = ConfigurableRecipeFactory;
