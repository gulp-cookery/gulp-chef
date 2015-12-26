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
	var flows;

	flows = this.stuff.flows;
	return explicit() || implicit();

	function explicit() {
		var recipe;

		recipe = flows.lookup(taskInfo.name);
		if (recipe) {
			if (!taskInfo.visibility) {
				taskInfo.visibility = '.';
			}
			return recipe;
		}
	}

	function implicit() {
		if (Array.isArray(taskInfo.task)) {
			return flows.lookup('series');
		}
		return flows.lookup('parallel');
	}
};

ConfigurableRecipeFactory.prototype.inline = function (taskInfo) {
	var task;

	task = taskInfo.task;
	if (typeof taskInfo.task === 'function') {
		delete taskInfo.task;
		return task;
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
		delete taskInfo.task;
		return resolved() || pending();
	}

	function resolved() {
		var recipe, task;

		task = registry.refer(name);
		if (task) {
			recipe = task.run || task;
			recipe.schema = task.schema;
			recipe.recipe = task.recipe;
			if (!taskInfo.visibility) {
				taskInfo.visibility = '.';
			}
			return function (done) {
				recipe.call(this, done);
			};
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
		if (!taskInfo.visibility) {
			taskInfo.visibility = '.';
		}
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
