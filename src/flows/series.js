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
	"description": "",
	"properties": {
	}
};

module.exports = series;
