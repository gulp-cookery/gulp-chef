/*global describe, it, before, after, beforeEach, afterEach, process */
/*jshint expr: true*/
'use strict';

var streamifier = require('streamifier');

var Sinon = require('sinon'),
	Chai = require('chai'),
	Promised = require("chai-as-promised"),
	expect = Chai.expect;

Chai.use(Promised);

var base = process.cwd()
var parallel = require(base + '/src/flows/parallel'),
	ConfigurationError = require(base + '/src/core/configuration_error');

var FakeGulp = require(base + '/test/fake/gulp');
var gulp = new FakeGulp();

var cases = {
	done: {
		fn: function (gulp, config, stream, done) {
			done(null, 1);
		},
		expected: 1
	},
	async: {
		fn: function (gulp, config, stream, done) {
			setTimeout(function () {
				done(null, 2);
			}, 10);
		},
		expected: 2
	},
	promise: {
		fn: function () {
			return Promise.resolve(3);
		},
		expected: 3
	},
	stream: {
		fn: function () {
			return streamifier.createReadStream('4');
		},
		expected: undefined,
		description: 'async-done does not return anything for stream'
	},
	errback: {
		fn: function (gulp, config, stream, done) {
			done(new Error('An Error Occurred'));
		},
		error: new Error('An Error Occurred')
	},
	exception: {
		fn: function () {
			throw new Error('An Error Occurred');
		},
		error: new Error('An Error Occurred')
	}
};

Object.keys(cases).forEach(function (name) {
	cases[name].fn = createFakeTask(cases[name].fn);
});

function createFakeTask(runner) {
	var task = function (done) {
		return runner(gulp, null, null, done);
	};
	task.run = runner;
	return task;
}

function prepare(keys) {
	var tasks, expects, errors;

	tasks = [];
	expects = [];
	errors = [];
	keys.forEach(function (key) {
		tasks.push(cases[key].fn);
		expects.push(cases[key].expected);
		errors.push(cases[key].error);
	});
	return {
		tasks: tasks,
		expects: expects,
		errors: errors
	};
}

describe('Flow Processor', function () {
	describe('parallel()', function () {
		it('should run all type of tasks', function (done) {
			var test = prepare(['done', 'async', 'promise', 'stream']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(actual).to.deep.equal(test.expects);
				done();
			});
		});
		it('should deal with errback', function (done) {
			var test = prepare(['errback']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should deal with exception', function (done) {
			var test = prepare(['exception']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task errback', function (done) {
			var test = prepare(['done', 'async', 'promise', 'stream', 'errback']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task throws', function (done) {
			var test = prepare(['done', 'async', 'promise', 'stream', 'exception']);
			parallel(gulp, null, null, test.tasks, function (err, actual) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
	});
});

