'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');

function test() {
	return gulp.src(['test/**/*_test.js'], {
		read: false
	})
	.pipe(mocha({
		reporter: 'spec',
		timeout: Infinity
	}));
}

gulp.task(test);
