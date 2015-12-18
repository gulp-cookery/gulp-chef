/* eslint consistent-this: 0 */
'use strict';
var log = require('gulp-util').log;

/**
 * Recipe:
 * print available tasks
 *
 * Ingredients:
 * gulp
 *
 */
function help(done) {
	var tasks;

	var context = this;
	var gulp = context.gulp;

	// NOTE:
	// in gulp 3.X, tasks can be accessed through gulp.tasks
	// in gulp 4.X, must through gulp.registry().tasks()
	tasks = gulp.tasks || gulp.registry().tasks();
	Object.keys(tasks).sort().forEach(function (name) {
		var task;

		task = tasks[name];
		log(name);
		// NOTE: in gulp 3.X task are stored in task.fn, and we store description in fn.
		log(' ', task.description || task.fn && task.fn.description || '(no description)');
		log('');
	});
	done();
}

help.schema = {
	title: 'help',
	description: '',
	properties: {
	}
};

help.type = 'task';

module.exports = help;
