'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var regulate = require('json-regulator');
var deref = require('json-normalizer/lib/deref').sync;

function detail(stuff, name) {
	var recipe;

	recipe = stuff.tasks.lookup(name) || stuff.streams.lookup(name) || stuff.flows.lookup(name);
	if (recipe) {
		return _schema() || _simple();
	}
	return 'The recipe "' + name + '" not found.';

	function _schema() {
		var schema;

		if (recipe.schema) {
			schema = deref(recipe.schema);
			// NOTE: requires json-regulator options.overwrite: false.
			// Because json-schema can override extended schema.
			// so schemas from 'extends' should not overwrite referer schema.
			// NOTE: it is possible there is circular references, and can cause stack overflow problems.
			// If this is the situation, remove this call, and just display raw schema.
			schema = regulate(schema, ['extends'], ['definitions'], { overwrite: false });
			return JSON.stringify(schema, null, '  ');
		}
	}

	function _simple() {
		return _name() + '\n' + chalk.gray(_desc());
	}

	function _name() {
		return recipe.schema && recipe.schema.title || recipe.displayName || recipe.name;
	}

	function _desc() {
		return recipe.schema && recipe.schema.description || recipe.description;
	}
}

function list(stuff) {
	var recipes;

	recipes = _.defaults({}, stuff.tasks.recipes, stuff.streams.recipes, stuff.flows.recipes);
	recipes = Object.keys(recipes).sort().join(', ');
	return 'Available recipes:\n' + recipes;
}

module.exports = function (stuff, name) {
	var message;

	if (typeof name === 'string') {
		message = detail(stuff, name);
	} else {
		message = list(stuff);
	}
	console.log(message);
};
