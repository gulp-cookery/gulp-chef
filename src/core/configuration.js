"use strict";

var log = require('gulp-util').log,
	globsJoin = require('../util/glob_util').join,
	normalize = require('json-normalizer').sync,
	_ = require('lodash');

var ConfigurationError = require('./configuration_error');

var INTERPOLATE = /{{([\s\S]+?)}}/g,
	TASK_PROPERTIES = [
		// task
		'depends', 'description', 'task',
		// runtime
		'name', 'visibility', 'runtime'
	],
	SCHEMA_DEFAULTS = {
	"properties": {
		"src": {
			"properties": {
				"globs": {
					"description": "Glob or array of globs to read.",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["glob"]
				},
				"options": {
					"description": "Options to pass to node-glob through glob-stream.",
					"properties": {
						"base": {
							"description": "Used for relative pathing. Typically where a glob starts."
						},
						"buffer": {
							"description": "Setting this to false will return file.contents as a stream and not buffer files. This is useful when working with large files."
						},
						"read": {
							"description": "Setting this to false will return file.contents as null and not read the file at all."
						},
						"since": {
							"description": ""
						},
						"override": {
							"description": "Override parent's src settings."
						}
					}
				},
				"required": ["globs"]
			},
			"primary": "globs",
			"gathering": "options"
		},
		"dest": {
			"properties": {
				"path": {
					"description": "The path (output folder) to write files to."
				},
				"options": {
					"description": "",
					"properties": {
						"cwd": {
							"description": "cwd for the output folder, only has an effect if provided output folder is relative."
						},
						"mode": {
							"description": "Octal permission string specifying mode for any folders that need to be created for output folder."
						},
						"dirMode": {
							"description": ""
						},
						"overwrite": {
							"description": ""
						},
						"flatten": {
							"description": "Remove or replace relative path for files."
						},
						"override": {
							"description": "Override parent's dest settings."
						}
					}
				},
				"required": ["path"]
			},
			"primary": 'path',
			"gathering": 'options'
		}
	},
	"gathering": "others"
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
	sources.forEach(function(source) {
		_defaults(object, source);
	});
	return object;

	function _defaults(target, source) {
		_.forIn(source, function(value, key) {
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
		_.each(source, function(value, name) {
			target[name] = realize(value);
		});
		return target;
	}

	function realize(source) {
		if (typeof source === 'string') {
			return source.replace(INTERPOLATE, function(match, path) {
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
	var result = normalize(SCHEMA_DEFAULTS.properties.src, values);
	return result.values;
}

function dest(values) {
	var result = normalize(SCHEMA_DEFAULTS.properties.dest, values);
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
	Object.keys(mappings).forEach(function(sourceProperty) {
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

	value = propertyMapper({}, schema, { title: 'name', description: 'description' });
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

	schema = _.defaultsDeep(schema, SCHEMA_DEFAULTS);

	inheritedConfig = _.defaultsDeep(taskConfig, rawConfig, parentConfig);
	value = normalize(schema, inheritedConfig, { ignoreUnknownProperties: true });
	taskConfig = value.values || {};
	// TODO: json-normalizer: allow ignore unknown properties.
	delete taskConfig.others;
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
