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

	async.each(tasks, function (task, done) {
		asyncDone(function (done) {
			return task.run(gulp, config, stream, done);
		}, done);
	}, done);
}

parallel.requires = {
	"async": "",
	"async-done": ""
};

parallel.schema = {
	"title": "parallel",
	"description": "",
	"properties": {
	}
};

module.exports = parallel;
