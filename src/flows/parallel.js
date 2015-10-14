var bach = require('bach');
var gulp = require('gulp');

var _parallel = gulp.parallel ? gulp.parallel.bind(gulp) : bach.parallel.bind(bach);

function parallel(gulp, config, stream, tasks) {
	tasks = tasks.map(function(task) {
		if (typeof task === 'function') {
			return task;
		} else if (typeof task === 'string') {
			return gulp.task(task);
		}
	});
	return _parallel.apply(null, tasks);
}

module.exports = parallel;
