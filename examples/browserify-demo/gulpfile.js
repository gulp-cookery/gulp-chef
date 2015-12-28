'use strict';

var gulp = require('gulp');
var configure = require('gulp-ccr');

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
					entry: 'main.js'
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
	watch: ['make:scripts', 'make:markups', 'make:resources'],
	build: ['clean', 'make'],
	default: 'build'
});

gulp.registry(recipes);
