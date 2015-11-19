var FileSystem = require('fs'),
	Path = require('path'),
	glob = require('glob'),
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

function join(paths, globs, force) {
	if (Array.isArray(paths)) {
		globs = paths.map(_path);
		return Array.prototype.concat.apply([], globs);
	}
	return _path(paths);

	function _path(path) {
		try {
			if (force || FileSystem.statSync(path).isDirectory()) {
				if (Array.isArray(globs)) {
					return globs.map(function (glob) {
						return _join(path, glob);
					});
				}
				return _join(path, globs);
			}
		} catch (ex) {
			// the directory path not exist;
		}

		// path not exist or not a folder, assumes that globs override path.
		return globs;
	}

	function _join(path, glob) {
		var negative;

		if (glob[0] === '!') {
			negative = '!';
			glob = glob.substr(1);
		} else {
			negative = '';
		}
		return negative + Path.join(path, glob);
	}
}

exports.folders = folders;
exports.join = join;
exports.isGlob = glob.hasMagic;
