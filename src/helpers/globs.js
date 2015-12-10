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
	return globby.sync(globs, options).filter(isDirectory);
}

function isDirectory(path) {
	try {
		return FileSystem.statSync(path).isDirectory();
	} catch (ex) {
		return false;
	}
}

exports.folders = folders;
exports.isDirectory = isDirectory;
exports.join = globjoin;
exports.isGlob = glob.hasMagic;
