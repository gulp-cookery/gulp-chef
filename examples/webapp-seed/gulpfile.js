'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');
var browserSync = require('browser-sync');

var meal = chef({
  src: 'src/',
  dest: 'dist/',
  clean: {},
  make: {
    assets: {
      src: ['**/*.txt', '.htaccess'],
      recipe: 'copy'
    },
    images: {
      src: 'images/**/*.*',
      recipe: 'copy'
    },
    markups: {
      src: 'index.html',
      recipe: 'copy'
    },
    scripts: {
      src: 'scripts/**/*.js',
      '.concat': {
        file: 'script.js'
      }
    },
    styles: {
      src: ['styles/normalize.css', 'styles/styles.css'],
      '.concat': {
        file: 'style.css'
      }
    }
  },
  build: ['clean', 'make'],
  serve: {
    browserSync: function () {
      browserSync.init({
        server: this.config.dest.path
      });
    },
    watch: ['markups', 'scripts', 'styles', 'images', 'assets']
  },
  default: 'build'
});

gulp.registry(meal);
