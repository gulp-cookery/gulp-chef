var log = require('gulp-util').log;
var globsJoin = require('../util/glob_util').join;
var normalize = require('json-normalizer').sync;
var _ = require('lodash');

var INTERPOLATE = /{{([\s\S]+?)}}/g;
var TASK_PROPERTIES = [
	// task
	'depends', 'task',
	// runtime
	'name', 'hidden', 'runtime',
	// dest
	'flatten'
];
var SCHEMA_DEFAULTS = {
	"properties": {
		"src": {
			"properties": {
				"globs": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["glob"]
				},
				"options": {
					"description": "",
					"properties": {
						"base": {
							"description": ""
						},
						"buffer": {
							"description": ""
						},
						"read": {
							"description": ""
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
					"description": ""
				},
				"options": {
					"description": "",
					"properties": {
						"cwd": {
							"description": ""
						},
						"mode": {
							"description": ""
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

var src = normalize.bind(null, SCHEMA_DEFAULTS.properties.src);
var dest = normalize.bind(null, SCHEMA_DEFAULTS.properties.dest);

function sort(taskConfig, parentConfig, schema) {
	var taskSettings, inheritedConfig, subTasks, value;

	taskSettings = _.pick(taskConfig, TASK_PROPERTIES);
	taskConfig = _.omit(taskConfig, TASK_PROPERTIES);

	inheritedConfig = {};

	if (parentConfig.src && !Array.isArray(parentConfig.src.globs)) {
		throw TypeError('parentConfig.src not normalized');
	}
	if (taskConfig.src) {
		value = src(taskConfig.src);
		if (parentConfig.src) {
			value.globs = globsJoin(parentConfig.src.globs, value.globs);
		}
		inheritedConfig.src = value;
	}

	if (parentConfig.dest && typeof parentConfig.dest.path !== 'string') {
		throw TypeError('parentConfig.dest not normalized');
	}
	if (taskConfig.dest) {
		value = dest(taskConfig.dest);
		if (parentConfig.dest) {
			// force dest since it may not already exists (dest must be a folder).
			value.path = globsJoin(parentConfig.dest.path, value.path, true);
		}
		inheritedConfig.dest = value;
	}

	schema = _.defaultsDeep(schema, SCHEMA_DEFAULTS);

	inheritedConfig = _.defaultsDeep(inheritedConfig, taskConfig, parentConfig);
	inheritedConfig = normalize(schema, inheritedConfig) || {};
	subTasks = inheritedConfig.others || {};
	delete inheritedConfig.others;

	return {
		taskSettings: taskSettings,
		taskConfig: inheritedConfig,
		subTasks: subTasks
	};
}

/**
 * If both parentConfig and taskConfig specified src property
 * then try to join paths.
 */
function sort_deprecated(taskConfig, parentConfig, consumes) {
	var inheritedConfig, subTaskConfigs, value;

	inheritedConfig = {};

	if (taskConfig.src) {
		value = src(taskConfig.src);
		if (parentConfig.src) {
			value.globs = globsJoin(parentConfig.src.globs, value.globs);
		}
		inheritedConfig.src = value;
	}
	if (parentConfig.dest && taskConfig.dest) {
		// force dest since it may not already exists (asumes dest always be a folder).
		value = dest(taskConfig.dest);
		if (parentConfig.dest) {
			value.path = globsJoin(parentConfig.dest.path, value.path);
		}
		inheritedConfig.dest = value;
	}

	inheritedConfig = _.defaultsDeep(inheritedConfig, taskConfig, parentConfig);
	inheritedConfig = _.pick(inheritedConfig, consumes);
	subTaskConfigs = _.omit(taskConfig, consumes);

	return {
		taskConfig: inheritedConfig,
		subTaskConfigs: subTaskConfigs
	};
}

module.exports = {
	dest: dest,
	normalize: normalize,
	realize: realize,
	sort_deprecated: sort_deprecated,
	sort: sort,
	src: src
};
