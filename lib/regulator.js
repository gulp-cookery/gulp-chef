/* eslint no-process-env: 0 */
'use strict';

var regulate = require('json-regulator');
var cli = require('gulp-util').env;
var env = process.env.NODE_ENV;

var MODES = {
	production: ['production', 'prod'],
	development: ['development', 'dev'],
	staging: ['staging'],
	default: 'production'
};

var SOURCES = [
	function _cli(key) {
		if (key in cli) {
			return true;
		}
	},
	function _env(key) {
		return env === key;
	}
];

function ConfigurationRegulator(optionalModes, optionalProvider) {
	var keys, mode, modes, provider;

	this.modes = modes = optionalModes || MODES;
	provider = optionalProvider || this.mode.bind(this);

	keys = Object.keys(modes);
	mode = provider(modes);
	this.promotions = modes[mode];
	this.eliminations = keys.reduce(function (result, key) {
		if (key === mode || key === 'default') {
			return result;
		}
		return result.concat(modes[key]);
	}, []);
}

ConfigurationRegulator.prototype.regulate = function (configurations) {
	return regulate(configurations, this.promotions, this.eliminations);
};

ConfigurationRegulator.prototype.mode = function () {
	return ConfigurationRegulator.mode(SOURCES, this.modes) || this.modes.default || Object.keys(this.modes)[0];
};

ConfigurationRegulator.mode = function (sources, modes) {
	var names;

	names = Object.keys(modes);
	return any(sources, match);

	function match(source) {
		return any(names, function (name) {
			var keys;

			keys = modes[name];
			return any(keys, function (key) {
				if (source(key)) {
					return name;
				}
			});
		});
	}
};

function any(values, fn) {
	var value, i, n;

	for (i = 0, n = values.length; i < n; ++i) {
		value = fn(values[i]);
		if (value) {
			return value;
		}
	}
}

module.exports = ConfigurationRegulator;
