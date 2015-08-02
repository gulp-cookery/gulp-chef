function lintTask(config) {
    // lazy loading required modules.
    var gulp = require('gulp');
    var jshint = require('jshint');

    return gulp.src(config.src)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'));
}

lintTask.description = '';

module.exports = lintTask;
