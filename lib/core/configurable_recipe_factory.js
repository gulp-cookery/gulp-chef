/* eslint consistent-this: 0 */
'use strict';

var ConfigurationError = require('./configuration_error');

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

ConfigurableRecipeFactory.prototype.create = function (taskInfo) {
	var self;

	self = this;
	return taskRecipe() || streamRecipe() || inlineRecipe() || referenceRecipe() || flowRecipe();

	function taskRecipe() {
		return self.task(taskInfo);
	}

	function streamRecipe() {
		return self.stream(taskInfo);
	}

	function inlineRecipe() {
		return self.inline(taskInfo);
	}

	function referenceRecipe() {
		return self.reference(taskInfo);
	}

	function flowRecipe() {
		return self.flow(taskInfo);
	}
};

ConfigurableRecipeFactory.prototype.flow = function (taskInfo) {
	var recipe, flows;

	flows = this.stuff.flows;
	recipe = explicit() || implicit();
	if (recipe) {
		recipe.composite = true;
		return recipe;
	}

	function explicit() {
		return flows.lookup(taskInfo.name);
	}

	function implicit() {
		if (Array.isArray(taskInfo.task)) {
			return flows.lookup('series');
		}
		return flows.lookup('parallel');
	}
};

ConfigurableRecipeFactory.prototype.inline = function (taskInfo) {
	if (typeof taskInfo.task === 'function') {
		return taskInfo.task;
	}
};

ConfigurableRecipeFactory.prototype.noop = function () {
	return function (done) {
		done();
	};
};

ConfigurableRecipeFactory.prototype.reference = function (taskInfo) {
	var registry, name;

	registry = this.registry;
	name = taskInfo.task;
	if (typeof name === 'string') {
		return resolved() || pending();
	}

	function resolved() {
		var task;

		task = registry.refer(name);
		if (task) {
			return task.run || task;
		}
	}

	function pending() {
		return function (done) {
			var context, task;

			context = this;
			task = context.gulp.task(name);
			if (typeof task !== 'function') {
				throw new ConfigurationError(__filename, 'referring task not found: ' + name);
			}
			// support for configurable task, or tasks registered directly via gulp.task().
			task = task.run || task;
			return task.call(context, done);
		};
	}
};

/**
 * if there is configurations not being consumed, then treat them as sub-tasks.
 */
ConfigurableRecipeFactory.prototype.stream = function (taskInfo) {
	var recipe;

	recipe = this.stuff.streams.lookup(taskInfo.name);
	if (recipe) {
		recipe.composite = true;
		return recipe;
	}
};

/**
 * if there is a matching recipe, use it and ignore any sub-configs.
 */
ConfigurableRecipeFactory.prototype.task = function (taskInfo) {
	return this.stuff.tasks.lookup(taskInfo.name);
};

module.exports = ConfigurableRecipeFactory;
