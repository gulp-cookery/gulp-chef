'use strict';

var ConfigurableRecipeFactory = require('./core/configurable_recipe_factory');
var ConfigurableTaskFactory = require('./core/configurable_task_factory');
var Configuration = require('./core/configuration');
var Registry = require('./core/registry');
var log = require('gulp-util').log;

function configure(rawConfigs, options) {
	var stuff, registry, recipeFactory, taskFactory, configs, helpRecipe;

	Configuration.setOptions(options);

	stuff = require('./stuff')(options);
	registry = new Registry(postConfigure);
	recipeFactory = new ConfigurableRecipeFactory(stuff, registry);
	taskFactory = new ConfigurableTaskFactory(stuff, recipeFactory, registry);
	configs = Configuration.sort({}, rawConfigs, {});
	helpRecipe = stuff.tasks.lookup('help');

	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
	registry.set('help', taskFactory.create('', {}, {}, helpRecipe));
	// TODO: add '--man' task that display task detail information?
	// TODO: add '--regulate' task that write gulefile.js with regulated confgurations?
	// TODO: add '--generate' task that write gulefile.js with transformed and flattened confgurations?

	// export recipes registry
	return registry;

	function postConfigure(gulp) {
		var missing;

		missing = registry.missing(gulp);
		if (missing) {
			log('Warning: missing task reference: ' + missing.join(', '));
		}
	}
}

module.exports = configure;
