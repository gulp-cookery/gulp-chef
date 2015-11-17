'use strict';

/*jshint node: true */
/*global process*/

/**
 * Recipe:
 * 	Serial Join (from gulp.js cheatsheet p.2)
 *
 * Ingredients:
 * 	streamqueue
 *
 * Note:
 *  Some kind of stream version of gulp.series().
 *
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *
 */
function queue(gulp, config, stream, tasks) {
	// lazy loading required modules.
	var StreamQueue = require('streamqueue'),
		ConfigurableTaskError = require('../core/configurable_task_error.js');

	if (stream) {
		throw new ConfigurableTaskError('queue', 'queue stream-processor do not accept up-stream');
	}

	if (tasks.length === 0) {
		throw new ConfigurableTaskError('queue', 'no sub task specified');
	}

	if (tasks.length === 1) {
		return runTask(tasks[0]);
	}

	var streams = tasks.map(runTask),
		streamQueue = new StreamQueue({
			objectMode: true
		});
	return streamQueue.done.apply(streamQueue, streams);

	function runTask(task) {
		var stream = task.run(gulp, config, stream, done);
		if (!isStream(stream)) {
			// TODO: Do not throw errors inside a stream. According to the [Guidelines](https://github.com/gulpjs/gulp/blob/4.0/docs/writing-a-plugin/guidelines.md)
			throw new ConfigurableTaskError('queue', 'sub task must return a stream');
		}
		return stream;

		function done() {}
	}

	function isStream(target) {
		return (typeof target.pipe === 'function');
	}
}

queue.expose = [];

queue.requires = {
	"streamqueue": ""
};

queue.schema = {
	"title": "queue",
	"description": "Pipe queued streams progressively",
	"properties": {
	}
};


module.exports = queue;
