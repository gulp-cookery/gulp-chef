var imagemin = require('gulp-imagemin');
var flatten = require('gulp-flatten');
var gulp = require('gulp');
var gulpIf = require('gulp-if');
var _ = require('lodash');

var defaults = {
    options: {
        optimizationLevel: 3,
        progressive: true,
        interlaced: true
    }
};

/**
 * gulp-if
 * https://github.com/
 * 
 * sindresorhus/gulp-changed
 * https://github.com/sindresorhus/gulp-changed
 * 
 * gulp-newer
 * https://github.com/tschaub/gulp-newer
 * 
 * gulp-flatten
 * https://github.com/armed/gulp-flatten
 */
function imagesTask(config) {
    var options = _.extend({}, config.options, defaults.options);
    return gulp.src(config.src)
        .pipe(gulpIf(!config.debug, imagemin(options)))
        .pipe(gulpIf(config.flatten, flatten()))
        .pipe(gulp.dest(config.dest));
}

imagesTask.description = 'Optimize images.';

module.exports = imagesTask;
