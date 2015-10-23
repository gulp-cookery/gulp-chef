'use strict';

var _ = require('lodash');
var ConfigurationError = require('./errors/configuration_error');

var regexRuntimeOptions = /^([.#]?)([_\w][-_\s\w]*)([!?]?)$/;

function getTaskRuntimeInfo(name) {
	var match;

	name = _.trim(name);
	match = regexRuntimeOptions.exec(name);
	if (!match) {
		throw new ConfigurationError(name, 'invalid task name: ' + name);
	}
	return {
		name: match[2] || name,
		hidden: match[1] || '',
		runtime: match[3] || ''
	};
}

module.exports = {
	getTaskRuntimeInfo: getTaskRuntimeInfo
};
