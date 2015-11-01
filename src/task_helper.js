"use strict";
var log = require('gulp-util').log;

module.exports = function help(done) {
	var gulp = this;

	Object.keys(gulp.tasks).sort().forEach(function(name) {
		var task = gulp.tasks[name];
		log(name);
		log(' ', task.fn.description || '(no description)');
		log('');
	});
	done();
};

