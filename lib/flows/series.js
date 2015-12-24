/* eslint consistent-this: 0 */
'use strict';

/**
 * Note:
 *  Some kind of non-stream version of queue() stream recipe.
 *
 * @param done
 */
function series(done) {
	var async = require('async');
	var asyncDone = require('async-done');

	var context = this;
	var tasks = context.tasks;

	async.mapSeries(tasks, function (task, itemDone) {
		asyncDone(function (taskDone) {
			return task.run.call(context, taskDone);
		}, itemDone);
	}, done);
}

series.schema = {
	title: 'series',
	description: 'Run the functions in the tasks array in series, each one running once the previous function has completed.',
	type: 'object',
	properties: {}
};

series.type = 'flow';

module.exports = series;
