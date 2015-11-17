'use strict';

// TODO: use ESLint
/*jshint node: true */
/*global process*/
/**
 * Recipe:
 * 	Serial Join (from gulp.js cheatsheet p.2)
 *
 * Ingredients:
 * 	streamqueue
 * 	gulp-concat
 *
 * References:
 * 	Generating a file per folder
 * 	https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-task-steps-per-folder.md
 *
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *
 */
function eachdir(gulp, config, stream, tasks) {
	// lazy loading required modules.
	var fs = require('fs'),
		path = require('path'),
		each = require('./each');

	var ConfigurationTaskError = require('../core/configurable_task_error.js'),
		verify = require('../core/configuration_verifier');

	var cwd, folders, inject, values, dir;

	if (stream) {
		throw new ConfigurationTaskError('eachdir', 'eachdir stream-processor do not accept up-stream');
	}
	verify(eachdir.schema, config);

	dir = config.dir;
	cwd = process.cwd();
	folders = getFolders(dir);
	if (folders.length === 0) {
		throw new ConfigurationTaskError('eachdir', 'no sub folders found in ' + dir);
	}

	values = folders.map(function(folder) {
		return {
			dir: folder,
			path: path.join(cwd, dir, folder)
		};
	});

	inject = {
		values: values
	};

	return each(gulp, inject, stream, tasks);

	function getFolders(dir) {
		try {
			return fs.readdirSync(dir).filter(function(file) {
				return fs.statSync(path.join(dir, file)).isDirectory();
			});
		} catch (ex) {
			return [];
		}
	}
}

eachdir.expose = ['dir', 'path'];

eachdir.requires = {
	"merge-stream": ""
};

eachdir.schema = {
	"title": "eachdir",
	"description": "Performs actions on each sub folder of the specified folder",
	"properties": {
		"dir": {
			"description": ""
		}
	},
	"required": ["dir"]
};


module.exports = eachdir;
