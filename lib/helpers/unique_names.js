'use strict';

function UniqueNames(prefix, separator) {
	this.prefix = prefix || 'anonymous';
	this.separator = separator || '-';
	this.names = {};
	this.names[this.prefix] = 0;
}

UniqueNames.prototype.put = function (name) {
	var names;

	names = this.names;
	if (unique(name)) {
		names[name] = 0;
	}

	function unique(value) {
		return typeof value === 'string' && value.length > 0 && !(value in names);
	}
};

UniqueNames.prototype.get = function (name) {
	var names, separator;

	names = this.names;
	separator = this.separator;
	return unique(name || this.prefix);

	function unique(value) {
		if (names[value]++ === 0) {
			return value;
		}
		return value + separator + names[value];
	}
};

module.exports = UniqueNames;
