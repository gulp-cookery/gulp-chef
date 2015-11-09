'use strict';

function pipe(gulp, config, stream, tasks) {
	var ConfigurableTaskError = require('../core/configurable_task_error.js');

	var i, n;

	if (tasks.length === 0) {
		throw ConfigurableTaskError('pipe', 'no sub tasks');
	}

	for (i = 0, n = tasks.length; i < n; ++i) {
		stream = tasks[i].run(gulp, config, stream, done);
	}
	return stream;

	function done() {}
}

pipe.expose = [];
pipe.schema = {
	"title": "pipe",
	"description": "",
	"properties": {
	}
};


module.exports = pipe;
