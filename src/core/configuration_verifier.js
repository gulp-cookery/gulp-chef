"use strict";

var ConfigurationError = require('./configuration_error');

function verify(schema, config) {
	schema.required.forEach(function(name) {
		var property;

		if (!config.hasOwnProperty(name)) {
			throw new ConfigurationError(schema.title, 'configuration property "' + name + '" is required');
		}

		property = schema.properties[name];
		if (property.type === 'array') {
			if (!Array.isArray(config[name])) {
				throw new ConfigurationError(schema.title, 'configuration property "' + name + '" be an array');
			}

			if (property.minItems && config[name].length < property.minItems) {
				throw new ConfigurationError(schema.title, 'configuration property "' + name + '" should at least contains ' + property.minItems + (property.minItems > 1 ? ' items' : ' item'));
			}

			if (property.maxItems && property.maxItems < config[name].length) {
				throw new ConfigurationError(schema.title, 'configuration property "' + name + '" should at most contains ' + property.minItems + (property.minItems > 1 ? ' items' : ' item'));
			}
		}
	});
}

module.exports = verify;
