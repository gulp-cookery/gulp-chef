'use strict';

var Sinon = require('sinon');
var base = process.cwd();

var ConfigurableRecipeRegistry = require(base + '/lib/core/configurable_recipe_registry');

module.exports = function () {
	return {
		flows: new ConfigurableRecipeRegistry({
			parallel: Sinon.spy(),
			series: Sinon.spy(),
			'flow-task': Sinon.spy()
		}),
		streams: new ConfigurableRecipeRegistry({
			merge: Sinon.spy(),
			'stream-task': Sinon.spy()
		}),
		tasks: new ConfigurableRecipeRegistry({
			copy: Sinon.spy(),
			'task-task': Sinon.spy()
		})
	};
};
