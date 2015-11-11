'use strict';

/*jshint node: true */
/*global process*/

/**
 * Recipe:
 * 	Stream Array (from gulp.js cheatsheet p.2)
 *
 * Ingredients:
 * 	merge-stream
 *
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *
 */
function each(gulp, config, stream, tasks) {
	// lazy loading required modules.
	var mergeStream = require('merge-stream'),
		merge = require('./merge');

	var ConfigurationError = require('../core/configuration_error');

	if (config.values.length === 0) {
		throw new ConfigurationError('each', 'configuration property "values" is required');
	}

	if (config.values.length === 1) {
		return processValue(config.values[0]);
	}

	var streams = config.values.map(processValue);
	return mergeStream(streams);

	function processValue(value) {
		return merge(gulp, value, stream, tasks);
	}
}

each.expose = [];
each.schema = {
	"title": "each",
	"description": "",
	"properties": {
		"values": {
			"description": "",
			"type": "array"
		}
	},
	"required": ["values"]
};

module.exports = each;
