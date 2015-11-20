"use strict";

var _ = require('lodash'),
	log = require('gulp-util').log,
	normalize = require('json-normalizer').sync,
	globsJoin = require('../helpers/globs').join;

var ConfigurationError = require('./configuration_error');

var INTERPOLATE = /{{([\s\S]+?)}}/g,
	TASK_PROPERTIES = [
		// task
		'description', 'order', 'task',
		// runtime
		'name', 'visibility', 'runtime'
	],
	SCHEMA_SRC = {
		"properties": {
			"globs": {
				"description": "Glob or array of globs to read.",
				"type": "array",
				"items": {
					"type": "string"
				},
				"alias": ["glob"]
			},
			/*
			 * NOTE:
			 * According to [gulp API](https://github.com/gulpjs/gulp/blob/master/docs/API.md)
			 * and [gulp 4.0 API](https://github.com/gulpjs/gulp/blob/4.0/docs/API.md):
			 * gulp supports all options supported by node-glob and glob-stream except ignore and adds the following options.
			 *
			 * @see
			 * [node-glob](https://github.com/isaacs/node-glob)
			 * [glob-stream](https://github.com/gulpjs/glob-stream)
			 *
			 */
			"options": {
				"description": "Options to pass to node-glob through glob-stream.",
				"properties": {
					"allowEmpty": {
						"description": "If true, won't emit an error when a glob pointing at a single file fails to match.",
						"type": "boolean",
						"default": false
					},
					"base": {
						"description": "Used for relative pathing. Typically where a glob starts.",
						"type": "string"
					},
					"buffer": {
						"description": "Setting this to false will return file.contents as a stream and not buffer files. This is useful when working with large files.",
						"type": "boolean",
						"default": true
					},
					"cache": {
						"description": "Pass in a previously generated cache object to save some fs calls.",
						"type": "object"
					},
					"cwd": {
						"description": "cwd for the input folder, only has an effect if provided input folder is relative. Default is process.cwd().",
						"type": "string"
					},
					"cwdbase": {
						"description": "Setting this to true is the same as saying opt.base = opt.cwd.",
						"type": "boolean",
						"default": false
					},
					"debug": {
						"description": "Set to enable debug logging in minimatch and glob.",
						"type": "boolean",
						"default": false
					},
					"dot": {
						"description": "Setting this to true to include .dot files in normal matches and globstar matches.",
						"type": "boolean",
						"default": false
					},
					"follow": {
						"description": "Follow symlinked directories when expanding ** patterns. Note that this can result in a lot of duplicate references in the presence of cyclic links.",
						"type": "boolean",
						"default": false
					},
					"ignore": {
						"description": "Add a pattern or an array of glob patterns to exclude matches. Note: ignore patterns are always in dot:true mode, regardless of any other settings.",
						"type": ["string", "array"]
					},
					"mark": {
						"description": "Add a / character to directory matches. Note that this requires additional stat calls.",
						"type": "boolean",
						"default": false
					},
					"matchBase": {
						"description": "Perform a basename-only match if the pattern does not contain any slash characters. That is, *.js would be treated as equivalent to **/*.js, matching all js files in all directories.",
						"type": "boolean",
						"default": false
					},
					"nobrace": {
						"description": "Do not expand {a,b} and {1..3} brace sets.",
						"type": "boolean",
						"default": false
					},
					"nocase": {
						"description": "Perform a case-insensitive match. Note: on case-insensitive filesystems, non-magic patterns will match by default, since stat and readdir will not raise errors.",
						"type": "boolean",
						"default": false
					},
					"nodir": {
						"description": "Do not match directories, only files. (Note: to match only directories, simply put a / at the end of the pattern.)",
						"type": "boolean",
						"default": false
					},
					"noext": {
						"description": "Do not match +(a|b) \"extglob\" patterns.",
						"type": "boolean",
						"default": false
					},
					"noglobstar": {
						"description": "Do not match ** against multiple filenames. (Ie, treat it as a normal * instead.)",
						"type": "boolean",
						"default": false
					},
					"nomount": {
						"description": "By default, a pattern starting with a forward-slash will be \"mounted\" onto the root setting, so that a valid filesystem path is returned. Set this flag to disable that behavior.",
						"type": "boolean",
						"default": false
					},
					"nonull": {
						"description": "Set to never return an empty set, instead returning a set containing the pattern itself. This is the default in glob(3).",
						"type": "boolean",
						"default": false
					},
					"nosort": {
						"description": "Don't sort the results.",
						"type": "boolean",
						"default": false
					},
					"nounique": {
						"description": "In some cases, brace-expanded patterns can result in the same file showing up multiple times in the result set. By default, this implementation prevents duplicates in the result set. Set this flag to disable that behavior.",
						"type": "boolean",
						"default": false
					},
					"passthrough": {
						"description": "If true, it will create a duplex stream which passes items through and emits globbed files. Since Gulp 4.0.",
						"type": "boolean",
						"default": false
					},
					"read": {
						"description": "Setting this to false will return file.contents as null and not read the file at all.",
						"type": "boolean",
						"default": true
					},
					"realpath": {
						"description": "Set to true to call fs.realpath on all of the results. In the case of a symlink that cannot be resolved, the full absolute path to the matched entry is returned (though it will usually be a broken symlink)",
						"type": "boolean",
						"default": false
					},
					"root": {
						"description": "The place where patterns starting with / will be mounted onto. Defaults to path.resolve(options.cwd, \"/\") (/ on Unix systems, and C:\\ or some such on Windows.)",
						"type": "string"
					},
					"silent": {
						"description": "When an unusual error is encountered when attempting to read a directory, a warning will be printed to stderr. Set the silent option to true to suppress these warnings.",
						"type": "boolean",
						"default": false
					},
					"since": {
						"description": "Setting this to a Date or a time stamp will discard any file that have not been modified since the time specified. Since Gulp 4.0.",
						"type": ["object", "integer"]
					},
					"stat": {
						"description": "Set to true to stat all results. This reduces performance somewhat, and is completely unnecessary, unless readdir is presumed to be an untrustworthy indicator of file existence.",
						"type": "boolean",
						"default": false
					},
					"statCache": {
						"description": "A cache of results of filesystem information, to prevent unnecessary stat calls. While it should not normally be necessary to set this, you may pass the statCache from one glob() call to the options object of another, if you know that the filesystem will not change between calls.",
						"type": "object"
					},
					"strict": {
						"description": "When an unusual error is encountered when attempting to read a directory, the process will just continue on in search of other matches. Set the strict option to raise an error in these cases.",
						"type": "boolean",
						"default": false
					},
					"symlinks": {
						"description": "A cache of known symbolic links. You may pass in a previously generated symlinks object to save lstat calls when resolving ** matches.",
						"type": "object"
					},
					"override": {
						"description": "Override parent's src settings, not join it. Since configurable-gulp-recipes 0.1.0.",
						"type": "boolean",
						"default": false
					}
				}
			},
			"required": ["globs"]
		},
		"primary": "globs",
		"gathering": "options"
	},
	SCHEMA_DEST = {
		"properties": {
			"path": {
				"description": "The path (output folder) to write files to.",
				"type": "string"
			},
			"options": {
				"description": "",
				"properties": {
					"cwd": {
						"description": "cwd for the output folder, only has an effect if provided output folder is relative.",
						"type": "string"
					},
					"mode": {
						"description": "Octal permission specifying the mode the files should be created with: e.g. \"0744\", 0744 or 484 (0744 in base 10). Default: the mode of the input file (file.stat.mode) or the process mode if the input file has no mode property.",
						"type": ["string", "integer"]
					},
					"dirMode": {
						"description": "Octal permission specifying the mode the directory should be created with: e.g. \"0755\", 0755 or 493 (0755 in base 10). Default is the process mode. Since Gulp 4.0.",
						"type": ["string", "integer"]
					},
					"overwrite": {
						"description": "Specify if existing files with the same path should be overwritten or not. Since Gulp 4.0.",
						"type": "boolean",
						"default": true
					},
					"flatten": {
						"description": "Remove or replace relative path for files. Since configurable-gulp-recipes 0.1.0.",
						"type": "boolean",
						"default": false
					},
					"override": {
						"description": "Override parent's dest settings, not join it. Since configurable-gulp-recipes 0.1.0.",
						"type": "boolean",
						"default": false
					}
				}
			},
			"required": ["path"]
		},
		"primary": 'path',
		"gathering": 'options'
	},
	SCHEMA_DEFAULTS = {
		"properties": {
			"src": SCHEMA_SRC,
			"dest": SCHEMA_DEST
		},
		"additionalProperties": true
	},
	SCHEMA_COMMONS = {
		"properties": {
			"src": SCHEMA_SRC,
			"dest": SCHEMA_DEST
		}
	};

var REGEX_RUNTIME_OPTIONS = /^([.#]?)([_\w][-_:\s\w]*)([!?]?)$/;

var CONSTANT = {
	VISIBILITY: {
		/** hidden configurable task can't be run from cli, but still functional */
		HIDDEN: '.',
		/** disabled configurable task is not processed and not functional, including all it's descendants */
		DISABLED: '#',
		/** normal configurable task can be run from cli */
		NORMAL: ''
	},
	RUNTIME: {
		/** configurable task can only run in production mode */
		PRODUCTION: '!',
		/** configurable task can only run in development mode */
		DEVELOPMENT: '?',
		/** configurable task can run in both production and development mode */
		ALL: ''
	}
};

// TODO: remove temp hack for _.defaultsDeep() when bug fix public available:
// defaultsDeep() try to mix string characters into array
// https://github.com/lodash/lodash/issues/1560
_.defaultsDeep = defaultsDeep;

function defaultsDeep(object) {
	var sources = Array.prototype.splice.call(arguments, 1);
	sources.forEach(function (source) {
		_defaults(object, source);
	});
	return object;

	function _defaults(target, source) {
		_.forIn(source, function (value, key) {
			if (_.isPlainObject(target[key]) && _.isPlainObject(value)) {
				_defaults(target[key], value);
			} else if (! (key in target)) {
				target[key] = typeof value === 'function' ? value : _.cloneDeep(value);
			}
		})
	}
}

var _defaultOptions = {
	exposeStockStreamTasks: false
};

var _options = _defaultOptions;

function getOptions() {
	return _options;
}

function setOptions(options) {
	_options = _.defaults(options || {}, _defaultOptions);
}

function getTaskRuntimeInfo(name) {
	var match, taskInfo;

	name = _.trim(name);
	match = REGEX_RUNTIME_OPTIONS.exec(name);
	if (!match) {
		throw new ConfigurationError(__filename, 'invalid task name: ' + name);
	}

	taskInfo = {
		name: match[2] || name
	};
	if (match[1]) {
		taskInfo.visibility = match[1];
	}
	if (match[3]) {
		taskInfo.runtime = match[3];
	}

	return taskInfo;
}

function isVisible(task) {
	return task.visibility === CONSTANT.VISIBILITY.NORMAL || (!task.visibility);
}

function isDisabled(task) {
	return task.visibility === CONSTANT.VISIBILITY.DISABLED;
}


function realize(original, additional, defaults) {
	var values = _.defaultsDeep({}, original, additional, defaults);
	return realizeAll({}, values);

	function realizeAll(target, source) {
		_.each(source, function (value, name) {
			target[name] = realize(value);
		});
		return target;
	}

	function realize(source) {
		if (typeof source === 'string') {
			return source.replace(INTERPOLATE, function (match, path) {
				var value = _.get(values, path) || path;
				if (typeof value === 'function') {
					value = value(values);
				}
				return value;
			});
		}
		if (typeof source === 'function') {
			return source(values);
		}
		if (_.isArray(source)) {
			return realizeAll([], source);
		}
		if (_.isPlainObject(source)) {
			return realizeAll({}, source);
		}
		return source;
	}
}

function src(values) {
	var result = normalize(SCHEMA_COMMONS.properties.src, values);
	return result.values;
}

function dest(values) {
	var result = normalize(SCHEMA_COMMONS.properties.dest, values);
	return result.values;
}

function resolveSrc(child, parent) {
	var value;

	if (child.src) {
		value = src(child.src);
		if (parent.src && !(value.options && value.options.override)) {
			value.globs = globsJoin(parent.src.globs, value.globs);
		}
		return value;
	} else {
		return parent.src;
	}
}

function resolveDest(child, parent) {
	var value;

	if (child.dest) {
		value = dest(child.dest);
		if (parent.dest && !(value.options && value.options.override)) {
			// force dest since it may not already exists (dest must be a folder).
			value.path = globsJoin(parent.dest.path, value.path, true);
		}
		return value;
	} else {
		return parent.dest;
	}
}

function propertyMapper(target, source, mappings) {
	Object.keys(mappings).forEach(function (sourceProperty) {
		var targetProperty;
		if (source.hasOwnProperty(sourceProperty)) {
			targetProperty = mappings[sourceProperty];
			if (!target.hasOwnProperty(targetProperty)) {
				target[targetProperty] = source[sourceProperty];
			}
		}
	});
	return target;
}

/**
 * If both parentConfig and taskConfig specified src property
 * then try to join paths.
 */
function sort(taskInfo, rawConfig, parentConfig, schema) {
	var inheritedConfig, taskConfig, subTaskConfigs, value;

	value = schema ? propertyMapper({}, schema, { title: 'name', description: 'description' }) : {};
	taskInfo = _.defaultsDeep(taskInfo, _.pick(rawConfig, TASK_PROPERTIES), value);
	rawConfig = _.omit(rawConfig, TASK_PROPERTIES);

	taskConfig = {};

	if (parentConfig.src && !Array.isArray(parentConfig.src.globs)) {
		throw new TypeError('parentConfig.src not normalized');
	}

	value = resolveSrc(rawConfig, parentConfig);
	if (value) {
		taskConfig.src = value;
	}

	if (parentConfig.dest && typeof parentConfig.dest.path !== 'string') {
		throw new TypeError('parentConfig.dest not normalized');
	}

	value = resolveDest(rawConfig, parentConfig);
	if (value) {
		taskConfig.dest = value;
	}

	if (schema && _.size(schema)) {
		schema = _.defaultsDeep(schema, SCHEMA_COMMONS);
	} else {
		schema = _.defaultsDeep({}, SCHEMA_DEFAULTS);
	}

	inheritedConfig = _.defaultsDeep(taskConfig, rawConfig, parentConfig);
	value = normalize(schema, inheritedConfig, { ignoreUnknownProperties: true });
	taskConfig = value.values || {};
	subTaskConfigs = _.omit(rawConfig, Object.keys(taskConfig));

	return {
		taskInfo: taskInfo,
		taskConfig: taskConfig,
		subTaskConfigs: subTaskConfigs
	};
}

module.exports = {
	CONSTANT: CONSTANT,
	getOptions: getOptions,
	setOptions: setOptions,
	getTaskRuntimeInfo: getTaskRuntimeInfo,
	isVisible: isVisible,
	isDisabled: isDisabled,
	dest: dest,
	normalize: normalize,
	realize: realize,
	resolveSrc: resolveSrc,
	resolveDest: resolveDest,
	sort: sort,
	src: src
};
