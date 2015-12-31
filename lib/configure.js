'use strict';

var ConfigurableRecipeFactory = require('./recipe/factory');
var ConfigurableTaskFactory = require('./task/factory');
var ConfigurableTaskRegistry = require('./task/registry');
var ConfigurationRegulator = require('./regulator');
var Configuration = require('./configuration');
var loadStuff = require('./stuff');
var Settings = require('./helpers/settings');
var observable = require('./helpers/observable');
var cli = require('./cli');
var log = require('gulp-util').log;

var _defaultSettings = {
	exposeExplicitCompositeTask: false,
	exposeWithoutPrefix: false
};

function configure(settings, stuff, registry, rawConfigs) {
	var regulator = new ConfigurationRegulator(settings.get('modes'));
	var configs = regulator.regulate(rawConfigs);

	var recipes = new ConfigurableRecipeFactory(stuff, registry);
	var tasks = new ConfigurableTaskFactory(stuff, recipes, registry, settings);

	configs = Configuration.sort({}, configs, {});
	tasks.multiple('', configs.subTaskConfigs, configs.taskConfig);

	return registry;
}

var phase = {
	preConfigure: observable(),
	postConfigure: observable(),
	postRegister: observable()
}

function run(rawConfigs, optionalSettings) {
	var settings, stuff, registry;

	settings = new Settings(optionalSettings, _defaultSettings);
	stuff = loadStuff(settings.get('plugins'));

	cli(process.argv.slice(2), phase);

	phase.postRegister(report);
	phase.preConfigure.notify(stuff);
	registry = new ConfigurableTaskRegistry(phase.postRegister.notify);
	return configure(settings, stuff, registry, rawConfigs);

	function report() {
		var missing;

		missing = registry.missing();
		if (missing) {
			log('Warning: missing task reference: ' + missing.join(', '));
		}
	}
}

module.exports = run;
