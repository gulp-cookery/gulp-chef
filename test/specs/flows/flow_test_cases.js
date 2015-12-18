/* eslint consistent-this: 0 */
'use strict';

var Chai = require('chai');
var expect = Chai.expect;

var streamifier = require('streamifier');

var recipes = {
	done: {
		fn: function (done) {
			done(null, 1);
		},
		expected: 1
	},
	async: {
		fn: function (done) {
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
		/* expected: undefined, */
		description: 'async-done does not return anything for stream'
	},
	errback: {
		fn: function (done) {
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

function prepare(gulp, keys) {
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

	function createFakeTask(name, recipe) {
		var run = function (done) {
			var context;

			context = this;
			bundle.logs.push(name);
			return recipe.call(context, done);
		};
		var task = function (done) {
			var context = {
				gulp: gulp,
				config: {}
			};

			return run.call(context, done);
		};

		task.run = run;
		return task;
	}
}

function commons(gulp, flow) {
	describe('common flow error handling', function () {
		it('should deal with errback', function (done) {
			var test = prepare(gulp, ['errback']);
			var ctx = {
				gulp: gulp,
				config: {},
				tasks: test.tasks
			};

			flow.call(ctx, function (err) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should deal with exception', function (done) {
			var test = prepare(gulp, ['exception']);
			var context = {
				gulp: gulp,
				config: {},
				tasks: test.tasks
			};

			flow.call(context, function (err) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task errback', function (done) {
			var test = prepare(gulp, ['done', 'async', 'promise', 'stream', 'errback']);
			var context = {
				gulp: gulp,
				config: {},
				tasks: test.tasks
			};

			flow.call(context, function (err) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
		it('should stop if any task throw exception', function (done) {
			var test = prepare(gulp, ['done', 'async', 'promise', 'stream', 'exception']);
			var context = {
				gulp: gulp,
				config: {},
				tasks: test.tasks
			};

			flow.call(context, function (err) {
				expect(err).to.be.an.instanceof(Error);
				done();
			});
		});
	});
}

exports.prepare = prepare;
exports.commons = commons;
