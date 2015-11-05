'use strict';
var ConfigurableTaskRunnerFactory = require('./core/configurable_runner_factory');
var ConfigurableTaskFactory = require('./core/configurable_task_factory');
var Configuration = require('./core/configuration');

function configure(gulp, configs) {
	createConfigurableTasks(configs, registerGulpTask);
	createHelpGulpTask(registerGulpTask);

	// TODO: warning about name collision.
	// TODO: what about the exec order of task's depends and depends' depends?
	// TODO: what about hidden task's depends?
	function registerGulpTask(task, depends) {
		gulp.task(task.displayName || task.name, depends || [], task);
	}
}

function createConfigurableTasks(rawConfigs, registerGulpTask) {
	var stuff = require('./stuff');
	var runnerFactory = new ConfigurableTaskRunnerFactory(stuff);
	var taskFactory = new ConfigurableTaskFactory(stuff, runnerFactory);
	var configs = Configuration.sort({}, rawConfigs, {}, {});
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

	function createConfigurableTask(prefix, name, rawConfig, parentConfig) {
		var schema, consumes, configs, taskInfo, runner, task;

		taskInfo = ConfigurableTaskFactory.getTaskRuntimeInfo(name);

		if (rawConfig.debug) {
			debugger;
		}

		if (ConfigurableTaskFactory.isDisabled(taskInfo)) {
			return null;
		}

		schema = getTaskSchema(taskInfo.name);
		consumes = getTaskConsumes(taskInfo.name);

		if (schema) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig, schema);
		} else {
			configs = Configuration.sort_deprecated(rawConfig, parentConfig, consumes);
		}
		runner = runnerFactory.create(prefix, configs, createSubConfigurableTasks);
		task = taskFactory.create(prefix, taskInfo, configs.taskConfig, runner);

		if (ConfigurableTaskFactory.isVisible(task)) {
			// TODO: call parallel for depends and then remove it from taskConfig.
			registerGulpTask(task, configs.taskInfo.depends);
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
}

function createHelpGulpTask(registerGulpTask) {
	registerGulpTask(require('./help'));
}

module.exports = configure;
