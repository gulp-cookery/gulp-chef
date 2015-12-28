'use strict';

var ConfigurableRecipeRegistry = require('./core/configurable_recipe_registry');

var cwd = process.cwd();

module.exports = function (options) {
	return {
		flows: ConfigurableRecipeRegistry.builder('flow')
			.dir(cwd, 'gulp/flows')
			.npm(options)
			.require('gulp-ccr-parallel')
			.require('gulp-ccr-series')
			.require('gulp-ccr-watch')
			.build(),
		streams: ConfigurableRecipeRegistry.builder('stream')
			.dir(cwd, 'gulp/streams')
			.npm(options)
			.require('gulp-ccr-merge')
			.require('gulp-ccr-pipe')
			.require('gulp-ccr-queue')
			.build(),
		tasks: ConfigurableRecipeRegistry.builder('task')
			.dir(cwd, 'gulp')
			.dir(cwd, 'gulp/tasks')
			.npm(options)
			.require('gulp-ccr-clean')
			.require('gulp-ccr-copy')
			.build()
	};
};
