'use strict';

var jshint = require('gulp-jshint');

module.exports = function () {
  return this.gulp.src(this.config.src.globs)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
};
