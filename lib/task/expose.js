'use strict';

var log = require('gulp-util').log;
var PluginError = require('gulp-util').PluginError;

var _defaults = {
	exposeExplicitCompositeTask: false,
	exposeWithPrefix: 'auto'
};

module.exports = function (registry, settings) {
	var strategies = {
		always: function (prefix, name) {
			return prefix + name;
		},
		auto: function (prefix, name) {
			var msg;

			msg = check(name);
			if (msg) {
				log('configure:', msg + ', using "' + prefix + name + '" instead.');
				return prefix + name;
			}
			return name;
		},
		never: function (prefix, name) {
			var msg;

			msg = check(name);
			if (msg) {
				throw new PluginError('configure:', msg);
			}
			return name;
		}
	};

	function check(name) {
		var task;

		task = registry.get(name);
		if (task) {
			return 'the name "' + name + '" already taken by "' + task.fullName + '"';
		}
	}

	return strategies[settings.defaults(_defaults).get().exposeWithPrefix] || strategies.auto;
};
