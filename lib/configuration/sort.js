'use strict';

var Path = require('path');
var _ = require('lodash');
var normalize = require('json-normalizer').sync;
var regulate = require('json-regulator');
var globsJoin = require('../helpers/globs').join;
var from = require('../helpers/dataflow');

var glob = require('./glob');
var path = require('./path');
var defaults = require('./defaults');

var PATTERN_PROPERTY_REGEX = /^\$(.*)$/;

var SCHEMA_DEFAULTS = {
	type: 'object',
	properties: {
		src: glob.SCHEMA,
		dest: path.SCHEMA,
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
		'^\\$.*$': {
			description: 'Any property prefixed with $ considered a configuration property and can be accessed both with or without $ prefix.'
		}
	},
	additionalProperties: false
};

var SCHEMA_TASK = require('../schema/task.json');

var TASK_SCHEMA_MAPPINGS = {
	title: 'name',
	description: 'description'
};

// TODO: make sure path separator works in all operating systems (especially windows that use "\\").
function resolveSrc(parent, value) {
	if (value) {
		if (parent.src && !(value.options && value.options.override)) {
			value.globs = globsJoin(parent.src.globs || parent.src, value.globs);
		}
		return value;
	}
	return parent.src;
}

function resolveDest(parent, value) {
	if (value) {
		if (parent.dest && !(value.options && value.options.override)) {
			value.path = Path.join(parent.dest.path || parent.dest, value.path);
		}
		return value;
	}
	return parent.dest;
}

function addPatternProperties(target) {
	Object.keys(target).forEach(function (key) {
		var match;

		match = PATTERN_PROPERTY_REGEX.exec(key);
		if (match && match[1].length) {
			target[match[1]] = target[key];
		}
	});
	return target;
}

/**
 * If both parentConfig and taskConfig specified src property
 * then try to join paths.
 */
function sort(taskInfo, rawConfig, parentConfig, optionalSchema) {
	var schema, subTaskConfigs, taskConfig, value;

	schema = optionalSchema || {};
	from(schema).to(taskInfo).imply(TASK_SCHEMA_MAPPINGS);
	schema = defaults({}, schema, SCHEMA_DEFAULTS);

	taskConfig = normalize(schema, rawConfig, {
		before: before,
		after: after
	});
	taskConfig = addPatternProperties(taskConfig);
	// NOTE: A thought about that `config` should be "normalized".
	// But remember that the `config` and `$` property prefix are designed for tasks that have no schemas.
	// It just won't do anything try to normalize it without schema.
	taskConfig = regulate(taskConfig, ['config']);

	// NOTE: When there is `plugin`,  `task`, `series` or `parallel` property,
	// then all other properties will be treated as properties, not sub-task configs.
	// So user don't have to use `config` keyword or `$` prefix.
	value = _.omit(rawConfig, Object.keys(taskConfig).concat('config'));
	if (!optionalSchema && (taskInfo.plugin || taskInfo.task || taskInfo.series || taskInfo.parallel)) {
		taskConfig = defaults(taskConfig, value);
	} else {
		subTaskConfigs = value;
	}

	// inherit parent's config
	taskConfig = defaults(taskConfig, parentConfig);

	return {
		taskInfo: taskInfo,
		taskConfig: taskConfig,
		subTaskConfigs: subTaskConfigs
	};

	function before(propSchema, values) {
		if (propSchema.type === 'glob') {
			_.assign(propSchema, glob.SCHEMA);
		} else if (propSchema.type === 'path') {
			_.assign(propSchema, path.SCHEMA);
		}
	}

	function after(propSchema, resolved) {
		var value;

		if (resolved) {
			value = resolved();

			if (propSchema.type === 'glob') {
				return resolve(resolveSrc(parentConfig, value));
			} else if (propSchema.type === 'path') {
				return resolve(resolveDest(parentConfig, value));
			}
		}

		return resolved;

		function resolve(value) {
			return function () {
				return value;
			};
		}
	}
}

module.exports = sort;
