'use strict';

var ConfigurableRecipeFactory = require('./recipe/factory');
var ConfigurableTaskFactory = require('./task//factory');
var ConfigurationRegulator = require('./core/configuration_regulator');
var Configuration = require('./core/configuration');
var Registry = require('./task/registry');
var Settings = require('./settings');
var stuffLoader = require('./stuff');
var help = require('./help');
var log = require('gulp-util').log;

function configure(rawConfigs, optionalSettings) {
	var settings, stuff, registry, regulator, recipeFactory, taskFactory, configs;

	settings = optionalSettings || {};
	Settings.set(settings);

	regulator = new ConfigurationRegulator(settings.modes);
	configs = regulator.regulate(rawConfigs);

	stuff = stuffLoader(settings);
	registry = new Registry(postConfigure);
	recipeFactory = new ConfigurableRecipeFactory(stuff, registry);
	taskFactory = new ConfigurableTaskFactory(stuff, recipeFactory, registry);
	configs = Configuration.sort({}, configs, {});

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
