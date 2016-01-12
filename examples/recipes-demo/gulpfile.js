'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');

var configs = {
	description: 'This is to demo what gulp-chef can achieve, not encourage you write configuration this way.',
	src: 'src/',
	dest: 'dist/',
	'gulp-cheagsheet': {
		description: 'Recipes from gulp cheatsheet: https://github.com/osscafe/gulp-cheatsheet.',
		'single-dest-and-watch': {
			src: 'js/',
			dest: 'js/',
			pipe: {
				'.coffee': {
					plugin: 'gulp-coffee',
					src: '*.coffee'
				},
				'.uglify': {
					plugin: 'gulp-uglify',
					spit: true
				}
			}
		},
		'multi-dest': {
			src: 'css/',
			dest: 'css/',
			pipe: {
				'.autoprefixer': {
					plugin: 'gulp-autoprefixer',
					src: 'style.css',
					options: 'last 2 versions',
					spit: true
				},
				'.minify': {
					plugin: 'gulp-minify-css'
				},
				'.rename': {
					plugin: 'gulp-rename',
					options: {
						extname: '.min.css'
					},
					spit: true
				}
			}
		},
		'incremental-rebuilding': {
			src: 'js/',
			dest: 'js/',
			pipe: {
				'.cached': {
					plugin: 'gulp-cached',
					src: '*.js'
				},
				'.uglify': {
					plugin: 'gulp-uglify'
				},
				'.remember': {
					plugin: 'gulp-remember'
				},
				'.concat': {
					plugin: 'gulp-concat',
					options: 'app.js',
					spit: true
				}
			}
		},
		'only-changed': {
			pipe: {
				'.changed': {
					plugin: 'gulp-changed',
					options: '{{dest.path}}'
				},
				'.uglify': {
					plugin: 'gulp-uglify',
					spit: true
				}
			}
		},
		'async-streams': {
			src: 'css/',
			dest: 'css/',
			merge: {
				'.less': {
					plugin: 'gulp-less',
					src: 'first.less'
				},
				'.autoprefixer': {
					plugin: 'gulp-autoprefixer',
					src: 'second.css'
				}
			}
		},
		'serial-join': {
			src: 'css/',
			dest: 'css/',
			pipe: {
				queue: {
					'.less': {
						plugin: 'gulp-less',
						src: 'first.less'
					},
					pipe: {
						src: 'second.css',
						'.cssimport': {
							plugin: 'css-cssimport'
						},
						'.autoprefixer': {
							plugin: 'gulp-autoprefixer',
							options: 'last 2 versions'
						}
					}
				},
				'.concat': {
					plugin: 'gulp-concat',
					options: 'app.css'
				},
				'.minify': {
					plugin: 'gulp-minify-css',
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
					'.consolidate': {
						plugin: 'consolidate',
						src: 'a.js',
						options: {
							title: '{{title}}',
							price: '{{price}}'
						}
					},
					'.rename': {
						plugin: 'gulp-rename',
						options: {
							basename: '{{name}}',
							extname: '.html'
						},
						spit: true
					}
				}
			}
		}
	},
	default: 'async-streams'
};

var meal = chef(configs);

gulp.registry(meal);
