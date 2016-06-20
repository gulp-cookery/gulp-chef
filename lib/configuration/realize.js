'use strict';

var _ = require('lodash');
var defaults = require('./defaults');

var INTERPOLATE = /{{([\s\S]+?)}}/g;

function realize(original, additional) {
	var values;

	values = defaults({}, original, additional);
	return realizeAll({}, values);

	function realizeAll(target, source) {
		_.each(source, function (value, name) {
			target[name] = _realize(value);
		});
		return target;
	}

	function _realize(source) {
		if (typeof source === 'string') {
			return source.replace(INTERPOLATE, function (match, path) {
				var value;

				value = _.get(values, path) || path;
				if (typeof value === 'function') {
					value = value(values);
				}
				return value;
			});
		}
		if (typeof source === 'function') {
			return source(values);
		}
		if (_.isArray(source)) {
			return realizeAll([], source);
		}
		if (_.isPlainObject(source)) {
			return realizeAll({}, source);
		}
		return source;
	}
}

module.exports = realize;
