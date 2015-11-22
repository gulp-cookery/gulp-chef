/*global describe, it, process */
/*jshint expr: true*/
'use strict';

var async = require('async');

var Chai = require('chai'),
	expect = Chai.expect;

var base = process.cwd()
var series = require(base + '/src/flows/series'),
	cases = require('./flow_test_cases');

var FakeGulp = require(base + '/test/fake/gulp');
var gulp = new FakeGulp();

describe('Flow Processor', function () {
	describe('series()', function () {
		it('should run all type of tasks in sequence', function (done) {
			var sequences = [
				['done', 'async', 'promise', 'stream'],
				['async', 'stream', 'async', 'promise', 'stream', 'done'],
				['promise', 'stream', 'async', 'done', 'stream', 'promise']
			];
			async.each(sequences, function(sequence, eachDone) {
				var test = cases(sequence);
				series(gulp, null, null, test.tasks, function (err, actual) {
					expect(actual).to.deep.equal(test.expects);
					expect(test.logs).to.deep.equal(sequence);
					eachDone();
				});
			}, done);
		});
		it('should deal with errback', function (done) {
			var test = cases(['errback']);
			series(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should deal with exception', function (done) {
			var test = cases(['exception']);
			series(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task errback', function (done) {
			var test = cases(['done', 'async', 'promise', 'stream', 'errback']);
			series(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task throw exception', function (done) {
			var test = cases(['done', 'async', 'promise', 'stream', 'exception']);
			series(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
	});
});

