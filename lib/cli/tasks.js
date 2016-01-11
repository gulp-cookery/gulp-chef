'use strict';

var chalk = require('chalk');
var exit = require('./exit');

var MSG_NO_DESCRIPTION = '(no description)';

module.exports = function (registry, name) {
	var gulp = registry.gulp;

	if (typeof name === 'string') {
		console.log(detail());
		exit(0);
	}

	// TODO: should also print which recipe used.
	function detail() {
		var task;

		task = gulp.task(name);
		if (task) {
			return name + ':' + chalk.gray(_desc(task)) + _config();
		}
		return 'The task "' + name + '" not found.';

		function _config() {
			if (task.config) {
				return '\n' + JSON.stringify(task.config, null, '  ');
			}
			return '';
		}
	}

	function list() {
		// NOTE:
		// in gulp 3.X, tasks can be accessed through gulp.tasks
		// in gulp 4.X, must through gulp.registry().tasks()
		var tasks = gulp.tasks || gulp.registry().tasks();

		return Object.keys(tasks).sort().reduce(function (message, key) {
			var task;

			task = tasks[key];
			message.push(key);
			// NOTE: in gulp 3.X task are stored in task.fn, and we store description in fn.
			message.push(_desc(task));
		}, []).join('\n');
	}

	function _desc(task) {
		return '\t' + (task.description || (task.fn && task.fn.description) || MSG_NO_DESCRIPTION);
	}
};
