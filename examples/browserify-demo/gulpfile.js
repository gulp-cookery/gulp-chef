var gulp = require('gulp'),
	configure = require('configurable-gulp-recipes');

var recipes = configure({
	src: 'app',
	dest: 'dist',
	clean: {
	},
	make: {
		scripts: {
			browserify: {
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
	watch: ['scripts', 'markups', 'resources'],
	build: ['clean', 'make'],
	default: 'build'
});

gulp.registry(recipes);