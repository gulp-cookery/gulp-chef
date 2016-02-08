'use strict';

var ConfigurableRecipeRegistry = require('./recipe/registry');

var cwd = process.cwd();

var _defaults = {
	lookups: {
		flows: 'gulp/flows',
		streams: 'gulp/streams',
		tasks: 'gulp/tasks'
	},
	plugins: {
		camelize: false,
		config: process.cwd() + '/package.json',
		pattern: ['gulp-ccr-*'],
		replaceString: ConfigurableRecipeRegistry.replaceString
	}
};

module.exports = function (settings) {
	var lookups, plugins;

	settings = settings.defaults(_defaults);
	lookups = settings.get('lookups');
	plugins = settings.get('plugins');
	return {
		flows: ConfigurableRecipeRegistry.builder('flow')
			.dir(cwd, lookups.flows)
			.npm(plugins)
			.require('gulp-ccr-parallel')
			.require('gulp-ccr-series')
			.require('gulp-ccr-watch')
			.build(),
		streams: ConfigurableRecipeRegistry.builder('stream')
			.dir(cwd, lookups.streams)
			.npm(plugins)
			.require('gulp-ccr-merge')
			.require('gulp-ccr-pipe')
			.require('gulp-ccr-queue')
			.build(),
		tasks: ConfigurableRecipeRegistry.builder('task')
			.dir(cwd, lookups.tasks)
			.dir(cwd, 'gulp')
			.npm(plugins)
			.require('gulp-ccr-clean')
			.require('gulp-ccr-copy')
			.build()
	};
};
