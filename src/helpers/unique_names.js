'use strict';

function UniqueNames(prefix) {
	this.prefix = prefix || 'anonymous-';
	this.names = {};
	this.names[this.prefix] = 0;
}

UniqueNames.prototype.put = function(name) {
	var names = this.names;
	if (unique(name)) {
		names[name] = 0;
	}

	function unique(name) {
		return (typeof name === 'string' && name.length > 0 && ! (name in names));
	}
};

UniqueNames.prototype.get = function(name) {
	var names = this.names;
	return unique(name || this.prefix);

	function unique(name) {
		if (names[name]++ === 0) {
			return name;
		}
		return name + names[name];
	}
};

module.exports = UniqueNames;
