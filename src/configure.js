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
	var registry = {
		register: registerGulpTask
	};
	var runnerFactory = new ConfigurableTaskRunnerFactory(stuff);
	var taskFactory = new ConfigurableTaskFactory(stuff, runnerFactory, registry);
	var configs = Configuration.sort({}, rawConfigs, {}, {});
	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
}

function createHelpGulpTask(registerGulpTask) {
	registerGulpTask(require('./help'));
}

module.exports = configure;
