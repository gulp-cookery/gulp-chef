'use strict';
var Sinon = require('sinon'),
	_ = require('lodash'),
	base = process.cwd();

var ConfigurableRecipeRegistry = require(base + '/src/core/configurable_recipe_registry');

module.exports = function () {
	return {
		flows: new ConfigurableRecipeRegistry({
			parallel: Sinon.spy(),
			series: Sinon.spy()
		}),
		recipes: new ConfigurableRecipeRegistry({
			copy: Sinon.spy(),
			'recipe-task': Sinon.spy()
		}),
		streams: new ConfigurableRecipeRegistry({
			merge: fakeStreamRunner,
			'stream-task': fakeStreamRunner
		})
	};

	function fakeStreamRunner(gulp, config, stream, tasks) {
		tasks.forEach(function (task) {
			task.run(gulp, config, stream, done);
		});
	}

	function done() {
	}
};
