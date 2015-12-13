'use strict';

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
	var PluginError = require('gulp-util').PluginError;

	var i, n, stream;

	var context = this,
		tasks = context.tasks;

	if (tasks.length === 0) {
		throw new PluginError('pipe', 'no sub task specified');
	}

	stream = context.upstream;
	for (i = 0, n = tasks.length; i < n; ++i) {
		context.upstream = stream;
		stream = tasks[i].run.call(context, done);
		if (!stream) {
			// TODO: Do not throw errors inside a stream. According to the [Guidelines](https://github.com/gulpjs/gulp/blob/4.0/docs/writing-a-plugin/guidelines.md)
			throw new PluginError('pipe', 'recipes in pipe stream-processor must return a stream');
		}
	}
	return stream;

	function done() {}
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
