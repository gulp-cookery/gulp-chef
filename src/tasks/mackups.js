var defaults = {
    options: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true
    }
};

function mackupTask(config) {
    // lazy loading required modules.
    var htmlmin = require('gulp-htmlmin');
    var flatten = require('gulp-flatten');
    var gulpIf = require('gulp-if');
    var gulp = require('gulp');
    var _ = require('lodash');
    
    var options = _.extend({}, config.options, defaults.options);
    return gulp.src(config.src)
        .pipe(gulpIf(!config.dev, htmlmin(options)))
        .pipe(gulpIf(config.flatten, flatten()))
        .pipe(gulp.dest(config.dest));
}

mackupTask.description = '';

module.exports = mackupTask;
