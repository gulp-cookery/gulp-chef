'use strict';

var Sinon = require('sinon');
var base = process.cwd();

var ConfigurableRecipeRegistry = require(base + '/lib/recipe/registry');

function create(name, fn) {
	var recipe = Sinon.spy(fn);
	recipe.schema = {
		title: name
	};
	return recipe;
}

module.exports = function () {

	return {
		flows: new ConfigurableRecipeRegistry({
			parallel: create('parallel'),
			series: create('series'),
			'flow-task': create('flow-task')
		}),
		streams: new ConfigurableRecipeRegistry({
			merge: create('merge'),
			'stream-task': create('stream-task')
		}),
		tasks: new ConfigurableRecipeRegistry({
			copy: create('copy'),
			'task-task': create('task-task')
		})
	};
};
