'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var merge = require('merge-stream');
var sourcemaps = require('gulp-sourcemaps');
var spritesmith = require('gulp.spritesmith');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var ngAnnotate = require('browserify-ngannotate');

var CacheBuster = require('gulp-cachebust');
var cachebust = new CacheBuster();

var chef = require('gulp-chef');

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
  'build-css': {
    description: 'Runs sass, creates css source maps',
    src: 'styles/*',
    maps: 'maps/',
    task: function () {
      return gulp.src(this.config.src.globs)
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(cachebust.resources())
        .pipe(sourcemaps.write(this.config.maps))
        .pipe(gulp.dest(this.config.dest.path));
    }
  },
  'build-template-cache': {
    description: 'Fills in the Angular template cache, to prevent loading the html templates via separate http requests',
    src: 'partials/*.html',
    file: 'templateCachePartials.js',
    task: function () {
      var ngHtml2Js = require('gulp-ng-html2js');
      var concat = require('gulp-concat');

      return gulp.src(this.config.src.globs)
        .pipe(ngHtml2Js({
          moduleName: 'todoPartials',
          prefix: '/partials/'
        }))
        .pipe(concat(this.config.file))
        .pipe(gulp.dest(this.config.dest.path));
    }
  },
  jshint: {
    description: 'Runs jshint',
    src: 'js/*.js'
  },
  karma: {
    description: 'Runs karma tests',
    src: 'test/unit/*.js'
  },
  test: {
    description: 'Build and runs karma tests',
    series: ['build-js', 'karma']
  },
  'build-js': {
    description: 'Build a minified Javascript bundle - the order of the js files is determined by browserify',
	src: 'js/',
	dest: 'js/',
    task: function () {
	  var src = this.config.src.globs[0];
      var b = browserify({
        entries: './' + src + 'app.js',
        debug: true,
        paths: [src + 'controllers/', src + 'services/', src + 'directives/'],
        transform: [ngAnnotate]
      });

      return b.bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(cachebust.resources())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(this.config.dest.path));
    }
  },
  scripts: {
    description: 'Build scripts in correct order',
	series: ['build-template-cache', 'build-js']
  },
  markup: {
    src: 'index.html',
    task: function () {
	  return gulp.src(this.config.src.globs)
	  .pipe(cachebust.references())
	  .pipe(gulp.dest(this.config.dest.path));
    }
  },
  build: {
    description: 'Full build (except sprites), applies cache busting to the main page css and js bundles',
    series: ['clean', { parallel: ['build-css', 'jshint', 'scripts'] }, 'markup']
  },
  watch: {
    description: 'Watches file system and triggers a build when a modification is detected',
    task: function () {
      return gulp.watch(['index.html', 'partials/*.html', 'styles/*.*css', 'js/**/*.js'], ['build']);
    }
  },
  webserver: {
    description: 'Launches a web server that serves files in the current directory',
    src: '.',
    url: 'http://localhost:8000/dist/index.html',
    task: function () {
      var webserver = require('gulp-webserver');

      return gulp.src(this.config.src.globs)
        .pipe(webserver({
          livereload: false,
          directoryListing: true,
          open: this.config.url
        }));
    }
  },
  serve: {
    description: 'Launch a build upon modification and publish it to a running server',
    task: ['watch', 'webserver']
  },
  sprite: {
    description: 'Generates a sprite png and the corresponding sass sprite map. This is not included in the recurring development build and needs to be run separately',
    src: 'images/*.png',
    spritesmith: {
      imgName: 'todo-sprite.png',
      cssName: '_todo-sprite.scss',
      algorithm: 'top-down',
      padding: 5
    },
    task: function () {
      var spriteData = gulp.src(this.config.src.globs)
        .pipe(spritesmith(this.config.spritesmith));

      return merge(
        spriteData.css.pipe(gulp.dest(this.config.dest.path)),
        spriteData.img.pipe(gulp.dest(this.config.dest.path))
        );
    }
  },
  default: {
    description: 'Installs and builds everything, including sprites',
    task: ['sprite', 'build', 'test']
  }

});

gulp.registry(meal);
