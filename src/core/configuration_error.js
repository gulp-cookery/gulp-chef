// Custom Error Types
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
//
// What's a good way to extend Error in JavaScript?
// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
//
// How do I create a custom Error in JavaScript?
// http://stackoverflow.com/questions/783818/how-do-i-create-a-custom-error-in-javascript
//
// Issue 228909: custom Errors are reported as "Uncaught [object Object]"
// https://code.google.com/p/chromium/issues/detail?id=228909
var inherits = require('util').inherits;
var PluginError = require('gulp-util').PluginError;

function ConfigurationError(plugin, message, options) {
	PluginError.call(this, plugin, message, options);
}

inherits(ConfigurationError, PluginError);
ConfigurationError.prototype.name = 'ConfigurationError';

module.exports = ConfigurationError;
