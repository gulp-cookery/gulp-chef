'use strict';

var streamifier = require('streamifier');

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

module.exports = prepare;
