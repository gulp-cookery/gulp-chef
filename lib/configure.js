'use strict';

var ConfigurableRecipeFactory = require('./core/configurable_recipe_factory');
var ConfigurableTaskFactory = require('./core/configurable_task_factory');
var Configuration = require('./core/configuration');
var Registry = require('./core/registry');
var help = require('./help');
var log = require('gulp-util').log;

function configure(rawConfigs, options) {
	var stuff, registry, recipeFactory, taskFactory, configs;

	Configuration.setOptions(options);

	stuff = require('./stuff')(options);
	registry = new Registry(postConfigure);
	recipeFactory = new ConfigurableRecipeFactory(stuff, registry);
	taskFactory = new ConfigurableTaskFactory(stuff, recipeFactory, registry);
	configs = Configuration.sort({}, rawConfigs, {});

	taskFactory.multiple('', configs.subTaskConfigs, configs.taskConfig);
	registry.set('help', taskFactory.create('', {}, {}, help));
	// TODO: add cli module to handle cli options.
	// TODO: add '--recipes' task that list available recipes?
	// TODO: add '--recipe {recipe}' task that display detail information of a specific recipe?
	// TODO: add '--task {task}' task that display detail information of a specific task?
	// TODO: add '--generate' task that write gulefile.js for every registered tasks with transformed(conditional configuration) and flattened(flatten nested configuration) confgurations?

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
