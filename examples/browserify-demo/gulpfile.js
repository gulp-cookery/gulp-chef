'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');

var meal = chef({
  src: 'app',
  dest: 'dist',
  clean: {
  },
  make: {
    scripts: {
      browserify: {
        options: {
          development: {
            sourcemap: 'internal'
          },
          production: {
            sourcemap: 'external'
          }
        },
        bundle: {
          entry: 'main.js',
          file: 'bundle.js'
        }
      }
    },
    markups: {
      src: '**/*.html'
    },
    resources: {
      src: '**/*.{png,jpeg,gif,webp}'
    }
  },
  watch: ['scripts', 'markups', 'resources'],
  build: ['clean', 'make'],
  default: 'build'
});

gulp.registry(meal);
