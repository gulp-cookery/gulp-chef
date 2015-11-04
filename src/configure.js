'use strict';
var ConfigurableTaskRunnerFactory = require('./core/configurable_runner_factory');
var ConfigurableTask = require('./core/configurable_task');
var Configuration = require('./core/configuration');

function configure(gulp, taskConfigs) {
	createConfigurableTasks(gulp, taskConfigs);
	createHelpGulpTask(gulp);
}

function createConfigurableTasks(gulp, taskConfigs) {
	var stuff = require('./stuff');
	var runnerFactory = new ConfigurableTaskRunnerFactory(stuff);
	var configs = Configuration.sort({}, taskConfigs, {}, {});
	createSubConfigurableTasks('', configs.subTaskConfigs, configs.taskConfig);

	function createSubConfigurableTasks(prefix, subTaskConfigs, parentConfig) {
		var tasks = [];

		Object.keys(subTaskConfigs).forEach(function (name) {
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
		runner = runnerFactory.create(prefix, configs, createSubConfigurableTasks);
		task = ConfigurableTask.createConfigurableTask(prefix, taskInfo, configs.taskConfig, runner);

		if (!task.visibility) {
			// TODO: call parallel for depends and then remove it from taskConfig.
			registerGulpTask(prefix, task, taskConfig.depends);
		}
		return task;
	}

	function getTaskSchema(name) {
		var configurableTask = stuff.streams.lookup(name) || stuff.recipes.lookup(name);
		return configurableTask && configurableTask.schema;
	}

	function getTaskConsumes(name) {
		var configurableTask = stuff.streams.lookup(name) || stuff.recipes.lookup(name);
		return configurableTask && configurableTask.consumes;
	}

	// TODO: warning about name collision.
	// TODO: what about the exec order of task's depends and depends' depends?
	// TODO: what about hidden task's depends?
	function registerGulpTask(prefix, task, depends) {
		gulp.task(prefix + (task.displayName || task.name), depends || [], task);
	}
}

function createHelpGulpTask(gulp) {
	gulp.task('help', require('./help'));
}

module.exports = configure;
