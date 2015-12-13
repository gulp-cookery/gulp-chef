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
 * @param done
 * @returns stream
 */
function copyTask(done) {
	var flatten = require('gulp-flatten');

	var context = this,
	    gulp = context.gulp,
		config = context.config,
		upstream = context.upstream,
		stream;

	stream = upstream || gulp.src(config.src.globs, config.src.options);
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
