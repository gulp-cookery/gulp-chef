'use strict';

/**
 *
 * Normal GulpTask:
 *
 * function gulpTask(done) {
 * }
 *
 *
 * ConfigurableTask:
 * (signature same as normal gulp task and can be used just as normal gulp task)
 *
 * function configurableTask(done) {
 * }
 *
 *
 * ConfigurableTask Runner:
 * ConfigurableTask Runner is called with config, and be wrapped in ConfigurableTask.run().
 *
 * configurableTask.run = function (gulp, config, stream, done) {
 * }
 *
 * TODO: make ConfigurableTask Runner be function(done), and with { gulp, config, stream } as context, so a normal gulp task can be a runner.
 *
 * configurableTask.displayName
 * configurableTask.description
 * configurableTask.schemRefactoring helpersa
 *
 */

var _ = require('lodash'),
	log = require('gulp-util').log;

var Configuration = require('./configuration'),
	ConfigurationError = require('./configuration_error');

var parallel = require('../flows/parallel');

function hasSubTasks(config) {
	return _.size(config.subTaskConfigs) > 0;
}

/**
 * A ConfigurableTaskRunnerFactory creates runner function of the following signature:
 * ```
 * function (gulp, config, stream, done)
 * ```
 * @param stuff
 * @constructor
 */
function ConfigurableTaskRunnerFactory(stuff) {
	this.stuff = stuff;
}

ConfigurableTaskRunnerFactory.prototype.create = function (prefix, configs, createConfigurableTasks) {
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
		return inlineRunner() || referenceRunner() || parallelRunner();

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

		function parallelRunner() {
			if (Array.isArray(task)) {
				return self.parallel(task);
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
ConfigurableTaskRunnerFactory.prototype.recipe = function (name, configs) {
	var self = this;

	if (isRecipeTask(name)) {
		if (hasSubTasks(configs)) {
			// warn about ignoring sub-configs.
			log('ConfigurableRunnerFactory', 'Warning: sub-configs ignored for recipe task: ' + name + ', sub-configs: ' + Object.keys(configs.subTaskConfigs));
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

ConfigurableTaskRunnerFactory.prototype.flow = compositeCreator('flows', 'parallel', function (isStock, hasSubTasks) {
	if (!isStock) {
		return false;
	}
	if (!hasSubTasks) {
		log('ConfigurableRunnerFactory', 'Warning: a flow processor without sub-tasks is useless');
	}
	return true;
});

/**
 * if there is configurations not being consumed, then treat them as sub-tasks.
 */
ConfigurableTaskRunnerFactory.prototype.stream = compositeCreator('streams', 'merge', function (isStock, hasSubTasks) {
	return (isStock || hasSubTasks);
});

ConfigurableTaskRunnerFactory.prototype.composite = function (runner, tasks) {
	// NOTE: important! watch the difference of signature between recipe runner and stream runner.
	return function (gulp, config, stream, done) {
		return runner(gulp, config, stream, tasks, done);
	};
};

ConfigurableTaskRunnerFactory.prototype.reference = function (taskName) {
	var runner;

	if (typeof taskName === 'string') {
		runner = function (gulp, config, stream, done) {
			var task = gulp.task(taskName);
			if (!task) {
				throw new ConfigurationError(__filename, 'referring task not found: ' + taskName);
			}
			if (typeof task.run === 'function') {
				return task.run(gulp, config, stream, done);
			}
			// support for tasks registered directly via gulp.task().
			return task.call(gulp, done);
		};
		runner.displayName = taskName;
		return runner;
	}
};

ConfigurableTaskRunnerFactory.prototype.parallel = function (tasks) {
	var self = this;

	if (Array.isArray(tasks)) {

		tasks = tasks.map(function (task) {
			if (typeof task === 'string') {
				return self.reference(task);
			} else if (typeof task === 'function') {
				if (typeof task.run === 'function') {
					return task.run;
				}
				return self.wrapper(task);
			}
			return function () {};
		});

		return function (gulp, config, stream/*, done*/) {
			// TODO: replace fake implementation
			for (var i = 0; i < tasks.length; ++i) {
				tasks[i](gulp, config, stream, done);
			}

			function done() {
			}
		};
	}
};

ConfigurableTaskRunnerFactory.prototype.wrapper = function (task) {
	if (typeof task === 'function') {
		return function (gulp, config, stream, done) {
			return task.call(gulp, done);
		};
	}
};

module.exports = ConfigurableTaskRunnerFactory;
