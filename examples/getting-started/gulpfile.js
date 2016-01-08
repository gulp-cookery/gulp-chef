'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');

var meal = chef({
  clean: function (done) {
    console.log('hello clean');
    done();
  },
  markups: function (done) {
    console.log('hello markup');
    done();
  },
  scripts: function (done) {
    console.log('hello scripts');
    done();
  },
  styles: function (done) {
    console.log('hello styles');
    done();
  },
  default: ['clean', { parallel: ['scripts', 'styles', 'markups'] }]
});

gulp.registry(meal);
