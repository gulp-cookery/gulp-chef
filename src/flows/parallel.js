"use strict";

function bachParallel() {
	var bach = require('bach'),
		gulp = require('gulp');

	var _parallel = gulp.parallel ? gulp.parallel.bind(gulp) : bach.parallel.bind(bach);

	function parallel(gulp, config, stream, tasks) {
		var parallelTasks = tasks.map(function (task) {
			if (typeof task === 'function') {
				return task;
			} else if (typeof task === 'string') {
				return gulp.task(task);
			}
		});
		var fn = _parallel.apply(null, parallelTasks);
		return fn();
	}

	return parallel;
}

/**
 * Recipe:
 * parallel
 *
 * Ingredients:
 * gulp.parallel()
 *
 *
 * @param gulp
 * @param config
 * @param stream
 * @param tasks
 */
// TODO: replace fake implementation
function parallel(gulp, config, stream, tasks, done) {
	for (var i = 0; i < tasks.length; ++i) {
		tasks[i].run(gulp, config, stream, _done);
	}

	function _done() {
	}
}

parallel.schema = {
	"title": "parallel",
	"description": "",
	"Properties": {
	}
};

module.exports = parallel;
