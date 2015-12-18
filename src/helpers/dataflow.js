'use strict';

function from(source) {
	return {
		to: function (target) {
			return {
				// TODO: support multiple source mapping to one target?
				imply: function (mappings, overwrite) {
					Object.keys(mappings).forEach(function (sourceProperty) {
						var targetProperty;

						if (source.hasOwnProperty(sourceProperty)) {
							targetProperty = mappings[sourceProperty];
							if (overwrite || !target.hasOwnProperty(targetProperty)) {
								target[targetProperty] = source[sourceProperty];
							}
						}
					});
				},
				move: function (properties, overwrite) {
					properties.forEach(function (name) {
						if (source.hasOwnProperty(name)) {
							if (overwrite || !target.hasOwnProperty(name)) {
								target[name] = source[name];
							}
							delete source[name];
						}
					});
				}
			};
		}
	};
}

module.exports = from;
