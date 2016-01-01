'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var karma = require('gulp-karma');
var jshint = require('gulp-jshint');
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

var configure = require('gulp-ccr');

var recipes = configure({
	dest: 'dist',
	clean: {
		description: 'cleans the build output'
	},
	bower: {
		description: 'runs bower to install frontend dependencies',
		plugin: 'gulp-install',
		src: './bower.json'
	},
	'build-css': {
		description: 'runs sass, creates css source maps',
		task: [
			'clean',
			{
				src: './styles/*',
				$maps: './maps',
				task: function () {
					return gulp.src(this.config.src.globs)
						.pipe(sourcemaps.init())
						.pipe(sass())
						.pipe(cachebust.resources())
						.pipe(sourcemaps.write(this.config.$maps))
						.pipe(gulp.dest(this.config.dest.path));
				}
			}
		]
	},
	'build-template-cache': {
		description: 'fills in the Angular template cache, to prevent loading the html templates via separate http requests',
		task: [
			'clean',
			{
				src: './partials/*.html',
				$file: 'templateCachePartials.js',
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
			}
		]
	},
	jshint: {
		description: 'runs jshint',
		src: './js/*.js',
		task: function () {
			return gulp.src(this.config.src.globs)
				.pipe(jshint())
				.pipe(jshint.reporter('default'));
		}
	},
	test: {
		description: 'runs karma tests',
		task: [
			'build-js',
			{
				src: './test/unit/*.js',
				task: function () {
					return gulp.src(this.config.src.globs)
						.pipe(karma({
							configFile: 'karma.conf.js',
							action: 'run'
						}))
						.on('error', function (err) {
							console.log('karma tests failed: ' + err);
							throw err;
						});
				}
			}
		]
	},
	'build-js': {
		description: 'Build a minified Javascript bundle - the order of the js files is determined by browserify',
		task: [
			'clean',
			{
				task: function () {
					var b = browserify({
						entries: './js/app.js',
						debug: true,
						paths: ['./js/controllers', './js/services', './js/directives'],
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
						.pipe(gulp.dest('./dist/js/'));
				}
			}
		]
	},
	build: {
		description: 'full build (except sprites), applies cache busting to the main page css and js bundles',
		task: [
			'clean', 'bower', 'build-css', 'build-template-cache', 'jshint', 'build-js',
			{
				src: 'index.html',
				task: function () {
					return gulp.src(this.config.src.globs)
						.pipe(cachebust.references())
						.pipe(gulp.dest(this.config.dest.path));
				}
			}
		]
	},
	watch: {
		description: 'watches file system and triggers a build when a modification is detected',
		task: function () {
			return gulp.watch(['./index.html', './partials/*.html', './styles/*.*css', './js/**/*.js'], ['build']);
		}
	},
	webserver: {
		description: 'launches a web server that serves files in the current directory',
		src: '.',
		$url: 'http://localhost:8000/dist/index.html',
		task: function () {
			var webserver = require('gulp-webserver');

			return gulp.src(this.config.src.globs)
				.pipe(webserver({
					livereload: false,
					directoryListing: true,
					open: this.config.$url
				}));
		}
	},
	dev: {
		description: 'launch a build upon modification and publish it to a running server',
		task: ['watch', 'webserver']
	},
	sprite: {
		description: 'Generates a sprite png and the corresponding sass sprite map. This is not included in the recurring development build and needs to be run separately',
		src: './images/*.png',
		task: function () {
			var spriteData = gulp.src(this.config.src.globs)
				.pipe(spritesmith({
					imgName: 'todo-sprite.png',
					cssName: '_todo-sprite.scss',
					algorithm: 'top-down',
					padding: 5
				}));

			spriteData.css.pipe(gulp.dest(this.config.dest.path));
			spriteData.img.pipe(gulp.dest(this.config.dest.path));
		}
	},
	default: {
		description: 'installs and builds everything, including sprites',
		task: ['sprite', 'build', 'test']
	}

});

gulp.registry(recipes);