'use strict';

var path = require('path');
var requireDir = require('require-dir');
var _ = require('lodash');

function safeRequireDir() {
	var dirs, modules;

	var parent = module.parent;
	var parentFile = parent.filename;
	var parentDir = path.dirname(parentFile);

	dirs = Array.prototype.slice.call(arguments, 0);
	modules = dirs.map(function (dir) {
		try {
			return requireDir(path.resolve(parentDir, dir || '.'));
		} catch (ex) {
			if (ex.code !== 'ENOENT') {
				throw ex;
			}
		}
		return {};
	});
	return _.defaults.apply(null, modules);
}

module.exports = safeRequireDir;
