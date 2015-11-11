'use strict';

/**
 * Recipe:
 * uglify
 *
 * Ingredients:
 * gulp-rename
 * gulp-uglify
 *
 * @param gulp
 * @param config
 * @param stream
 * @returns {*}
 */
function uglifyTask(gulp, config, stream) {
	var rename = require('gulp-rename'),
		uglify = require('gulp-uglify');

	if (!stream) {
		stream = gulp.src(config.src.globs, config.src.options);
	}

	if (!config.debug) {
		stream = stream.pipe(uglify(config.options));
	}

	// TODO: determine when to write file:
	//    1.only if config.file exist? but if user don't want to rename?
	//    2.only if config.dest exist? but config.dest usally set globally.
	if (config.file) {
		stream = stream.pipe(rename(config.file))
			.pipe(gulp.dest(config.dest.path, config.dest.options));
	}

	return stream;
}

uglifyTask.schema = {
	"title": "uglify",
	"description": "",
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
		},
		"options": {
			"description": "",
			"properties": {
				"preserveComments": {
					"description": "",
					"type": "string",
					"default": "some"
				}
			}
		}
	},
	"required": ["src", "dest", "file"]
};

module.exports = uglifyTask;
