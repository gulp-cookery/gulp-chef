'use strict';

var gulp = require('gulp');
var configure = require('gulp-cookery');

var recipes = configure({
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

gulp.registry(recipes);
