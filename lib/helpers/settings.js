'use strict';

var _ = require('lodash');

function Settings(settings) {
	this.set(settings);
}

Settings.prototype.defaults = function (defaults) {
	this.settings = _.defaults({}, this.settings, defaults);
	return this;
};

Settings.prototype.set = function (settings) {
	this.settings = _.defaults({}, settings, this.settings);
	return this;
};

Settings.prototype.get = function (name) {
	if (name) {
		return this.settings[name];
	}
	return this.settings;
};

module.exports = Settings;
