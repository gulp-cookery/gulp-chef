'use strict';

var FileSystem = require('fs');
var glob = require('glob');
var globjoin = require('globjoin');
var globby = require('globby');

// glob support in src:
function folders(globs, options) {
	return globby.sync(globs, options || {}).filter(isDirectory);
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
