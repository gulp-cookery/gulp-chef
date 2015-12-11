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
function each(done) {
	// lazy loading required modules.
	var mergeStream = require('merge-stream'),
		merge = require('../../src/streams/merge');

	var verify = require('../../src/core/configuration_verifier');

	var gulp = this.gulp,
		config = this.config,
		stream = this.stream,
		tasks = this.tasks;

	verify(each.schema, config);

	if (config.values.length === 1) {
		return processValue(config.values[0]);
	}

	var streams = config.values.map(processValue);
	return mergeStream(streams);

	function processValue(value) {
		var context = {
			gulp: gulp,
			config: value,
			stream: stream,
			tasks: tasks
		};
		return merge.call(context, done);
	}
}

each.expose = [];

each.schema = {
	"title": "each",
	"description": "",
	"properties": {
		"values": {
			"description": "",
			"type": "array",
			"minItems": 1
		}
	},
	"required": ["values"]
};

each.type = 'stream';

module.exports = each;
