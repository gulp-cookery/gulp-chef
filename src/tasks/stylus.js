'use strict';

/**
 * Ingredients:
 *
 * gulp-stylus
 * https://github.com/stevelacy/gulp-stylus
 *
 * gulp-flatten
 * https://github.com/armed/gulp-flatten
 *
 * gulp-newer
 * https://github.com/tschaub/gulp-newer
 *
 * gulp-sourcemaps
 * https://github.com/floridoo/gulp-sourcemaps
 *
 */
function stylusTask(gulp, config, stream, done) {
	// lazy loading required modules.
	var stylus = require('gulp-stylus'),
		flatten = require('gulp-flatten'),
		newer = require('gulp-newer'),
		sourcemaps = require('gulp-sourcemaps'),
		_ = require('lodash');

	var options = _.defaults({}, config.options, defaults.options, {
			compress: !config.debug
		}),
		sourcemap = !config.debug && (config.sourcemap || config.sourcemaps);

	if (!stream) {
		stream = gulp.src(config.src.globs, config.src.options);
	}

	if (config.flatten) {
		stream = stream.pipe(flatten());
	}

	stream = stream.pipe(newer(config.dest.path));

	if (sourcemap) {
		stream = stream.pipe(sourcemaps.init());
	}

	stream = stream.pipe(stylus(options));

	if (sourcemap) {
		// To write external source map files,
		// pass a path relative to the destination to sourcemaps.write().
		stream = stream.pipe(sourcemaps.write(sourcemap === 'inline' ? undefined : '.'));
	}

	return stream
		.pipe(gulp.dest(config.dest.path, config.dest.options));
}

stylusTask.schema = {
	"title": "stylus",
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
		"sourcemap": {
			"description": "generate sourcemap file or not?",
			"enum": [
				"inline", "external", false
			],
			"alias": ["sourcemaps"],
			"default": false
		},
		"options": {
			"description": "",
			"properties": {
				"include css": {
					"description": "",
					"type": "boolean",
					"default": true
				},
				"resolve url": {
					"description": "",
					"type": "boolean",
					"default": true
				},
				"urlfunc": {
					"description": "",
					"type": "string",
					"default": "url"
				}
			}
		}
	},
	"required": ["src", "dest"]
};

module.exports = stylusTask;
