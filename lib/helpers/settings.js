'use strict';

var _ = require('lodash');

function Settings(settings) {
	this.set(settings);
}

Settings.prototype.defaults = function (defaults) {
	this.settings = _.defaultsDeep({}, this.settings, defaults);
	return this;
};

Settings.prototype.set = function (settings) {
	this.settings = _.defaultsDeep({}, settings, this.settings);
	return this;
};

Settings.prototype.get = function (name) {
	if (name) {
		return this.settings[name];
	}
	return this.settings;
};

module.exports = Settings;
