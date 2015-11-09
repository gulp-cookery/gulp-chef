'use strict';

/**
 * Ingredients:
 *
 * clean-css
 * https://github.com/jakubpawlowicz/clean-css
 *
 * gulp-autoprefixer
 * https://github.com/sindresorhus/gulp-autoprefixer
 *
 * gulp-flatten
 * https://github.com/armed/gulp-flatten
 *
 * gulp-minify-css
 * https://github.com/murphydanger/gulp-minify-css
 *
 * gulp-newer
 * https://github.com/tschaub/gulp-newer
 *
 * gulp-rename
 * https://github.com/hparra/gulp-rename
 *
 * gulp-sourcemaps
 * https://github.com/floridoo/gulp-sourcemaps
 */
function cssTask(gulp, config, stream, done) {
	// lazy loading required modules.
	var autoprefixer = require('gulp-autoprefixer'),
		flatten = require('gulp-flatten'),
		minify = require('gulp-minify-css'),
		newer = require('gulp-newer'),
		rename = require('gulp-rename'),
		sourcemaps = require('gulp-sourcemaps'),
		_ = require('lodash');

	var options = _.defaultsDeep({}, config.options, defaults.options),
		sourcemap = !config.debug && (config.sourcemap || config.sourcemaps);

	if (!stream) {
		stream = gulp.src(config.src.globs, config.src.options);
	}

	if (config.flatten) {
		stream = stream.pipe(flatten());
	}

	stream = stream.pipe(newer(config.dest));

	if (sourcemap) {
		stream = stream.pipe(sourcemaps.init());
	}

	stream = stream.pipe(autoprefixer(options.autoprefixer));

	if (!config.debug) {
		if (config['min.css']) {
			stream = stream.pipe(gulp.dest(config.dest.path, config.dest.options))
				.pipe(rename({
					extname: '.min.css'
				}));
		}
		stream = stream.pipe(minify(options.minify || options));
	}

	if (sourcemap) {
		// To write external source map files,
		// pass a path relative to the destination to sourcemaps.write().
		stream = stream.pipe(sourcemaps.write(sourcemap === 'inline' ? undefined : '.'));
	}

	return stream
		.pipe(gulp.dest(config.dest.path, config.dest.options));
}

cssTask.consumes = ['dest', 'flatten', 'options', 'sourcemap', 'sourcemaps', 'src', "min.css"];
cssTask.schema = {
	"title": 'css',
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
		"min.css": {
			"description": "",
			"type": "boolean",
			"default": true
		},
		"options": {
			"description": "",
			"properties": {
				"autoprefixer": {
					"properties": {
						browsers: {
							"description": "",
							"type": "array",
							"default": ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1', 'safari 5', 'ie 9', 'ios 6', 'android 4']
						},
						cascade: {
							"description": "",
							"type": "boolean",
							"default": true
						},
						remove: {
							"description": "",
							"type": "boolean",
							"default": true
						}
					}
				},
				"minify": {
					"properties": {
						processImport: {
							"description": "",
							"type": "boolean",
							"default": true
						}
					}
				}
			}
		}
	},
	"required": ["src", "dest"]
};

module.exports = cssTask;
