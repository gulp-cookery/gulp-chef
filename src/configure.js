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

function configure(rawConfigs, options) {
	var registry = new Registry(),
		manager = new DependencyManager(store),
		runnerFactory = new ConfigurableTaskRunnerFactory(stuff, manager),
		taskFactory = new ConfigurableTaskFactory(stuff, runnerFactory, registry),
		configs = Configuration.sort({}, rawConfigs, {}, Configuration.SCHEMA_COMMONS);

	Configuration.setOptions(options);
	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
	if (manager.flush()) {
		try {
			if (process.cwd().endsWith('configurable-gulp-recipes')) {
				manager.save(packages + '.new');
			} else {
				manager.save(packages);
			}
			console.log('Notice: new dependencies required by used recipes, please run "npm update" to install them.')
		} catch (ex) {
			console.log('Error: can\'t update package.json for required modules');
		}
		process.exit(0);
	}

	registry.set('help', taskFactory.create('', {}, {}, helpRunner));

	// export recipes registry
	return registry;
}

module.exports = configure;
