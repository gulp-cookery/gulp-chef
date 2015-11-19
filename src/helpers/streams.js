'use strict';

var inherits = require('util').inherits,
	Readable = require('stream').Readable;

function EmptyStream() {
	Readable.call(this);
}

inherits(EmptyStream, Readable);

EmptyStream.prototype._read = function () {
	this.emit('end');
};

function empty() {
	return new EmptyStream();
}

function chain(pipe) {
	var through = require('through2'),
		duplexer = require('duplexer'),
		writer = through.obj(),
		chained = pipe(writer);
	return duplexer({
		objectMode: true
	}, writer, chained);
}

exports.chain = chain;
exports.empty = empty;
