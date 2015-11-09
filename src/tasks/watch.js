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
 * Ingredients:
 *
 */
function watchTask(gulp, config, stream, done) {
	// lazy loading required modules.
	var _ = require('lodash');

	var depends, globs;

	if (config.depends) {
		depends = config.depends;
	} else if (typeof config.task === 'string') {
		depends = [config.task];
	} else if (Array.isArray(config.task)) {
		depends = config.task;
	}

	// TODO: find all src recursively.
	globs = depends.map(function(name) {
		var task = gulp.task(name);
		if (task) {
			//task.config
		}
	});

	// first run all depends and then watch their sources.
	gulp.watch(globs, depends);
}

watchTask.schema = {
	"title": "watch",
	"description": "",
	"properties": {
		"src": {
			"description": ""
		},
		"options": {
			"description": "",
			"properties": {
			}
		}
	},
	"required": ["src"]
};

module.export = watchTask;
