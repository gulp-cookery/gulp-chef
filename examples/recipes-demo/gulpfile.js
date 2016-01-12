'use strict';

var gulp = require('gulp');
var chef = require('../../');

var configs = {
	src: 'test/_fiexures/',
	dest: 'dist/',
	'async-streams': {
		src: 'css/',
		dest: 'css/',
		merge: {
			less: {
				src: 'first.less',
				plugin: 'gulp-less'
			},
			autoprefixer: {
				src: 'second.css',
				plugin: 'gulp-autoprefixer'
			}
		}
	},
	'serial-join': {
		src: 'css/',
		dest: 'css/',
		pipe: {
			queue: {
				less: {
					src: 'first.less',
					plugin: 'gulp-less'
				},
				pipe: {
					src: 'second.css',
					cssimport: {
						plugin: 'cssimport'
					},
					autoprefixer: {
						plugin: 'gulp-autoprefixer',
						options: 'last 2 versions'
					}
				}
			},
			concat: {
				file: 'app.css',
				minify: true,
				spit: true
			}
		}
	},
	'stream-array': {
		src: 'template/',
		dest: 'html/',
		each: {
			values: [{
				name: 'apple',
				title: 'Apple Cake',
				price: '25'
			}, {
				name: 'orange',
				title: 'Orange Cookie',
				price: '18'
			}],
			pipe: {
				consolidate: {
					src: 'a.js',
					plugin: 'consolidate',
					options: {
						title: '{{title}}',
						price: '{{price}}'
					}
				},
				rename: {
					plugin: 'rename',
					options: {
						basename: '{{name}}',
						extname: '.html'
					}
				},
				spit: {
				}
			}
		}
	},
	default: 'async-streams'
};

var meal = chef(configs);

gulp.registry(meal);
