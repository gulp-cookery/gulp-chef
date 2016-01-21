'use strict';

var _ = require('lodash');
var assert = require('assert');
var PluginError = require('gulp-util').PluginError;
var normalize = require('json-normalizer').sync;
var regulate = require('json-regulator');
var globsJoin = require('../helpers/globs').join;
var from = require('../helpers/dataflow');

var INTERPOLATE = /{{([\s\S]+?)}}/g;

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
var SCHEMA_SRC = require('../schema/src.json');
var SCHEMA_DEST = require('../schema/dest.json');

// TODO: support custom json-schema type: 'path, 'glob'. When specified, automaticly normalize it with dest or src schema, and join parent's paths.
var SCHEMA_DEFAULTS = {
	type: 'object',
	properties: {
		src: SCHEMA_SRC,
		dest: SCHEMA_DEST,
		config: {
			description: 'Any property insides "config" property considered a configuration property.',
			type: 'object',
			additionalProperties: true
		},
		options: {
			type: 'object',
			additionalProperties: true
		}
	},
	patternProperties: {
		'^\\$.+$': {
			description: 'Any property prefix with $ considered a configuration property and can be accessed both with or without $ prefix.'
		}
	},
	additionalProperties: false
};

var PATTERN_PROPERTY_REGEX = /^\$(.+)$/;

var SCHEMA_TASK = require('../schema/task.json');
var TASK_SCHEMA_MAPPINGS = {
	title: 'name',
	description: 'description'
};
var TASK_METADATAS = Object.keys(SCHEMA_TASK.properties);

var REGEX_RUNTIME_OPTIONS = /^([.#]?)([_\w][-_:\s\w]*)$/;

var CONSTANT = {
	VISIBILITY: {
		/** hidden configurable task can't be run from cli, but still functional */
		HIDDEN: '.',
		/** disabled configurable task is not processed and not functional, including all it's descendants */
		DISABLED: '#',
		/** normal configurable task can be run from cli */
		NORMAL: ''
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
			} else if (!(key in target)) {
				target[key] = typeof value === 'function' ? value : _.cloneDeep(value);
			}
		});
	}
}

function getTaskRuntimeInfo(rawConfig) {
	var match, name, taskInfo;

	taskInfo = from(rawConfig).to({}).move(TASK_METADATAS);

	if (taskInfo.name) {
		name = _.trim(taskInfo.name);
		match = REGEX_RUNTIME_OPTIONS.exec(name);
		if (!match) {
			throw new PluginError(__filename, 'invalid task name: ' + name);
		}

		taskInfo.name = match[2] || name;

		if (match[1]) {
			taskInfo.visibility = match[1];
		}
	}

	return taskInfo;
}

function realize(original, additional) {
	var values;

	values = _.defaultsDeep({}, original, additional);
	return realizeAll({}, values);

	function realizeAll(target, source) {
		_.each(source, function (value, name) {
			target[name] = _realize(value);
		});
		return target;
	}

	function _realize(source) {
		if (typeof source === 'string') {
			return source.replace(INTERPOLATE, function (match, path) {
				var value;

				value = _.get(values, path) || path;
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
	return normalize(SCHEMA_SRC, values);
}

function dest(values) {
	return normalize(SCHEMA_DEST, values);
}

// TODO: make sure path separator works in all operating systems (especially windows that use "\\").
function resolveSrc(child, parent) {
	var value;

	if (child.src) {
		value = src(child.src);
		if (parent.src && !(value.options && value.options.override)) {
			value.globs = globsJoin(parent.src.globs, value.globs);
		}
		return value;
	}
	return parent.src;
}

function resolveDest(child, parent) {
	var value;

	if (child.dest) {
		value = dest(child.dest);
		if (parent.dest && !(value.options && value.options.override)) {
			value.path = globsJoin(parent.dest.path, value.path);
		}
		return value;
	}
	return parent.dest;
}

/**
 * If both parentConfig and taskConfig specified src property
 * then try to join paths.
 */
function sort(taskInfo, rawConfig, parentConfig, optionalSchema) {
	var schema, subTaskConfigs, taskConfig, value;

	assert(_.isPlainObject(rawConfig));

	schema = optionalSchema || {};
	from(schema).to(taskInfo).imply(TASK_SCHEMA_MAPPINGS);
	schema = _.defaultsDeep({}, schema, SCHEMA_DEFAULTS);

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

	taskConfig = _.defaultsDeep(taskConfig, rawConfig);

	taskConfig = normalize(schema, taskConfig);
	taskConfig = addPatternProperties(taskConfig);
	// NOTE: A thought about that `config` should be "normalized".
	// But remember that the `config` and `$` property prefix are designed for tasks that have no schemas.
	// It just won't do anything try to normalize it without schema.
	taskConfig = regulate(taskConfig, ['config']);
	assert(_.isPlainObject(taskConfig));

	// NOTE: When there is `plugin`,  `task`, `series` or `parallel` property,
	// then all other properties will be treated as properties, not sub-task configs.
	// So user don't have to use `config` keyword or `$` prefix.
	value = _.omit(rawConfig, Object.keys(taskConfig).concat('config'));
	if (!optionalSchema && (taskInfo.plugin || taskInfo.task || taskInfo.series || taskInfo.parallel)) {
		taskConfig = _.defaultsDeep(taskConfig, value);
	} else {
		subTaskConfigs = value;
	}

	// inherit parent's config
	taskConfig = _.defaultsDeep(taskConfig, parentConfig);

	return {
		taskInfo: taskInfo,
		taskConfig: taskConfig,
		subTaskConfigs: subTaskConfigs
	};
}

function addPatternProperties(target) {
	Object.keys(target).forEach(function (key) {
		var match;

		match = PATTERN_PROPERTY_REGEX.exec(key);
		if (match) {
			target[match[1]] = target[key];
		}
	});
	return target;
}

module.exports = {
	CONSTANT: CONSTANT,
	getTaskRuntimeInfo: getTaskRuntimeInfo,
	dest: dest,
	normalize: normalize,
	realize: realize,
	resolveSrc: resolveSrc,
	resolveDest: resolveDest,
	sort: sort,
	src: src
};
