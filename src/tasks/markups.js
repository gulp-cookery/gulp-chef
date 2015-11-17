'use strict';

/**
 * Recipe:
 * html markups
 *
 * Ingredients:
 *
 * gulp-flatten
 * https://github.com/armed/gulp-flatten
 *
 * gulp-htmlmin
 * https://github.com/jonschlinkert/gulp-htmlmin
 *
 * gulp-newer
 * https://github.com/tschaub/gulp-newer
 *
 * gulp-sourcemaps
 * https://github.com/floridoo/gulp-
 *
 */
function markupsTask(gulp, config, stream, done) {

	// lazy loading required modules.
	var flatten = require('gulp-flatten'),
		htmlmin = require('gulp-htmlmin'),
		newer = require('gulp-newer');

	if (!stream) {
		stream = gulp.src(config.src.globs, config.src.options);
	}

	if (config.flatten) {
		stream = stream.pipe(flatten());
	}

	stream = stream.pipe(newer(config.dest.path));

	if (!config.debug) {
		stream = stream.pipe(htmlmin(config.options));
	}

	return stream.pipe(gulp.dest(config.dest.path, config.dest.options));
}

markupsTask.requires = {
	"gulp-flatten": "",
	"gulp-htmlmin": "",
	"gulp-newer": ""
};

markupsTask.schema = {
	"title": "markups",
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
			"default": false
		},
		"options": {
			"description": "",
			"properties": {
				"collapseWhitespace": {
					"description": "",
					"type": "boolean",
					"default": true
				},
				"collapseBooleanAttributes": {
					"description": "",
					"type": "boolean",
					"default": true
				}
			}
		}
	},
	"required": ["src", "dest"]
};

module.exports = markupsTask;
