var defaults = {
    options: {
        stylus: {
            'compress': true,
            'include css': true,
            'resolve url': true,
            'urlfunc': 'url'
        },
        autoprefixer: [
            'last 1 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'
        ]
    }
};

function stylusTask(config) {
    // lazy loading required modules.
    var autoprefixer = require('gulp-autoprefixer');
    var stylus = require('gulp-stylus');
    var flatten = require('gulp-flatten');
    var gulpIf = require('gulp-if');
    var gulp = require('gulp');
    var _ = require('lodash');

    var options = _.defaultsDeep({}, config.options, defaults.options);
    return gulp.src(config.src)
        .pipe(stylus(options.stylus))
        .pipe(autoprefixer.apply(null, options.autoprefixer))
        .pipe(gulpIf(config.flatten, flatten()))
        .pipe(gulp.dest(config.dest));
}

stylusTask.description = '';

module.exports = stylusTask;
