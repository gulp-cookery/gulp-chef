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

ConfigurableRecipeFactory.prototype.create = function (prefix, configs, createConfigurableTasks) {
	var self;

	self = this;
	return taskRecipe() || flowRecipe() || streamRecipe() || indirectRecipe() || defaultRecipe();

	function taskRecipe() {
		return self.task(configs.taskInfo.name, configs);
	}

	function flowRecipe() {
		return self.flow(prefix, configs, createConfigurableTasks);
	}

	function streamRecipe() {
		return self.stream(prefix, configs, createConfigurableTasks);
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

	function defaultRecipe() {
		if (configs.taskConfig.src && configs.taskConfig.dest) {
			return self.stuff.tasks.lookup('copy');
		}
	}
};

/**
 * if there is a matching recipe, use it and ignore any sub-configs.
 */
ConfigurableRecipeFactory.prototype.task = function (name, configs) {
	var self = this;

	if (isRecipeTask()) {
		if (hasSubTasks(configs)) {
			// warn about ignoring sub-configs.
			log('ConfigurableRecipeFactory', 'Warning: sub-configs ignored for recipe task: ' + name + ', sub-configs: ' + Object.keys(configs.subTaskConfigs));
		}
		return this.stuff.tasks.lookup(name);
	}

	function isRecipeTask() {
		return !!self.stuff.tasks.lookup(name);
	}
};

function compositeCreator(stockName, implicitName, validate) {
	return function (prefix, configs, createConfigurableTasks) {
		var stock, recipe, tasks;

		stock = this.stuff[stockName];

		if (validate(isCompositeRecipe(configs.taskInfo.name), hasSubTasks(configs))) {
			tasks = createSubTasks();
			recipe = explicitRecipe(configs.taskInfo.name) || implicitRecipe();
			return this.composite(recipe, tasks);
		}

		function isCompositeRecipe(name) {
			return !!stock.lookup(name);
		}

		function explicitRecipe(name) {
			return stock.lookup(name);
		}

		function implicitRecipe() {
			return stock.lookup(implicitName);
		}

		function createSubTasks() {
			var prefixSub;

			if (Configuration.shouldExpose(stock, configs.taskInfo)) {
				prefixSub = prefix + configs.taskInfo.name + ':';
			} else {
				prefixSub = prefix;
			}
			return createConfigurableTasks(prefixSub, configs.subTaskConfigs, configs.taskConfig);
		}
	};
}

ConfigurableRecipeFactory.prototype.flow = compositeCreator('flows', 'parallel', function (isStock, ownSubTasks) {
	if (!isStock) {
		return false;
	}
	if (!ownSubTasks) {
		log('ConfigurableRecipeFactory', 'Warning: a flow processor without sub-tasks is useless');
	}
	return true;
});

/**
 * if there is configurations not being consumed, then treat them as sub-tasks.
 */
ConfigurableRecipeFactory.prototype.stream = compositeCreator('streams', 'merge', function (isStock, ownSubTasks) {
	return isStock || ownSubTasks;
});

ConfigurableRecipeFactory.prototype.composite = function (recipe, tasks) {
	return function (done) {
		var context;

		context = this;
		context.tasks = tasks;
		return recipe.call(context, done);
	};
};

ConfigurableRecipeFactory.prototype.reference = function (taskName) {
	var registry;

	registry = this.registry;
	if (typeof taskName === 'string') {
		return resolved() || pending();
	}

	function resolved() {
		var task;

		task = registry.refer(taskName);
		if (task) {
			return task.run || task;
		}
	}

	function pending() {
		return function (done) {
			var context, task;

			context = this;
			task = context.gulp.task(taskName);
			if (typeof task !== 'function') {
				throw new ConfigurationError(__filename, 'referring task not found: ' + taskName);
			}
			// support for configurable task, or tasks registered directly via gulp.task().
			task = task.run || task;
			return task.call(context, done);
		};
	}
};

ConfigurableRecipeFactory.prototype.noop = function () {
	return function (done) {
		done();
	};
};

module.exports = ConfigurableRecipeFactory;
