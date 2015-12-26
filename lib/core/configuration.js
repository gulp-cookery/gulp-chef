'use strict';

var _ = require('lodash');
var assert = require('assert');
var normalize = require('json-normalizer').sync;
var globsJoin = require('../helpers/globs').join;
var from = require('../helpers/dataflow');

var ConfigurationRegulator = require('./configuration_regulator');
var ConfigurationError = require('./configuration_error');

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
var SCHEMA_DEFAULTS = {
	properties: {
		src: SCHEMA_SRC,
		dest: SCHEMA_DEST,
		options: {
			type: 'object'
		}
	}
};
var SCHEMA_TASK = require('../schema/task.json');
var TASK_SCHEMA_MAPPINGS = {
	title: 'name',
	description: 'description'
};
var TASK_METADATAS = Object.keys(SCHEMA_TASK.properties);

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

var _defaultOptions = {
	exposeStockComposeTasks: false
};

var _options = _defaultOptions;

function getOptions() {
	return _options;
}

function setOptions(options) {
	_options = _.defaults(options || {}, _defaultOptions);
	module.exports._regulator = new ConfigurationRegulator(_options.modes);
}

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
			throw new ConfigurationError(__filename, 'invalid task name: ' + name);
		}

		taskInfo.name = match[2] || name;

		if (match[1]) {
			taskInfo.visibility = match[1];
		}
		if (match[3]) {
			taskInfo.runtime = match[3];
		}
	}

	return taskInfo;
}

function isVisible(task) {
	return task.visibility === CONSTANT.VISIBILITY.NORMAL || !('visibility' in task);
}

function isDisabled(task) {
	return task.visibility === CONSTANT.VISIBILITY.DISABLED;
}

function shouldExpose(stock, taskInfo) {
	var options;

	// for stock  compose tasks (i.e. stream, flow), default is HIDDEN.
	if ('visibility' in taskInfo) {
		return taskInfo.visibility === CONSTANT.VISIBILITY.NORMAL;
	}

	if (stock.lookup(taskInfo.name)) {
		options = getOptions();
		if (options.exposeStockComposeTasks) {
			// side-effect: update visibility here, need not check again.
			taskInfo.visibility = CONSTANT.VISIBILITY.NORMAL;
			return true;
		}
		// side-effect here too.
		taskInfo.visibility = CONSTANT.VISIBILITY.HIDDEN;
	}

	return false;
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
	var inheritedConfig, regulator, regulatedConfig, schema, subTaskConfigs, taskConfig, value;

	assert(_.isPlainObject(rawConfig));

	regulator = module.exports._regulator;

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

	regulatedConfig = regulator.regulate(rawConfig);
	assert(_.isPlainObject(regulatedConfig));

	inheritedConfig = _.defaultsDeep(taskConfig, regulatedConfig, parentConfig);

	taskConfig = normalize(schema, inheritedConfig, { ignoreUnknownProperties: true });
	assert(_.isPlainObject(taskConfig));

	subTaskConfigs = _.omit(regulatedConfig, Object.keys(taskConfig));

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
	shouldExpose: shouldExpose,
	dest: dest,
	normalize: normalize,
	realize: realize,
	resolveSrc: resolveSrc,
	resolveDest: resolveDest,
	sort: sort,
	src: src
};
