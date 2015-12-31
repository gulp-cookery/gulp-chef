'use strict';

var yargs = require('yargs');
var chalk = require('chalk');

var generates = require('./generates');
var recipes = require('./recipes');
var tasks = require('./tasks');

var actions = {
	generates: {
		desc: 'Generate gulpfile.gen.js using configuration defined in the loaded gulpfile.',
		alias: ['generate', 'gen', 'g'],
		fn: generates,
		type: 'string',
		phase: 'postConfigure',
		exit: 0
	},
	recipes: {
		desc: 'Print the available recipes or information of a recipe for the project.',
		alias: ['recipe', 'r'],
		fn: recipes,
		type: 'string',
		phase: 'preConfigure',
		exit: 0
	},
	tasks: {
		desc: 'Print the configuration of a task for the project.',
		alias: ['task'],
		fn: tasks,
		type: 'string',
		phase: 'postConfigure'
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
					process.exit(action.exit);
				}
			});
		}
	});

	function _alias() {
		return Object.keys(actions).reduce(function (ret, key) {
			ret[key] = actions[key].alias;
			return ret;
		}, {});
	}
};