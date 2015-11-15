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
	done();
}

series.schema = {
	"title": "series",
	"description": "",
	"properties": {
	}
};

module.exports = series;
