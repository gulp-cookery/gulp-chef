"use strict";

/**
 * Note:
 *  Some kind of non-stream version of queue() stream recipe.
 *
 * @param gulp
 * @param config
 * @param stream
 * @param tasks
 * @param done
 */
function series(gulp, config, stream, tasks, done) {
	var async = require('async'),
		asyncDone = require('async-done');

	async.mapSeries(tasks, function (task, itemDone) {
		asyncDone(function (taskDone) {
			return task.run(gulp, config, stream, taskDone);
		}, itemDone);
	}, done);
}

series.requires = {
	"async": "",
	"async-done": ""
};

series.schema = {
	"title": "series",
	"description": "Run the functions in the tasks array in series, each one running once the previous function has completed.",
	"type": ["array", "object"]
};

module.exports = series;
