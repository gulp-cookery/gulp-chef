var inherits = require('util').inherits;
var Readable = require('stream').Readable;

function EmptyStream() {
    Readable.call(this);
}

inherits(EmptyStream, Readable);

EmptyStream.prototype._read = function() {
    this.emit('end');
};

module.exports = EmptyStream;