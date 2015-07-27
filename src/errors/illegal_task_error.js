function IllegalTaskError(message) {
    this.message = message;
    this.stack = new Error().stack;
}

IllegalTaskError.prototype = new Error();
IllegalTaskError.prototype.name = 'IllegalTaskError';

module.export = IllegalTaskError;