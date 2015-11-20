"use strict";

/**
 * Recipe:
 * parallel
 *
 * Ingredients:
 * gulp.parallel()
 *
 * Note:
 *  Some kind of non-stream version of merge() stream recipe.
 *
 * @param gulp
 * @param config
 * @param stream
 * @param tasks
 */
function parallel(gulp, config, stream, tasks, done) {
	var async = require('async'),
		asyncDone = require('async-done');

	async.map(tasks, function (task, itemDone) {
		asyncDone(function (taskDone) {
			return task.run(gulp, config, stream, taskDone);
		}, itemDone);
	}, done);
}

parallel.requires = {
	"async": "",
	"async-done": ""
};

parallel.schema = {
	"title": "parallel",
	"description": "Run the tasks array of functions in parallel, without waiting until the previous function has completed.",
	"type": "object",
	"properties": {}
};

module.exports = parallel;
