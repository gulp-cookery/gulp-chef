'use strict';

/**
 * Recipe:
 * 	Serial Join (from gulp.js cheatsheet p.2)
 *
 * Ingredients:
 * 	streamqueue
 * 	gulp-concat
 *
 * @param gulp the gulp instance running this task
 * @param config configuration for the task
 * @param stream up-stream, if not null, the task must handle source from the stream
 * @param tasks configurable sub-tasks
 *
 */
function concat(done) {
	// lazy loading required modules.
	var queue = require('./queue'),
		gulpConcat = require('gulp-concat');

	var verify = require('../../src/core/configuration_verifier');

	var gulp = this.gulp,
		config = this.config,
		stream = this.stream,
		tasks = this.tasks;

	verify(concat.schema, config);

	if (tasks.length !== 0) {
		stream = queue.call(this);
	} else {
		if (!stream && !config.src) {
			// TODO: Do not throw errors inside a stream. According to the [Guidelines](https://github.com/gulpjs/gulp/blob/4.0/docs/writing-a-plugin/guidelines.md)
			throw new Error('concat', 'configuration property "src" is required, otherwise an up-stream must be provided')
		}
		stream = stream || gulp.src(config.src.globs, config.src.options);
	}

	return stream
		.pipe(gulpConcat(config.file))
		.pipe(gulp.dest(config.dest.path, config.dest.options));
}

concat.schema = {
	"title": "concat",
	"description": "Concatenates files",
	"properties": {
		"src": {
			"description": ""
		},
		"dest": {
			"description": ""
		},
		"file": {
			"description": "",
			"type": "string"
		}
	},
	"required": ["dest", "file"]
};

concat.type = 'stream';

module.exports = concat;
