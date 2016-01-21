'use strict';

module.exports = function (done) {
  var sourcemaps = require('gulp-sourcemaps');
  var browserify = require('browserify');
  var source = require('vinyl-source-stream');
  var buffer = require('vinyl-buffer');
  var uglify = require('gulp-uglify');
  var ngHtml2Js = require('gulp-ng-html2js');
  var concat = require('gulp-concat');
  var gutil = require('gulp-util');

  var gulp = this.gulp;
  var config = this.config;

  gulp.src(config.partials.src)
    .pipe(ngHtml2Js({
      moduleName: config.partials.moduleName,
      prefix: config.partials.prefix
    }))
    .pipe(concat(config.partials.file))
    .pipe(gulp.dest(config.dest.path))
    .on('end', bundle);

  function bundle() {
    browserify({
      entries: config.entries,
      debug: true,
      paths: config.paths,
      transform: config.transform
    })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .on('error', gutil.log)
    .pipe(config.cachebust.resources())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.dest.path))
    .on('end', done);
  }
};
