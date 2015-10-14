var path = require('path');
var requireDir = require('require-dir');
var _ = require('lodash');

function safeRequireDir() {
	var parent = module.parent;
	var parentFile = parent.filename;
	var parentDir = path.dirname(parentFile);
	var dirs, modules;

	dirs = Array.prototype.slice.call(arguments, 0);
	modules = dirs.map(function(dir) {
		dir = path.resolve(parentDir, dir || '.');
		try {
			return requireDir(dir);
		} catch (ex) {}
		return {};
	});
	return _.defaults.apply(null, modules);
}

module.exports = safeRequireDir;
