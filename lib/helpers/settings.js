'use strict';

var _ = require('lodash');

function Settings(settings, defaults) {
	this.set(settings, defaults);
}

Settings.prototype.get = function (name) {
	if (name) {
		return this.settings[name];
	}
	return this.settings;
};

Settings.prototype.set = function (settings, defaults) {
	this.settings = _.defaults({}, settings || {}, defaults || {});
};

module.exports = Settings;
