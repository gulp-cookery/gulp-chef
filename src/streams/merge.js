'use strict';

/*jshint node: true */
/*global process*/

/**
 * Recipe:
 * 	Async Streams (from gulp.js cheatsheet p.2)
 *
 * Ingredients:
 * 	merge-stream
 *
 * Note:
 *  Some kind of stream version of gulp.parallel().
 *
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *
 */
function merge(gulp, config, stream, tasks) {
	// lazy loading required modules.
	var _merge = require('merge-stream'),
		ConfigurableTaskError = require('../core/configurable_task_error.js');

	if (stream) {
		throw new ConfigurableTaskError('merge', 'merge stream-processor do not accept up-stream');
	}

	if (tasks.length === 0) {
		throw new ConfigurableTaskError('merge', 'no sub task specified');
	}

	if (tasks.length === 1) {
		return runTask(tasks[0]);
	}

	return _merge(tasks.map(runTask));

	function runTask(task) {
		var stream = task.run(gulp, config, stream, done);
		if (!isStream(stream)) {
			// TODO: Do not throw errors inside a stream. According to the [Guidelines](https://github.com/gulpjs/gulp/blob/4.0/docs/writing-a-plugin/guidelines.md)
			throw new ConfigurableTaskError('merge', 'sub task must return a stream');
		}
		return stream;

		function done() {}
	}

	function isStream(target) {
		return (typeof target.pipe === 'function');
	}
}

merge.expose = [];

merge.requires = {
	"merge-stream": ""
};

merge.schema = {
	"title": "merge",
	"description": "",
	"properties": {
	}
};

module.exports = merge;
