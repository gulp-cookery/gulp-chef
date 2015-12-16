'use strict';

// TODO: use ESLint

var ConfigurableRecipeFactory = require('./core/configurable_recipe_factory'),
	ConfigurableTaskFactory = require('./core/configurable_task_factory'),
	Configuration = require('./core/configuration'),
	Registry = require('./core/registry');

function configure(rawConfigs, options) {
	Configuration.setOptions(options);
	var registry = new Registry(postConfigure),
		stuff = require('./stuff')(options),
		recipeFactory = new ConfigurableRecipeFactory(stuff, registry),
		taskFactory = new ConfigurableTaskFactory(stuff, recipeFactory, registry),
		configs = Configuration.sort({}, rawConfigs, {}, Configuration.SCHEMA_COMMONS),
		helpRecipe = stuff.tasks.lookup('help');

	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
	registry.set('help', taskFactory.create('', {}, {}, helpRecipe));
	// TODO: add '--man' task that display task detail information?
	// TODO: add '--regulate' task that write gulefile.js with regulated confgurations?
	// TODO: add '--generate' task that write gulefile.js with transformed and flattened confgurations?

	// export recipes registry
	return registry;

	function postConfigure(gulp) {
		var missing = registry.missing(gulp);
		if (missing) {
			console.log('Warning: missing task reference: ' + missing.join(', '));
		}
	}
}

module.exports = configure;
