/*global describe, it, before, after, beforeEach, afterEach, process */
/*jshint expr: true*/
'use strict';

var Sinon = require('sinon'),
	Chai = require('chai'),
	Promised = require("chai-as-promised"),
	expect = Chai.expect;

Chai.use(Promised);

var Stream = require('stream'),
	Readable = require('stream').Readable,
	Transform = require('stream').Transform,
	through = require('through2'),
	fs = require('fs'),
	_ = require('lodash');

var gulp = require('gulp');

var base = process.cwd(),
	fixtures = base + '/test/_fixtures';

var eachdir = require(base + '/src/streams/eachdir'),
	ConfigurationError = require(base + '/src/core/configuration_error'),
	ConfigurableTaskError = require(base + '/src/core/configurable_task_error');

var dirs = {
	'app': {
		'modules': {
			'directives': {
				'ngfor': {
					'ngfor.js': ''
				},
				'ngif': {
					'ngif.js': ''
				},
				'index.js': ''
			},
			'services': {
				'http': {
					'http.js': ''
				},
				'sqlite': {
					'sqlite.js': ''
				},
				'index.js': ''
			}
		},
		'views': {
			'about': {
				'about.css': '',
				'about.html': '',
				'about.js': ''
			},
			'auth': {
				'auth.css': '',
				'auth.html': '',
				'auth.js': ''
			},
			'main': {
				'main.css': '',
				'main.html': '',
				'main.js': ''
			},
			'index.html': '',
			'index.js': ''
		},
		'index.html': '<html></html>'
	},
	'README.md': 'bla bla...',
	'package.json': '{}'
};

var testCases = {
	'modules': {
		path: 'app/modules',
		result: Object.keys(dirs.app.modules)
	},
	'views': {
		path: 'app/views',
		result: Object.keys(dirs.app.views)
	},
	'file': {
		path: 'app/index.html',
		result: []
	},
	'non-existent': {
		path: 'non-existent',
		result: []
	}
};

function prepareTask(fn) {
	var task = function(done) {};
	task.run = Sinon.spy(fn || function(gulp, config, stream, done) {});
	return task;
}

describe('Stream Processor', function() {
	describe('eachdir()', function() {
		var tasks;

		before(function() {
			process.chdir(fixtures);
		});

		after(function() {
			process.chdir(base);
		});

		beforeEach(function() {
			tasks = [prepareTask(), prepareTask()];
		});

		afterEach(function() {});

		it('should gulp.src() always return a stream in 3.X (prerequisite)', function() {
			if (isGulp3()) {
				var stream = gulp.src('non-existent');
				expect(stream).to.be.an.instanceof(Stream);
				expect(stream).to.have.property('on');
			}

			function isGulp3() {
				return !!gulp.run;
			}
		});

		it('should gulp.src() throws if src not exist in 4.X (prerequisite)', function() {
			if (isGulp4()) {
				expect(function () { gulp.src('non-existent'); }).to.throw;
			}

			function isGulp4() {
				return !!gulp.registry;
			}
		});

		it('should throw if config.src is not a valid string', function() {
			var configs = {
				empty: {},
				emptyString: {
					src: ''
				},
				number: {
					src: 1024
				},
				array: {
					src: ['app/views']
				},
				arrayEmptyString: {
					src: ['']
				},
				emptyArray: {
					src: []
				},
			};
			_.forOwn(configs, function(config) {
				expect(function() {
					eachdir(gulp, config, null, tasks);
				}).to.throw(ConfigurationError);
			});
		});

		it('should throw if no sub folder found', function() {
			var configs = {
				notExist: {
					src: testCases['non-existent'].path
				},
				file: {
					src: testCases.file.path
				}
			};
			_.forOwn(configs, function(config) {
				expect(function() {
					eachdir(gulp, config, null, tasks);
				}).to.throw(ConfigurationError);
			});
		});

		it('should invoke the given task for each folder', function() {
			var testCase = testCases.modules,
				config = {
					src: testCase.path
				},
				visits = [],
				task = prepareTask(function(gulp, config, stream, done) {
					visits.push(config.dir);
					return through.obj();
				});
			eachdir(gulp, config, null, [task]);
			expect(visits).to.deep.equal(testCase.result);
		});

		it('should throw if the given task does not return a stream', function() {
			var testCase = testCases.modules,
				config = {
					src: testCase.path
				},
				task = prepareTask(function(gulp, config, stream, done) {
					return true;
				});
			expect(function() {
				eachdir(gulp, config, null, [task]);
			}).to.throw(ConfigurableTaskError);
		});

		it('should return a stream', function() {
			var config = {
					src: testCases.views.path
				},
				task = prepareTask(function(gulp, config, stream, done) {
					return through.obj();
				});
			expect(eachdir(gulp, config, null, [task])).to.be.an.instanceof(Stream);
		});
	});
});
