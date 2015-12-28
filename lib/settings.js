'use strict';

var _ = require('lodash');

var _defaults = {
	exposeExplicitCompositeTask: false,
	exposeWithoutPrefix: false
};

var _settings = _defaults;

function get() {
	return _settings;
}

function set(options) {
	_settings = _.defaults({}, options || {}, _settings);
}

module.exports = {
	get: get,
	set: set
};
