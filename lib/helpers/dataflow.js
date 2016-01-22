'use strict';

function from(source) {
	return {
		to: function (target) {
			return {
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
					return target;
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
					return target;
				}
			};
		}
	};
}

module.exports = from;
