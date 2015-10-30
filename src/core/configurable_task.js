'use strict';
var _ = require('lodash');

var ConfigurationError = require('../errors/configuration_error');

var REGEX_RUNTIME_OPTIONS = /^([.#]?)([_\w][-_\s\w]*)([!?]?)$/;

var CONSTANT = {
	VISIBILITY: {
		HIDDEN: '.',
		DISABLED: '#',
		NORMAL: ''
	},
	RUNTIME: {
		PRODUCTION: '!',
		DEVELOPMENT: '?',
		ALL: ''
	}
};

function getTaskRuntimeInfo(name) {
	var match;

	name = _.trim(name);
	match = REGEX_RUNTIME_OPTIONS.exec(name);
	if (!match) {
		throw new ConfigurationError(__filename, 'invalid task name: ' + name);
	}
	return {
		name: match[2] || name,
		visibility: match[1] || '',
		runtime: match[3] || ''
	};
}

module.exports = {
	CONSTANT: CONSTANT,
	getTaskRuntimeInfo: getTaskRuntimeInfo
};
