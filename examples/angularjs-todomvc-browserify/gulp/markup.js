'use strict';

module.exports = function () {
  var gulp = this.gulp;
  var config = this.config;

  return gulp.src(config.src.globs)
    .pipe(config.cachebust.references())
    .pipe(gulp.dest(config.dest.path));
};
