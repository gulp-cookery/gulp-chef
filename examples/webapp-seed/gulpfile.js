'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');
var browserSync = require('browser-sync');

var meal = chef({
  src: 'src/',
  dest: 'dist/',
  clean: {
    description: 'Clean up builds.',
  },
  make: {
    assets: {
      description: 'Copy asserts.',
      src: ['**/*.txt', '.htaccess'],
      recipe: 'copy'
    },
    images: {
      description: 'Copy images.',
      src: 'images/**/*.*',
      recipe: 'copy'
    },
    markups: {
      description: 'Copy markups.',
      src: 'index.html',
      recipe: 'copy'
    },
    scripts: {
      description: 'Concat scripts.',
      src: 'scripts/**/*.js',
      '.concat': {
        file: 'script.js'
      }
    },
    styles: {
      description: 'Concat styles.',
      src: ['styles/normalize.css', 'styles/styles.css'],
      '.concat': {
        file: 'style.css'
      }
    }
  },
  build: ['clean', 'make'],
  serve: {
    description: 'Launch browser and watch files.',
    '.browserSync': function () {
      browserSync.init({
        server: this.config.dest.path
      });
    },
    watch: ['markups', 'scripts', 'styles', 'images', 'assets']
  },
  default: 'build'
});

gulp.registry(meal);
