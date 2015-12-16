'use strict';

var env = require('gulp-util').env,
	regulate = require('json-regulator');

var MODES = {
	development: ['development', 'dev'],
	production: ['production', 'prod'],
	staging: ['staging']
};

function ConfigurationRegulator(mode, modes) {
	modes = modes || MODES;
	this.promotions = modes[mode];
	this.eliminations = Object.keys(modes).reduce(function (result, key) {
		if (key === mode) return result;
		return result.concat(modes[key]);
	}, []);
}

ConfigurationRegulator.prototype.regulate = function (configurations) {
	return regulate(configurations, this.promotions, this.eliminations);
};

ConfigurationRegulator.mode = function () {
	if (env.development || env.dev || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
		return 'development';
	} else if (env.staging || process.env.NODE_ENV === 'staging') {
		return 'staging';
	}
	return 'production';
};

module.exports = ConfigurationRegulator;