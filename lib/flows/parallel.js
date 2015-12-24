/* eslint consistent-this: 0 */
'use strict';

/**
 * Recipe:
 * parallel
 *
 * Ingredients:
 * async, asnyc-done
 *
 * Note:
 *  Some kind of non-stream version of merge() stream recipe.
 *
 * @param done
 */
function parallel(done) {
	var async = require('async');
	var asyncDone = require('async-done');

	var context = this;
	var tasks = context.tasks;

	async.map(tasks, function (task, itemDone) {
		asyncDone(function (taskDone) {
			return task.run.call(context, taskDone);
		}, itemDone);
	}, done);
}

parallel.schema = {
	title: 'parallel',
	description: 'Run the tasks array of functions in parallel, without waiting until the previous function has completed.',
	type: 'object',
	properties: {}
};

parallel.type = 'flow';

module.exports = parallel;
