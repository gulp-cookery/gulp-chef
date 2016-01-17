'use strict';

var eos = require('end-of-stream');
var exhaust = require('stream-exhaust');

function profile(fn, context, done, start, stop) {
	var result;

	try {
		start();
		result = fn.call(context, callbackDone);
		if (result) {
			// was implemented using `async-done`,
			// but it will emit stream events immediately,
			// and show profile message in incorrect order.
			if (typeof result.on === 'function') {
				eos(exhaust(result), { error: false }, asyncDone);
			} else if (typeof result.subscribe === 'function') {
				result.subscribe(function (next) {
				}, function (error) {
					asyncDone(error);
				}, function (result) {
					asyncDone(null, result);
				});
			} else if (typeof result.then === 'function') {
				result.then(function (result) {
					asyncDone(null, result);
				}, function (error) {
					asyncDone(error);
				});
			}
		}
		return result;
	} catch (ex) {
		stop(ex);
	}

	function callbackDone(err, ret) {
		asyncDone(err, ret);
		done(err, ret);
	}

	function asyncDone(err, ret) {
		if (err) {
			stop(err);
		} else {
			stop(null, ret);
		}
	}
}

module.exports = profile;
