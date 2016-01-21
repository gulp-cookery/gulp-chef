'use strict';

module.exports = function () {
  var merge = require('merge-stream');
  var spritesmith = require('gulp.spritesmith');

  var gulp = this.gulp;
  var config = this.config;

  var spriteData = gulp.src(config.src.globs)
    .pipe(spritesmith(config.options));

  return merge(
    spriteData.css.pipe(gulp.dest(config.dest.path)),
    spriteData.img.pipe(gulp.dest(config.dest.path))
  );
};
