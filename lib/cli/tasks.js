'use strict';

module.exports = function (registry, name) {
	var gulp = registry.gulp;

	if (typeof name === 'string') {
		console.log(detail());
		process.exit(0);
	}

	function detail() {
		var task;

		task = gulp.task(name);
		if (task) {

		}
		return 'The task "' + name + '" not found.';
	}

	function list() {
		// NOTE:
		// in gulp 3.X, tasks can be accessed through gulp.tasks
		// in gulp 4.X, must through gulp.registry().tasks()
		var tasks = gulp.tasks || gulp.registry().tasks();

		Object.keys(tasks).sort().forEach(function (key) {
			var task;

			task = tasks[key];
			log(key);
			// NOTE: in gulp 3.X task are stored in task.fn, and we store description in fn.
			log(' ', task.description || task.fn && task.fn.description || '(no description)');
			log('');
		});
	}
};
