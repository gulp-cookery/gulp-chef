'use strict';
var ConfigurableTaskRunnerFactory = require('./core/configurable_runner_factory'),
	ConfigurableTaskFactory = require('./core/configurable_task_factory'),
	Configuration = require('./core/configuration'),
	Registry = require('./core/registry'),
	stuff = require('./stuff'),
	helpRunner = stuff.recipes.lookup('help');

// TODO: resolve too many dependencies problem. (optionalDependencies?). [THOUGHT]: check out bumpTask's bumpTask.requires comments.
function configure(gulp, rawConfigs, options) {
	var registry = new Registry(),
		runnerFactory = new ConfigurableTaskRunnerFactory(stuff),
		taskFactory = new ConfigurableTaskFactory(gulp, stuff, runnerFactory, registry),
		configs = Configuration.sort({}, rawConfigs, {}, {});

	Configuration.setOptions(options);
	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
	registry.set('help', taskFactory.create('', {}, {}, helpRunner));

	// export recipes registry
	return registry;
}

module.exports = configure;
