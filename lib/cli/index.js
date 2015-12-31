'use strict';

var yargs = require('yargs');

var recipes = require('./recipes');
var tasks = require('./tasks');
var exit = require('./exit');

var actions = {
	recipes: {
		desc: 'Print the available recipes or information of a recipe for the project.',
		alias: ['recipe', 'r'],
		fn: recipes,
		type: 'string',
		phase: 'preConfigure',
		exit: 0
	},
	task: {
		desc: 'Print the configuration of a task for the project.',
		fn: tasks,
		type: 'string',
		phase: 'postRegister'
	}
};

module.exports = function (argv, phase) {
	var alias = _alias();
	var acts = yargs(argv)
		.alias(alias)
		.argv;

	Object.keys(acts).forEach(function (key) {
		var action = actions[key];

		if (action) {
			phase[action.phase](function (event) {
				action.fn(event, acts[key]);
				if ('exit' in action) {
					exit(action.exit);
				}
			});
		}
	});

	function _alias() {
		return Object.keys(actions).reduce(function (ret, key) {
			if (actions[key].alias) {
				ret[key] = actions[key].alias;
			}
			return ret;
		}, {});
	}
};