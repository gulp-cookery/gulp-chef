'use strict';

/**
 * WeakMap for storing metadata.
 *
 * Add metadata to make gulp.tree() happy.
 *
 * Note: we need the very metadata instance that gulp uses.
 * So, we have 2 options:
 *
 * 1. A hack: require that very module instance, as here we do.
 * 2. A override: override gulp.tree() method.
 *
 * Reference:
 *
 * https://github.com/gulpjs/undertaker/blob/master/lib/set-task.js
 * https://github.com/gulpjs/undertaker/blob/master/lib/parallel.js
 * https://github.com/gulpjs/undertaker/blob/master/lib/helpers/buildTree.js
 *
 */
var _metadata;

try {
	_metadata = require('gulp/node_modules/undertaker/lib/helpers/metadata');
} catch (ex) {
	_metadata = require('undertaker/lib/helpers/metadata');
}

function get(target) {
	return _metadata.get(target);
}

function set(target, label, optionalNodes) {
	var meta, name, nodes;

	nodes = optionalNodes || [];
	meta = _metadata.get(target);
	if (meta) {
		if (nodes.length) {
			meta.tree.nodes = meta.tree.nodes.concat(nodes);
		}
	} else {
		name = target.displayName || target.name || '<anonymous>';
		meta = {
			name: name,
			// Note: undertaker use taskWrapper function in set-task to allow for aliases.
			// Since we already wrap recipe function in configurable task, we don't need another wrapper.
			// So just add "orig" field here.
			// see https://github.com/gulpjs/undertaker/commit/9d0ee9cad5cffb64ffe8cdeee5a3ff69286c41eb for detail.
			orig: target,
			tree: {
				label: label,
				// all recipes are task (i.e. exposed to cli), not pure function.
				type: 'task',
				nodes: nodes
			}
		};
		if (nodes.length) {
			meta.branch = true;
		}
		_metadata.set(target, meta);
	}
	return meta.tree;
}

function tree(target, optionalNodes) {
	var name, nodes;

	name = target.displayName || target.name || '<anonymous>';
	nodes = (optionalNodes || []).map(function (node) {
		var meta;

		meta = get(node);
		return meta.tree;
	});
	set(target, name, nodes);
}

module.exports = {
	get: get,
	set: set,
	tree: tree
};
