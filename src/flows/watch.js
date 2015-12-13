'use strict';

/**
 * 基本想法：
 *   watch 只要指定相依的 task 即可。
 *
 *   watchTask 首先會執行各個 task，確保需要監控的檔案已經正確產出。
 *
 *   然後自動由相依的 task 找出需要監控的對應檔案，
 *   並在檔案變動時，自動執行相關的 task。
 *
 * Recipe:
 * watch
 *
 * Ingredients:
 * gulp.watch()
 *
 */
function watchTask(done) {
	// lazy loading required modules.
	var _ = require('lodash');

	var context = this,
		gulp = context.gulp,
		options = context.config.options || {},
		tasks = context.tasks;

	// TODO: find all src recursively.
	tasks.forEach(function (name) {
		var globs, task = gulp.task(name);
		if (task) {
			//task.config
		}
		// first run all depends and then watch their sources.
		gulp.watch(globs, options, task);
	});
}

watchTask.schema = {
	"title": "watch",
	"description": "",
	"type": "object",
	"properties": {}
};

watchTask.type = 'flow';

module.export = watchTask;
