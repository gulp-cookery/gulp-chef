"use strict";
var log = require('gulp-util').log;

module.exports = function (gulp) {

	/**
	 * help GulpTask
	 * @param done function
	 */
	return function helpGulpTask(done) {
		Object.keys(gulp.tasks).sort().forEach(function(name) {
			var task = gulp.tasks[name];
			log(name);
			log(' ', task.fn.description || '(no description)');
			log('');
		});
		done();
	};
};

