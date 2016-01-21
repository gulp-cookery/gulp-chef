'use strict';

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var ngAnnotate = require('browserify-ngannotate');

var CacheBuster = require('gulp-cachebust');
var _cachebust;

// use function to protect, share and lazy loading complex object.
function cachebust() {
  if (!_cachebust) {
    _cachebust = new CacheBuster();
  }
  return _cachebust;
}

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
  karma: {
    description: 'Runs karma tests'
  },
  test: {
    description: 'Build and runs karma tests',
    series: ['scripts', 'karma']
  },
  scripts: {
    description: 'Build scripts in correct order',
    dest: 'js/',
    pipe: {
      '.build-template-cache': {
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
      '.browserify': {
        description: 'Build a minified Javascript bundle - the order of the js files is determined by browserify',
        task: function () {
          return browserify({
            entries: './js/app.js',
            debug: true,
            paths: ['js/controllers/', 'js/services/', 'js/directives/'],
            transform: [ngAnnotate]
          })
          .bundle()
          .pipe(source('bundle.js'))
          .pipe(buffer())
          .on('error', gutil.log);
        }
      },
      '.bust': function () {
        return this.upstream
          .pipe(cachebust().resources())
          .pipe(sourcemaps.init({
            loadMaps: true
          }))
          .pipe(uglify())
          .pipe(sourcemaps.write('./'))
          .pipe(gulp.dest(this.config.dest.path));
      }
    }
  },
  markup: {
    src: 'index.html',
    task: function () {
      return gulp.src(this.config.src.globs)
        .pipe(cachebust().references())
        .pipe(gulp.dest(this.config.dest.path));
    }
  },
  build: {
    description: 'Full build (except sprites), applies cache busting to the main page css and js bundles',
    series: ['clean', {
      parallel: ['sass', 'jshint', 'scripts']
    }, 'markup']
  },
  watch: {
    description: 'Watches file system and triggers a build when a modification is detected',
    task: function () {
      return gulp.watch(['index.html', 'partials/*.html', 'styles/*.*css', 'js/**/*.js'], ['build']);
    }
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
    task: ['sprite', 'build', 'test']
  }

});

gulp.registry(meal);
