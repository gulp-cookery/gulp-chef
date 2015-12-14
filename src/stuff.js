'use strict';

var ConfigurableRecipeRegistry = require('./core/configurable_recipe_registry');

var cwd = process.cwd();

module.exports = function (options) {
	return {
		flows: ConfigurableRecipeRegistry.builder()
			.dir(cwd, 'gulp/flows')
			.npm(options)
			.dir(__dirname, 'flows')
			.build(),
		streams: ConfigurableRecipeRegistry.builder()
			.module('configurable-gulp-recipe-merge')
			.module('configurable-gulp-recipe-queue')
			.dir(cwd, 'gulp/streams')
			.npm(options)
			.dir(__dirname, 'streams')
			.build(),
		tasks: ConfigurableRecipeRegistry.builder()
			.dir(cwd, 'gulp')
			.dir(cwd, 'gulp/tasks')
			.npm(options)
			.dir(__dirname, 'tasks')
			.build()
	};
};
