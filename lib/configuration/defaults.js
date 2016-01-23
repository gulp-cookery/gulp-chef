'use strict';

var _ = require('lodash');

// hack for _.defaultsDeep() that:
// defaultsDeep() try to mix array items into object
// defaultsDeep() try to mix string characters into array
// https://github.com/lodash/lodash/issues/1560
_.defaultsDeep = defaultsDeep;

function defaultsDeep(object) {
	var sources = Array.prototype.slice.call(arguments, 1);

	sources.forEach(function (source) {
		_defaults(object, source);
	});
	return object;

	function _defaults(target, source) {
		_.forIn(source, function (value, key) {
			if (_.isPlainObject(target[key]) && _.isPlainObject(value)) {
				_defaults(target[key], value);
			} else if (!(key in target)) {
				target[key] = typeof value === 'function' ? value : _.cloneDeep(value);
			}
		});
	}
}

module.exports = defaultsDeep;
