/* eslint consistent-this: 0 */
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
	var plugin;

	if (typeof taskInfo.plugin === 'string') {
		plugin = require(taskInfo.plugin);
		return runner;
	}

	if (typeof taskInfo.plugin === 'function') {
		plugin = taskInfo.plugin;
		return runner;
	}

	function runner() {
		var context = this;
		var gulp = context.gulp;
		var config = context.config;
		var stream = context.upstream || gulp.src(config.src.globs, config.src.options);

		stream = stream.pipe(plugin(context.options));
		if (config.sprout) {
			stream = stream.pipe(gulp.dest(config.dest.path, config.dest.options));
		}
		return stream;
	}
};

// TODO: should report "Starting", "Finished" profile information.
ConfigurableRecipeFactory.prototype.reference = function (taskInfo, resolved) {
	var registry, name, result;

	// TODO: make sure when defined taskInfo.name, reference becomes that name task's child task.
	// if (taskInfo.name) {}

	registry = this.registry;
	name = taskInfo.parallel || taskInfo.series || taskInfo.task;
	if (typeof name === 'string') {
		result = resolve() || pending();
		result.displayName = name;
		result.description = taskInfo.description;
		return result;
	}

	function resolve() {
		var task, target, wrapper;

		task = registry.refer(name, resolved);
		if (task) {
			target = task.run || task;
			wrapper = function (done) {
				target.call(this, done);
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
			// support for configurable task, or tasks registered directly via gulp.task().
			task = task.run || task;
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
	}
	return recipe;
}

module.exports = ConfigurableRecipeFactory;
