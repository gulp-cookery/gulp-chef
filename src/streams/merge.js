'use strict';

/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *
 */
function merge(gulp, config, stream, tasks) {
	// lazy loading required modules.
	var _merge = require('merge-stream'),
		ConfigurableTaskError = require('../core/configurable_task_error.js');

	if (tasks.length === 0) {
		throw new ConfigurableTaskError('merge', 'no sub task specified');
	}

	if (tasks.length === 1) {
		return runTask(tasks[0]);
	}

	return _merge(tasks.map(runTask));

	function runTask(task) {
		var stream = task.run(gulp, config, stream, done);
		if (!isStream(stream)) {
			throw new ConfigurableTaskError('merge', 'sub task must return a stream');
		}
		return stream;

		function done() {}
	}

	function isStream(target) {
		return (typeof target.pipe === 'function');
	}
}

merge.description = '';

module.exports = merge;
