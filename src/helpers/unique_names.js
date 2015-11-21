'use strict';

function UniqueNames(prefix) {
	this.prefix = prefix || 'anonymous';
	this.names = {};
	this.names[this.prefix] = 0;
}

UniqueNames.prototype.valid = function(name) {
	return (typeof name === 'string' && name.length > 0 && ! (name in this.names));
}

UniqueNames.prototype.put = function(name) {
	if (this.valid(name)) {
		this.names[name] = 0;
	}
};

UniqueNames.prototype.get = function(name) {
	while (!this.valid(name)) {
		name = this.prefix + (++this.names[this.prefix]);
	}
	return name;
};

module.exports = UniqueNames;
