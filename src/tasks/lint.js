var gulp = require('gulp');
var jshint = require('jshint');

function lintTask(config) {
    return gulp.src(config.src)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'));
}

lintTask.description = '';

module.exports = lintTask;
