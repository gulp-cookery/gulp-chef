'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');
var browserSync = require('browser-sync').create();

var meal = chef({
  src: 'src/',
  dest: 'dist/',
  clean: {},
  make: {
    markups: {
      src: 'index.html',
      recipe: 'copy'
    },
    scripts: {
      src: 'scripts/**/*.js',
      concat: {
        file: 'script.js'
      }
    },
    styles: {
      src: 'styles/**/',
      concat: {
        src: ['normalize.css', 'styles.css'],
        file: 'style.css'
      }
    },
    images: {
      src: 'images/**/*.*',
      recipe: 'copy'
    },
    assets: {
      src: ['**/*.txt', '.htaccess'],
      recipe: 'copy'
    }
  },
  build: ['clean', 'make'],
  serve: {
    browserSync: function () {
      browserSync.init({
        server: {
            baseDir: this.config.dest.path
        }
      });
    },
    watch: ['markups', 'scripts', 'styles', 'images', 'assets']
  },
  default: 'build'
});

gulp.registry(meal);
