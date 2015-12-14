'use strict';

var helper = require('./stream-helper')('queue');

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
function queue() {
	// lazy loading required modules.
	var StreamQueue = require('streamqueue'),
		helper = require('./stream-helper');

	var context = this,
		tasks = context.tasks,
		runTask = helper(context);

	if (tasks.length === 1) {
		return runTask(tasks[0]);
	}

	var streams = tasks.map(runTask),
		streamQueue = new StreamQueue({
			objectMode: true
		});
	return streamQueue.done.apply(streamQueue, streams);
}

queue.expose = [];

queue.schema = {
	"title": "queue",
	"description": "Pipe queued streams progressively",
	"properties": {
	}
};

queue.type = 'stream';

module.exports = queue;
