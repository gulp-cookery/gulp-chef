'use strict';

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
	name: "copy",
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

module.exports = copyTask;
