var inherits = require('util').inherits;
var PluginError = require('gulp-util').PluginError;

function IllegalTaskError(plugin, message, options) {
    PluginError.call(this, plugin, message, options);
}

inherits(IllegalTaskError, PluginError);
IllegalTaskError.prototype.name = 'IllegalTaskError';

module.exports = IllegalTaskError;