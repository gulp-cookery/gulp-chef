'use strict';

var _ = require('lodash'),
	log = require('gulp-util').log;

var Configuration = require('./configuration'),
	ConfigurationError = require('./configuration_error');

function hasSubTasks(config) {
	return _.size(config.subTaskConfigs) > 0;
}

/**
 * A ConfigurableRecipeFactory creates runner function of the following signature:
 * ```
 * function (gulp, config, stream, done)
 * ```
 * @param stuff
 * @constructor
 */
function ConfigurableRecipeFactory(stuff, registry) {
	this.stuff = stuff;
	this.registry = registry;
}

ConfigurableRecipeFactory.prototype.create = function (prefix, configs, createConfigurableTasks) {
	var self = this;
	return recipeRunner() || flowRunner() || streamRunner() || taskRunner() || defaultRunner();

	function recipeRunner() {
		return self.recipe(configs.taskInfo.name, configs);
	}

	function flowRunner() {
		return self.flow(prefix, configs, createConfigurableTasks);
	}

	function streamRunner() {
		return self.stream(prefix, configs, createConfigurableTasks);
	}

	function taskRunner() {
		var task = configs.taskInfo.task;
		return inlineRunner() || referenceRunner();

		function inlineRunner() {
			if (typeof task === 'function') {
				return task;
			}
		}

		function referenceRunner() {
			if (typeof task === 'string') {
				return self.reference(task);
			}
		}
	}

	function defaultRunner() {
		if (configs.taskConfig.src && configs.taskConfig.dest) {
			return self.stuff.recipes.lookup('copy');
		}
	}
};

/**
 * if there is a matching recipe, use it and ignore any sub-configs.
 */
ConfigurableRecipeFactory.prototype.recipe = function (name, configs) {
	var self = this;

	if (isRecipeTask(name)) {
		if (hasSubTasks(configs)) {
			// warn about ignoring sub-configs.
			log('ConfigurableRecipeFactory', 'Warning: sub-configs ignored for recipe task: ' + name + ', sub-configs: ' + Object.keys(configs.subTaskConfigs));
		}
		return this.stuff.recipes.lookup(name);
	}

	function isRecipeTask(name) {
		return !!self.stuff.recipes.lookup(name);
	}
};

function compositeCreator(stockName, implicitName, validate) {
	return function (prefix, configs, createConfigurableTasks) {
		var stock, runner, tasks;

		stock = this.stuff[stockName];

		if (validate(isCompositeTask(configs.taskInfo.name), hasSubTasks(configs))) {
			tasks = createSubTasks();
			runner = explicitRunner(configs.taskInfo.name) || implicitRunner();
			return this.composite(runner, tasks);
		}

		function isCompositeTask(name) {
			return !!stock.lookup(name);
		}

		function explicitRunner(name) {
			return stock.lookup(name);
		}

		function implicitRunner() {
			return stock.lookup(implicitName);
		}

		function createSubTasks() {
			if (Configuration.shouldExpose(stock, configs.taskInfo)) {
				prefix = prefix + configs.taskInfo.name + ':';
			}
			return createConfigurableTasks(prefix, configs.subTaskConfigs, configs.taskConfig);
		}
	}
}

ConfigurableRecipeFactory.prototype.flow = compositeCreator('flows', 'parallel', function (isStock, hasSubTasks) {
	if (!isStock) {
		return false;
	}
	if (!hasSubTasks) {
		log('ConfigurableRecipeFactory', 'Warning: a flow processor without sub-tasks is useless');
	}
	return true;
});

/**
 * if there is configurations not being consumed, then treat them as sub-tasks.
 */
ConfigurableRecipeFactory.prototype.stream = compositeCreator('streams', 'merge', function (isStock, hasSubTasks) {
	return (isStock || hasSubTasks);
});

ConfigurableRecipeFactory.prototype.composite = function (runner, tasks) {
	return function (done) {
		var ctx = this;
		ctx.tasks = tasks;
		return runner.call(ctx, done);
	};
};

ConfigurableRecipeFactory.prototype.reference = function (taskName) {
	var task, runner;

	if (typeof taskName === 'string') {
		task = this.registry.refer(taskName);
		if (task) {
			return task.run || task;
		}
		runner = function (done) {
			var ctx = this;
			var task = ctx.gulp.task(taskName);
			if (typeof task !== 'function') {
				throw new ConfigurationError(__filename, 'referring task not found: ' + taskName);
			}
			// support for configurable task,
			// or tasks registered directly via gulp.task().
			task = task.run || task;
			return task.call(ctx, done);
		};
		return runner;
	}
};

ConfigurableRecipeFactory.prototype.noop = function () {
	return function (done) {
		done();
	};
};

module.exports = ConfigurableRecipeFactory;
