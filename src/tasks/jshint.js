'use strict';

/**
 * Ingredients:
 *
 * jshint
 * https://github.com/jshint/jshint
 *
 * gulp-jshint
 * https://github.com/spalger/gulp-jshint
 */
function jshintTask(gulp, config, stream, done) {

	// lazy loading required modules.
	var jshint = require('gulp-jshint'),
		_ = require('lodash');

	if (!stream) {
		stream = gulp.src(config.src.globs, config.src.options);
	}
	stream = stream.pipe(jshint());

	if (typeof config.options.reporter === 'string') {
		stream = stream.pipe(jshint.reporter(config.options.reporter));
	} else {
		_.each(config.options.reporter, function(options, name) {
			if (typeof name === 'number') {
				name = options;
				options = {};
			}
			stream = stream.pipe(jshint.reporter(name, options));
		});
	}
	return stream;
}

jshintTask.schema = {
	"title": "jshint",
	"description": "",
	"properties": {
		"src": {
			"description": ""
		},
		"options": {
			"description": "",
			"properties": {
				"jshintrc": {
					"description": "",
					"type": "string",
					"default": ".jshintrc"
				},
				reporter: {
					"type": ["object", "array"],
					"default": {
						"default": {
							verbose: true
						}
					},
					"samples": [{
						"jshint-stylish": {},
					}, [
						"default", "jshint-stylish", "fail"
					]]
				}
			}
		}
	},
	"required": ["src"]
};

module.exports = jshintTask;
