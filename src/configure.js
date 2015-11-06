'use strict';
var ConfigurableTaskRunnerFactory = require('./core/configurable_runner_factory'),
	ConfigurableTaskFactory = require('./core/configurable_task_factory'),
	Configuration = require('./core/configuration'),
	stuff = require('./stuff'),
	helpRunner = stuff.recipes.lookup('help');

// TODO: consider exporting recipes using [Undertaker](https://github.com/gulpjs/undertaker#custom-registries) registry.
function configure(gulp, rawConfigs) {
	var registry = {
			register: registerGulpTask
		},
		runnerFactory = new ConfigurableTaskRunnerFactory(stuff),
		taskFactory = new ConfigurableTaskFactory(gulp, stuff, runnerFactory, registry),
		configs = Configuration.sort({}, rawConfigs, {}, {});

	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
	registerGulpTask(taskFactory.create('', {}, {}, helpRunner));

	// TODO: warning about name collision.
	// TODO: what about the exec order of task's depends and depends' depends?
	// TODO: what about hidden task's depends?
	function registerGulpTask(task) {
		var name = task.displayName || task.name;
		gulp.task(name, task);
	}
}

module.exports = configure;
