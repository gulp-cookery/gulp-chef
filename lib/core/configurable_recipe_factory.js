/* eslint consistent-this: 0 */
'use strict';

var _ = require('lodash');
var log = require('gulp-util').log;

var Configuration = require('./configuration');
var ConfigurationError = require('./configuration_error');

function hasSubTasks(config) {
	return _.size(config.subTaskConfigs) > 0;
}

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

ConfigurableRecipeFactory.prototype.create = function (configs) {
	var self;

	self = this;
	return taskRecipe() || streamRecipe() || indirectRecipe() || flowRecipe() || defaultRecipe();

	function taskRecipe() {
		return self.task(configs.taskInfo.name, configs);
	}

	function streamRecipe() {
		return self.stream(configs.taskInfo.name, configs);
	}

	function indirectRecipe() {
		var task;

		task = configs.taskInfo.task;
		return inlineRecipe() || referenceRecipe();

		function inlineRecipe() {
			if (typeof task === 'function') {
				return task;
			}
		}

		function referenceRecipe() {
			if (typeof task === 'string') {
				return self.reference(task);
			}
		}
	}

	function flowRecipe() {
		return self.flow(configs.taskInfo.name, configs);
	}

	function defaultRecipe() {
		if (configs.taskConfig.src && configs.taskConfig.dest) {
			return self.stuff.tasks.lookup('copy');
		}
	}
};

ConfigurableRecipeFactory.prototype.composite = function (recipe, validate) {
	var composite;

	composite = function (done) {
		var context;

		context = this;
		context.tasks = composite.tasks;
		validate(composite.tasks);
		return recipe.call(context, done);
	};
	composite.schema = recipe.schema;
	composite.setSubTasks = function (tasks) {
		composite.tasks = tasks;
	};
	return composite;
};

ConfigurableRecipeFactory.prototype.flow = function (name, configs) {
	var recipe, flows;

	flows = this.stuff.flows;
	recipe = explicit() || implicit();
	if (recipe) {
		return this.composite(recipe, validate);
	}

	function explicit() {
		return flows.lookup(name);
	}

	function implicit() {
		if (Array.isArray(configs.subTaskConfigs) || Array.isArray(configs.taskInfo.task)) {
			return flows.lookup('series');
		}
		return flows.lookup('parallel');
	}

	function validate(tasks) {
		if (!(tasks && tasks.length)) {
			log('ConfigurableRecipeFactory', 'Warning: a flow processor without sub-tasks is useless');
		}
	}
};

ConfigurableRecipeFactory.prototype.noop = function () {
	return function (done) {
		done();
	};
};

ConfigurableRecipeFactory.prototype.reference = function (name) {
	var registry;

	registry = this.registry;
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
ConfigurableRecipeFactory.prototype.stream = function (name) {
	var recipe;

	recipe = this.stuff.streams.lookup(name);
	if (recipe) {
		return this.composite(recipe, validate);
	}

	function validate() {
	}
};

/**
 * if there is a matching recipe, use it and ignore any sub-configs.
 */
ConfigurableRecipeFactory.prototype.task = function (name, configs) {
	var recipe;

	recipe = this.stuff.tasks.lookup(name);
	if (recipe) {
		recipe.setSubTasks = function () {
			// warn about ignoring sub-configs.
			log('ConfigurableRecipeFactory', 'Warning: sub-configs ignored for recipe task: ' + name + ', sub-configs: ' + Object.keys(configs.subTaskConfigs).join(', '));
		};
		return recipe;
	}
};

module.exports = ConfigurableRecipeFactory;
