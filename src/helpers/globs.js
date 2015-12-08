var FileSystem = require('fs'),
	Path = require('path'),
	glob = require('glob'),
	globjoin = require('globjoin'),
	globby = require('globby'),
	_ = require('lodash');

// glob support in src:
function folders(globs, options) {
	var base;

	options = options || {};
	base = options.base || '';
	return globby.sync(globs, options)
		.filter(function (file) {
			return FileSystem.statSync(Path.join(base, file)).isDirectory();
		});
}

exports.folders = folders;
exports.join = globjoin;
exports.isGlob = glob.hasMagic;
