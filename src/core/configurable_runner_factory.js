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
 * configurableTask.displayName
 * configurableTask.description
 * configurableTask.schema
 *
 */

var _ = require('lodash'),
	log = require('gulp-util').log;

var Configuration = require('./configuration'),
	ConfigurationError = require('./configuration_error');

var parallel = require('../flows/parallel');

function hasSubTasks(subTaskConfigs) {
	return _.size(subTaskConfigs) > 0;
}

function shouldExpose(stock, taskInfo) {
	var options;

	if (stock.lookup(taskInfo.name)) {
		options = Configuration.getOptions();
		return options.exposeStockStreamTasks;
	} else {
		return ('visibility' in taskInfo) && taskInfo.visibility === Configuration.CONSTANT.VISIBILITY.NORMAL;
	}
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
		if (hasSubTasks(configs.subTaskConfigs)) {
			// warn about ignoring sub-configs.
			log('Warning: sub-configs ignored for recipe task: ' + name + ', sub-configs: ' + Object.keys(configs.subTaskConfigs));
		}
		return this.stuff.recipes.lookup(name);
	}

	function isRecipeTask(name) {
		return !!self.stuff.recipes.lookup(name);
	}
};

ConfigurableTaskRunnerFactory.prototype.flow = function (prefix, configs, createConfigurableTasks) {
	var tasks, self = this, stuff = this.stuff;

	if (isFlowTask(configs.taskInfo.name)) {
		if (!hasTaskRefs() && ! hasSubTasks(configs.subTaskConfigs)) {
			throw new ConfigurationError('configure', 'a flow processor without sub-tasks is useless');
		}
		tasks = _createSubTasks();
		return _createFlowTaskRunner(tasks);
	}

	function isFlowTask(name) {
		return !!stuff.flows.lookup(name);
	}

	function hasTaskRefs() {
		return configs.taskInfo.task && configs.taskInfo.task.length;
	}

	function _createSubTasks() {
		if (shouldExpose(stuff.flows, configs.taskInfo)) {
			prefix = prefix + configs.taskInfo.name + ':';
		}
		return createConfigurableTasks(prefix, configs.subTaskConfigs, configs.taskConfig);
	}

	function _createFlowTaskRunner(tasks) {
		var runner = explicitRunner() || implicitRunner();
		// NOTE: important! watch the difference of signature between recipe runner and stream runner.
		return function (gulp, config, stream, done) {
			return runner(gulp, config, stream, tasks, done);
		};
	}

	function explicitRunner() {
		var runner = stuff.flows.lookup(configs.taskInfo.name);
		if (runner) {
			configs.taskInfo.visibility = Configuration.CONSTANT.VISIBILITY.HIDDEN;
			return runner;
		}
	}

	function implicitRunner() {
		return stuff.flows.lookup('parallel');
	}
};

/**
 * if there is configurations not being consumed, then treat them as sub-tasks.
 */
ConfigurableTaskRunnerFactory.prototype.stream = function (prefix, configs, createConfigurableTasks) {
	var tasks, stuff = this.stuff;

	if (isStreamTask(configs.taskInfo.name, configs.subTaskConfigs)) {
		tasks = _createSubTasks();
		return _createStreamTaskRunner(tasks);
	}

	function isStreamTask(name, subTaskConfigs) {
		return !!stuff.streams.lookup(name) || hasSubTasks(subTaskConfigs);
	}

	function _createSubTasks() {
		if (shouldExpose(stuff.streams, configs.taskInfo)) {
			prefix = prefix + configs.taskInfo.name + ':';
		}
		return createConfigurableTasks(prefix, configs.subTaskConfigs, configs.taskConfig);
	}

	function _createStreamTaskRunner(tasks) {
		var runner = explicitRunner() || implicitRunner();
		// NOTE: important! watch the difference of signature between recipe runner and stream runner.
		return function (gulp, config, stream, done) {
			return runner(gulp, config, stream, tasks, done);
		};
	}

	function explicitRunner() {
		var runner = stuff.streams.lookup(configs.taskInfo.name);
		if (runner) {
			configs.taskInfo.visibility = Configuration.CONSTANT.VISIBILITY.HIDDEN;
			return runner;
		}
	}

	function implicitRunner() {
		return stuff.streams.lookup('merge');
	}
};

ConfigurableTaskRunnerFactory.prototype.reference = function (taskName) {
	if (typeof taskName === 'string') {
		return function (gulp, config, stream, done) {
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
