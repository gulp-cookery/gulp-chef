'use stricts';
var _ = require('lodash');

var ConfigurableRunnerFactory = require('./core/configurable_runner_factory');
var ConfigurableTask = require('./core/configurable_task');
var Configuration = require('./core/configuration');

module.exports = function (gulp, taskConfigs) {
	var stuff = require('./stuff');
	var factory = new ConfigurableRunnerFactory(stuff);

	var configs = Configuration.sort({}, taskConfigs, {}, {});
	createConfigurableTasks('', configs.subTaskConfigs, configs.taskConfig);
	createHelpGulpTask(gulp);

	function createConfigurableTasks(prefix, subTaskConfigs, parentConfig) {
		var tasks = [];

		_.keys(subTaskConfigs).forEach(function(name) {
			var task = createConfigurableTask(prefix, name, subTaskConfigs[name], parentConfig);
			if (task) {
				tasks.push(task);
			}
		});
		return tasks;
	}

	function createConfigurableTask(prefix, name, taskConfig, parentConfig) {
		var schema, consumes, configs, taskInfo, runner, task;

		taskInfo = ConfigurableTask.getTaskRuntimeInfo(name);

		if (taskConfig.debug) {
			debugger;
		}

		if (taskInfo.visibility === ConfigurableTask.CONSTANT.VISIBILITY.DISABLED) {
			return null;
		}

		schema = getTaskSchema(taskInfo.name);
		consumes = getTaskConsumes(taskInfo.name);

		if (schema) {
			configs = Configuration.sort(taskInfo, taskConfig, parentConfig, schema);
		} else {
			configs = Configuration.sort_deprecated(taskConfig, parentConfig, consumes);
		}
		runner = factory.recipe(taskInfo.name, configs) || streamRunner(configs, prefix) || taskRunner(configs) || defaultRunner();
		task = ConfigurableTask.createConfigurableTask(taskInfo, configs.taskConfig, runner);

		if (!task.visibility) {
			// TODO: call parallel for depends and then remove it from taskConfig.
			registerGulpTask(prefix, task, taskConfig.depends);
		}
		return task;
	}

	/**
	 * if there is configurations not being consumed, then treat them as sub-tasks.
	 */
	function streamRunner(configs, prefix) {
		if (isStreamTask(configs.taskInfo.name, configs.subTaskConfigs)) {
			return factory.stream(prefix, configs, createConfigurableTasks);
		}

		function isStreamTask(name, subTaskConfigs) {
			return !!stuff.streams.lookup(name) || hasSubTasks(subTaskConfigs);
		}
	}

	function taskRunner(configs) {
		var task = configs.taskInfo.task;
		return inlineRunner() || referenceRunner() || parallelRunner();

		function inlineRunner() {
			if (typeof task === 'function') {
				return task;
			}
		}

		function referenceRunner() {
			if (typeof task === 'string') {
				return factory.reference(task);
			}
		}

		function parallelRunner() {
			if (Array.isArray(task)) {
				return factory.parallel(task);
			}
		}
	}

	function defaultRunner() {
		return stuff.recipes.lookup('copy');
	}

	function getTaskSchema(name) {
		var configurableTask = stuff.streams.lookup(name) || stuff.recipes.lookup(name);
		return configurableTask && configurableTask.schema;
	}

	function getTaskConsumes(name) {
		var configurableTask = stuff.streams.lookup(name) || stuff.recipes.lookup(name);
		return configurableTask && configurableTask.consumes;
	}

	function hasSubTasks(subTaskConfigs) {
		return _.size(subTaskConfigs) > 0;
	}

	// TODO: warning about name collision.
	// TODO: what about the exec order of task's depends and depends' depends?
	// TODO: what about hidden task's depends?
	function registerGulpTask(prefix, task, depends) {
		gulp.task(prefix + (task.displayName || task.name), depends || [], task);
	}

	function createHelpGulpTask(gulp) {
		gulp.task('help', require('./help'));
	}
};
