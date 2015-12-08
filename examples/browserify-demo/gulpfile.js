var gulp = require('gulp'),
	config = require('configurable-gulp-recipes');

var recipes = config({
	src: 'app',
	dest: 'dist',
	clean: {
		src: {
			glob: 'dist',
			override: true
		}
	},
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
	},
	watch: ['scripts', 'markups', 'resources'],
	build: ['clean', ['scripts', 'markups', 'resources']],
	default: 'build'
});

gulp.registry(recipes);