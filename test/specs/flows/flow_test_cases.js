'use strict';

var Chai = require('chai'),
	expect = Chai.expect;

var streamifier = require('streamifier');

var recipes = {
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

function prepare(keys) {
	var tasks, expects, errors, bundle;

	tasks = [];
	expects = [];
	errors = [];
	keys.forEach(function (key) {
		tasks.push(createFakeTask(key, recipes[key].fn));
		expects.push(recipes[key].expected);
		errors.push(recipes[key].error);
	});
	bundle = {
		tasks: tasks,
		expects: expects,
		errors: errors,
		logs: []
	};
	return bundle;

	function createFakeTask(name, runner) {
		var run = function (gulp, config, stream, done) {
			bundle.logs.push(name);
			return runner(gulp, config, stream, done);
		};
		var task = function (done) {
			return run(this, null, null, done);
		};
		task.run = run;
		return task;
	}
}

function commons(gulp, flow) {
	describe('common flow error handling', function () {
		it('should deal with errback', function (done) {
			var test = prepare(['errback']);
			flow(gulp, null, null, test.tasks, function (err) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should deal with exception', function (done) {
			var test = prepare(['exception']);
			flow(gulp, null, null, test.tasks, function (err) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task errback', function (done) {
			var test = prepare(['done', 'async', 'promise', 'stream', 'errback']);
			flow(gulp, null, null, test.tasks, function (err) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task throw exception', function (done) {
			var test = prepare(['done', 'async', 'promise', 'stream', 'exception']);
			flow(gulp, null, null, test.tasks, function (err) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
	});
}

exports.prepare = prepare;
exports.commons = commons;
