'use strict';
var ConfigurableTaskRunnerFactory = require('./core/configurable_runner_factory'),
	ConfigurableTaskFactory = require('./core/configurable_task_factory'),
	Configuration = require('./core/configuration'),
	Registry = require('./core/registry'),
	DependencyManager = require('./core/dependency_manager'),
	packages = process.cwd() + '/package.json',
	store = require(packages),
	stuff = require('./stuff'),
	helpRunner = stuff.recipes.lookup('help');

// TODO: resolve too many dependencies problem. (optionalDependencies?). [THOUGHT]: check out bumpTask's bumpTask.requires comments.
function configure(rawConfigs, options) {
	var registry = new Registry(),
		manager = new DependencyManager(packages),
		runnerFactory = new ConfigurableTaskRunnerFactory(stuff, manager),
		taskFactory = new ConfigurableTaskFactory(stuff, runnerFactory, registry),
		configs = Configuration.sort({}, rawConfigs, {}, Configuration.SCHEMA_COMMONS);

	Configuration.setOptions(options);
	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
	if (manager.flush()) {
		manager.save(packages + '.new');
		console.log('Notice: new dependencies required by used recipes, please run "npm update" to install them.')
		process.exit(1);
	}

	registry.set('help', taskFactory.create('', {}, {}, helpRunner));

	// export recipes registry
	return registry;
}

module.exports = configure;
