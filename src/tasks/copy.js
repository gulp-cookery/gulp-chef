'use strict';

/**
 * Recipe:
 * copy files
 *
 * Ingredients:
 * gulp-flatten
 * gulp.src()
 * gulp.dest()
 *
 * @param gulp
 * @param config
 * @param stream
 * @param done
 * @returns stream
 */
function copyTask(gulp, config, stream, done) {
	var flatten = require('gulp-flatten');

	if (!stream) {
		stream = gulp.src(config.src.globs, config.src.options);
	}

	if (config.flatten) {
		stream = stream.pipe(flatten());
	}
	return stream.pipe(gulp.dest(config.dest.path, config.dest.options));
}

copyTask.schema = {
	"title": "copy",
	"description": "",
	"properties": {
		"src": {
			"description": ""
		},
		"dest": {
			"description": ""
		},
		"flatten": {
			"description": "",
			"type": "boolean",
		}
	},
	"required": ["src", "dest"]
};

copyTask.type = 'task';

module.exports = copyTask;
