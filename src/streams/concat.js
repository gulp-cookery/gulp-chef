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
function concat(gulp, config, stream, tasks) {
	// lazy loading required modules.
	var queue = require('./queue'),
		gulpConcat = require('gulp-concat');

	var ConfigurationError = require('../core/configuration_error');

	if (!config.file) {
		throw new ConfigurationError('concat', 'configuration property "file" is required')
	}

	if (!config.dest) {
		throw new ConfigurationError('concat', 'configuration property "dest" is required')
	}

	if (tasks.length !== 0) {
		stream = queue(gulp, config, stream, tasks);
	} else {
		if (!config.src) {
			throw new ConfigurationError('concat', 'configuration property "src" is required')
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

module.exports = concat;
