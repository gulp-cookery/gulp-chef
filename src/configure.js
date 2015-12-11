'use strict';

// TODO: use ESLint

var ConfigurableRecipeFactory = require('./core/configurable_recipe_factory'),
	ConfigurableTaskFactory = require('./core/configurable_task_factory'),
	Configuration = require('./core/configuration'),
	Registry = require('./core/registry');

function configure(rawConfigs, options) {
	var registry = new Registry(onInitGulp),
		stuff = require('./stuff')(options),
		runnerFactory = new ConfigurableRecipeFactory(stuff, registry),
		taskFactory = new ConfigurableTaskFactory(stuff, runnerFactory, registry),
		configs = Configuration.sort({}, rawConfigs, {}, Configuration.SCHEMA_COMMONS),
		helpRunner = stuff.recipes.lookup('help');

	Configuration.setOptions(options);
	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
	registry.set('help', taskFactory.create('', {}, {}, helpRunner));

	// export recipes registry
	return registry;

	function onInitGulp(gulp) {
		var missing = registry.missing(gulp);
		if (missing) {
			console.log('Warning: missing task reference: ' + missing.join(', '));
		}
	}
}

module.exports = configure;
