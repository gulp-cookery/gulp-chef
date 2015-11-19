'use strict';

var path = require('path'),
	requireDir = require('require-dir'),
	_ = require('lodash');

function safeRequireDir() {
	var parent = module.parent,
		parentFile = parent.filename,
		parentDir = path.dirname(parentFile),
		dirs,
		modules;

	dirs = Array.prototype.slice.call(arguments, 0);
	modules = dirs.map(function(dir) {
		dir = path.resolve(parentDir, dir || '.');
		try {
			return requireDir(dir);
		} catch (ex) {
			if (ex.code !== "ENOENT") {
				throw ex;
			}
		}
		return {};
	});
	return _.defaults.apply(null, modules);
}

module.exports = safeRequireDir;
