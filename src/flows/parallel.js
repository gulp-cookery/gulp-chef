"use strict";

/**
 * Recipe:
 * parallel
 *
 * Ingredients:
 * async, asnyc-done
 *
 * Note:
 *  Some kind of non-stream version of merge() stream recipe.
 *
 * @param done
 */
function parallel(done) {
	var async = require('async'),
		asyncDone = require('async-done');

	var gulp = this.gulp,
		config = this.config,
		tasks = this.tasks;

	async.map(tasks, function (task, itemDone) {
		asyncDone(function (taskDone) {
			var ctx = {
				gulp: gulp,
				config: config
			};
			return task.run.call(ctx, taskDone);
		}, itemDone);
	}, done);
}

parallel.schema = {
	"title": "parallel",
	"description": "Run the tasks array of functions in parallel, without waiting until the previous function has completed.",
	"type": "object",
	"properties": {}
};

parallel.type = 'flow';

module.exports = parallel;
