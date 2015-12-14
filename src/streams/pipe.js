'use strict';

var helper = require('./stream-helper')('pipe');

/**
 * Recipe:
 * 	Stream Pipe
 *
 * Ingredients:
 * 	stream.pipe()
 *
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *
 */
function pipe() {
	var helper = require('./stream-helper');

	var i, n, stream;

	var context = this,
		tasks = context.tasks,
		runTask = helper(context, true);

	stream = context.upstream;
	for (i = 0, n = tasks.length; i < n; ++i) {
		context.upstream = stream;
		stream = runTask(tasks[i]);
	}
	return stream;
}

pipe.expose = [];

pipe.schema = {
	"title": "pipe",
	"description": "",
	"properties": {
	}
};

pipe.type = 'stream';

module.exports = pipe;
