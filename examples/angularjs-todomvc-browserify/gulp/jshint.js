'use strict';

module.exports = function () {
  var jshint = require('gulp-jshint');

  return this.gulp.src(this.config.src.globs)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
};
