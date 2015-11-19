/*global describe, it, process */
/*jshint expr: true*/
'use strict';

var Chai = require('chai'),
	expect = Chai.expect;

var base = process.cwd()
var parallel = require(base + '/src/flows/parallel'),
	cases = require('./flow_test_cases');

var FakeGulp = require(base + '/test/fake/gulp');
var gulp = new FakeGulp();

describe('Flow Processor', function () {
	describe('parallel()', function () {
		it('should run all type of tasks', function (done) {
			var test = cases(['done', 'async', 'promise', 'stream']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(actual).to.deep.equal(test.expects);
				done();
			});
		});
		it('should deal with errback', function (done) {
			var test = cases(['errback']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should deal with exception', function (done) {
			var test = cases(['exception']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task errback', function (done) {
			var test = cases(['done', 'async', 'promise', 'stream', 'errback']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task throws', function (done) {
			var test = cases(['done', 'async', 'promise', 'stream', 'exception']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
	});
});

