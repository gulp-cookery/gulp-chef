"use strict";
var log = require('gulp-util').log;

module.exports = function help(gulp, config, stream, done) {
	var tasks;

	// NOTE:
	// in gulp 3.X, tasks can be accessed through gulp.tasks
	// in gulp 4.X, must through gulp.registry().tasks()
	tasks = gulp.tasks || gulp.registry().tasks();
	Object.keys(tasks).sort().forEach(function(name) {
		var task = tasks[name];
		log(name);
		// NOTE: in gulp 3.X task are stored in task.fn, and we store description in fn.
		log(' ', task.description || task.fn && task.fn.description || '(no description)');
		log('');
	});
	done();
};

help.displayName = 'help';
help.description = '';
help.schema = {};
