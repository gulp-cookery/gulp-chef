'use strict';

var ConfigurableRecipeRegistry = require('./core/configurable_recipe_registry');

var cwd = process.cwd();

module.exports = function (options) {
	return {
		flows: ConfigurableRecipeRegistry.builder('flow')
			.dir(cwd, 'gulp/flows')
			.npm(options)
			.dir(__dirname, 'flows')
			.build(),
		streams: ConfigurableRecipeRegistry.builder('stream')
			.require('gulp-ccr-merge')
			.require('gulp-ccr-pipe')
			.require('gulp-ccr-queue')
			.dir(cwd, 'gulp/streams')
			.npm(options)
			.build(),
		tasks: ConfigurableRecipeRegistry.builder('task')
			.dir(cwd, 'gulp')
			.dir(cwd, 'gulp/tasks')
			.npm(options)
			.dir(__dirname, 'tasks')
			.build()
	};
};
