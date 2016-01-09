'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');

var meal = chef({
  src: 'src',
  dest: 'dist',
  clean: {},
  make: {
    markups: {
      src: 'index.html',
      task: function (done) {
        done();
      }
    },
    scripts: {
      src: 'scripts/**/*.js',
      task: function (done) {
        done();
      }
    },
    styles: {
      src: 'styles/**/*.css',
      task: function (done) {
        done();
      }
    },
    images: {
      src: 'images/**/*.*',
      recipe: 'copy'
    },
    assets: {
      src: '**/*.txt',
      recipe: 'copy'
    }
  },
  build: ['clean', 'make'],
  serve: {
    recipe: 'watch',
    task: ['markups', 'scripts', 'styles', 'images', 'assets']
  },
  default: 'build'
});

gulp.registry(meal);
