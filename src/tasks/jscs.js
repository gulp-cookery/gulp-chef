'use strict';

/**
 * Recipe:
 * jscs
 *
 * Ingredients:
 * jscs
 *
 */
function jscsTask(gulp, config, stream, done) {
	// lazy loading required modules.
	var jscs = require('jscs');

	return gulp.src(config.src.globs, config.src.options)
		.pipe(jscs(config.options));
}

jscsTask.requires = {
	"jscs": ""
};

jscsTask.schema = {
	"title": "jscs",
	"description": "",
	"properties": {
		"src": {
			"description": ""
		},
		"options": {
			"description": "",
			"properties": {
				"esnext": {
					"description": "",
					"type": "boolean",
					"default": true
				},
				"reporter": {
					"description": "",
					"type": "string",
					"default": "console"
				}
			}
		}
	},
	"required": ["src"]
};

module.exports = jscsTask;
