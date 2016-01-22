'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');
var CacheBuster = require('gulp-cachebust');

var _cachebust;

// use function to protect, share and lazy loading complex object.
var cachebust = function () {
  if (!_cachebust) {
    _cachebust = new CacheBuster();
  }
  return _cachebust;
};

var meal = chef({
  dest: 'dist/',
  clean: {
    description: 'Cleans the build output'
  },
  bower: {
    description: 'Runs bower to install frontend dependencies',
    plugin: 'gulp-install',
    src: 'bower.json'
  },
  sass: {
    description: 'Runs sass, creates css source maps',
    src: 'styles/*',
    config: {
      maps: 'maps/',
      cachebust: cachebust
    }
  },
  jshint: {
    description: 'Runs jshint',
    src: 'js/*.js'
  },
  script: {
    description: 'Build a minified Javascript bundle - the order of the js files is determined by browserify',
    dest: 'js/',
    config: {
      partials: {
        src: 'partials/*.html',
        file: 'templateCachePartials.js',
        moduleName: 'todoPartials',
        prefix: '/partials/'
      },
      entries: './js/app.js',
      paths: ['js/controllers/', 'js/services/', 'js/directives/'],
      transform: ['browserify-ngannotate'],
      cachebust: cachebust
    }
  },
  karma: {
    description: 'Runs karma tests'
  },
  test: {
    description: 'Build and runs karma tests',
    series: ['script', 'karma']
  },
  markup: {
    src: 'index.html',
    config: {
      cachebust: cachebust
    }
  },
  build: {
    description: 'Full build (except sprites), applies cache busting to the main page css and js bundles',
    series: ['clean', { parallel: ['sass', 'jshint', 'script'] }, 'markup']
  },
  watch: {
    description: 'Watches file system and triggers a build when a modification is detected',
    task: 'build'
  },
  webserver: {
    description: 'Launches a web server that serves files in the current directory',
    plugin: 'gulp-webserver',
    src: '.',
    options: {
      livereload: false,
      directoryListing: true,
      open: 'http://localhost:8000/dist/index.html'
    }
  },
  serve: {
    description: 'Launch a build upon modification and publish it to a running server',
    task: ['build', 'watch', 'webserver']
  },
  sprite: {
    description: 'Generates a sprite png and the corresponding sass sprite map. This is not included in the recurring development build and needs to be run separately',
    src: 'images/*.png',
    options: {
      imgName: 'todo-sprite.png',
      cssName: '_todo-sprite.scss',
      algorithm: 'top-down',
      padding: 5
    }
  },
  default: {
    description: 'Installs and builds everything, including sprites',
    task: ['sprite', 'build', 'karma']
  }

});

gulp.registry(meal);
