'use strict';

var Chai = require('chai');
var expect = Chai.expect;

var base = process.cwd();
var parallel = require(base + '/lib/flows/parallel');
var cases = require('./flow_test_cases');

var FakeGulp = require(base + '/test/fake/gulp');
var gulp = new FakeGulp();

describe('Flow Processor', function () {
	describe('parallel()', function () {
		it('should run all type of tasks', function (done) {
			var test = cases.prepare(gulp, ['done', 'async', 'promise', 'stream']);
			var ctx = {
				gulp: gulp,
				config: {},
				tasks: test.tasks
			};

			parallel.call(ctx, function (err, actual) {
				expect(actual).to.deep.equal(test.expects);
				done();
			});
		});

		cases.commons(gulp, parallel);
	});
});
