'use strict';

module.exports = function () {
  var sass = require('gulp-sass');
  var sourcemaps = require('gulp-sourcemaps');

  var gulp = this.gulp;
  var config = this.config;

  return gulp.src(this.config.src.globs)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(config.cachebust.resources())
    .pipe(sourcemaps.write(this.config.maps))
    .pipe(gulp.dest(this.config.dest.path));
};
