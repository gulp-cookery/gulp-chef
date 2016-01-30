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

function resolveSrc(parent, value, property) {
	var join;

	if (value) {
		if (value.options && 'join' in value.options) {
			if (value.options.join) {
				join = parent[value.options.join];
			}
			delete value.options.join;
			if (_.size(value.options) === 0) {
				delete value.options;
			}
		} else {
			join = property && parent[property];
		}
		if (join) {
			value.globs = globsJoin(join.globs || join.path || join, value.globs);
		}
		return value;
	}
	return parent.src;
}

function resolveDest(parent, value, property) {
	var join;

	if (value) {
		if (value.options && 'join' in value.options) {
			if (value.options.join) {
				join = parent[value.options.join];
			}
			delete value.options.join;
			if (_.size(value.options) === 0) {
				delete value.options;
			}
		} else {
			join = property && parent[property];
		}
		if (join) {
			value.path = Path.join(join.path || (join.globs && join.globs[0]) || join, value.path);
		}
		return value;
	}
	return parent.dest;
}

function renamePatternProperties(target) {
	Object.keys(target).forEach(function (key) {
		var match;

		match = PATTERN_PROPERTY_REGEX.exec(key);
		if (match && match[1].length) {
			target[match[1]] = target[key];
			delete target[key];
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

	taskConfig = rawConfig;
	// NOTE: If schema provided, try to normalize properties inside 'config' property.
	if (optionalSchema) {
		taskConfig = regulate(taskConfig, ['config']);
	}
	taskConfig = normalize(schema, taskConfig, {
		before: before,
		after: after
	});
	taskConfig = renamePatternProperties(taskConfig);
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
			_.defaults(propSchema, glob.SCHEMA);
		} else if (propSchema.type === 'path') {
			_.defaults(propSchema, path.SCHEMA);
		}
	}

	function after(propSchema, resolved) {
		var value, join;

		if (resolved) {
			value = resolved();

			if (propSchema.type === 'glob') {
				join = propSchema.properties.options.properties.join.default || 'src';
				return resolve(resolveSrc(parentConfig, value, join));
			} else if (propSchema.type === 'path') {
				join = propSchema.properties.options.properties.join.default || 'dest';
				return resolve(resolveDest(parentConfig, value, join));
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
