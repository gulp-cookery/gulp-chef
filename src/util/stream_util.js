var inherits = require('util').inherits;
var Readable = require('stream').Readable;

function EmptyStream() {
	Readable.call(this);
}

inherits(EmptyStream, Readable);

EmptyStream.prototype._read = function() {
	this.emit('end');
};

function empty() {
	return new EmptyStream();
}

function chain(pipe) {
	var through = require('through2');
	var duplexer = require('duplexer');
	var writer = through.obj();
	var chained = pipe(writer);
	return duplexer({
		objectMode: true
	}, writer, chained);
}

exports.chain = chain;
exports.empty = empty;
