'use strict';

var ConfigurableRecipeFactory = require('./recipe/factory');

var ConfigurableTaskFactory = require('./task/factory');
var ConfigurableTaskRegistry = require('./task/registry');
var expose = require('./task/expose');

var ConfigurationRegulator = require('./regulator');
var Configuration = require('./configuration');

var loadStuff = require('./stuff');

var Settings = require('./helpers/settings');
var observable = require('./helpers/observable');

var cli = require('./cli');

var log = require('gulplog');

var phase = {
	preConfigure: observable(),
	postConfigure: observable(),
	postRegister: observable()
};

function configure(settings, stuff, registry, rawConfigs) {
	var regulator = new ConfigurationRegulator(settings.get('modes'));
	var configs = regulator.regulate(rawConfigs);

	var recipes = new ConfigurableRecipeFactory(stuff, registry);
	var tasks = new ConfigurableTaskFactory(recipes, registry, expose(registry, settings));

	configs = Configuration.sort({}, configs, {});
	tasks.multiple('', configs.subTaskConfigs, configs.taskConfig);

	return registry;
}

function run(rawConfigs, optionalSettings) {
	var settings, stuff, registry;

	settings = new Settings(optionalSettings);
	stuff = loadStuff(settings.get('plugins'));

	cli(process.argv.slice(2), phase);

	phase.postRegister(report);
	phase.preConfigure.notify(stuff);
	registry = new ConfigurableTaskRegistry(phase.postRegister.notify);
	configure(settings, stuff, registry, rawConfigs);
	phase.postConfigure.notify(registry);
	return registry;

	function report() {
		var missing;

		// TODO: add warning to description when reference missing.
		missing = registry.missing();
		if (missing.length) {
			log.warn('missing task reference: ' + missing.join(', '));
		}
	}
}

module.exports = run;
