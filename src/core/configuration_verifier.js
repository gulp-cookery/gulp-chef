"use strict";

var _ = require('lodash'),
	PluginError = require('gulp-util').PluginError;

function verify(schema, config) {
	var title;

	if (schema && config) {
		title = schema.title;
		_entry(title, schema, config)
	}

	function _entry(name, schema, value) {
		_object() || _array();

		function _array() {
			if (_strict('array') || _loose('array', Array.isArray)) {
				if (!Array.isArray(value)) {
					throw new PluginError(title, 'configuration property "' + name + '" should be an array');
				}

				if (schema.minItems && value.length < schema.minItems) {
					throw new PluginError(title, 'configuration property "' + name + '" should at least contains ' + schema.minItems + (schema.minItems > 1 ? ' items' : ' item'));
				}

				if (schema.maxItems && schema.maxItems < value.length) {
					throw new PluginError(title, 'configuration property "' + name + '" should at most contains ' + schema.minItems + (schema.minItems > 1 ? ' items' : ' item'));
				}

				if (schema.items) {
					value.forEach(function (item) {
						_entry('item', schema.items, item);
					});
				}

				return true;
			}
		}

		function _object() {
			if (_strict('object') || _loose('object', _.isPlainObject) || _implicit()) {
				if (!_.isPlainObject(value)) {
					throw new PluginError(title, 'configuration property "' + name + '" should be an object');
				}

				if (schema.required) {
					schema.required.forEach(function (property) {
						if (!value.hasOwnProperty(property)) {
							throw new PluginError(title, 'configuration property "' + property + '" is required');
						}
					});
				}

				if (schema.properties) {
					_.forEach(value, function (item, property) {
						_entry(property, schema.properties[property], item);
					});
				}

				return true;
			}
		}

		function _strict(type) {
			return schema.type === type;
		}

		function _loose(type, fn) {
			return _.includes(schema.type, type) && fn(value);
		}

		function _implicit() {
			return _.size(schema.properties) > 0;
		}
	}
}

module.exports = verify;
