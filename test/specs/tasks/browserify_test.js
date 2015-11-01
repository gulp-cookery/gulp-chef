'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var Promised = require("chai-as-promised");
var expect = Chai.expect;
Chai.use(Promised);

var _ = require('lodash');

var gulp = require('gulp');

var base = process.cwd();

var browserify = require(base + '/src/tasks/browserify');
var ConfigurationError = require(base + '/src/core/configuration_error');
var ConfigurableTaskError = require(base + '/src/core/configurable_task_error');

var testCases = {
	'Accepts multiple bundles': {
		config: {
			src: base + '/test/_fixtures/app/modules',
			dest: 'dist',
			bundles: [{
				entries: ['directives/index.js'],
				file: 'directives.js',
			}, {
				entries: ['services/index.js'],
				file: 'services.js',
			}]
		},
		expected: {

		}
	}
};

describe('task processor', function() {
	describe('browserify()', function() {
		//var tasks;
        //
		//_.forEach(testCases, function(testCase, title) {
		//	it(title, function() {
		//		browserify(gulp, testCase.config, null);
		//	});
		//});

		//var stream = gulp.src('not-exist');
		//expect(stream).to.be.an.instanceof(Stream);
		//expect(stream).to.have.property('on');
	});
});
