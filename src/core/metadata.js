"use strict";

var WeakMap = require('es6-weak-map');

/**
 * WeakMap for storing metadata: add metadata tree to make gulp.tree() happy.
 */
var _metadata = new WeakMap();

// Reference:
// https://github.com/gulpjs/undertaker/blob/master/lib/parallel.js
// https://github.com/gulpjs/undertaker/blob/master/lib/helpers/buildTree.js
function set(target, label, nodes) {
	var name, meta;

	meta = _metadata.get(target);
	if (!meta) {
		name = target.displayName || target.name || '<anonymous>';
		meta = {
			name: name,
			tree: {
				label: label,
				type: 'function',
				nodes: nodes
			}
		};
		_metadata.set(target, meta);
	}
	return meta.tree;
}

function get(target) {
	return _metadata.get(target);
};

module.exports = {
	get: get,
	set: set
};
