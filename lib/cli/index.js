'use strict';

var minimist = require('minimist');

var generates = require('./generates');
var recipes = require('./recipes');
var tasks = require('./tasks');

var actions = {
	generates: {
		alias: ['generate', 'gen', 'g'],
		fn: generates,
		phase: 'postConfigure',
		exit: 0
	},
	recipes: {
		alias: ['recipe', 'r'],
		fn: recipes,
		phase: 'preConfigure',
		exit: 0
	},
	task: {
		fn: tasks,
		phase: 'postConfigure'
	},
	tasks: {
		fn: function (args) {
			if (args) {
				tasks(args);
				process.exit(0);
			}
		},
		phase: 'postConfigure'
	}
};

module.exports = function (argv, phase) {
	var alias = Object.keys(actions).reduce(function (ret, action) {
		if (actions[action].alias) {
			ret[action] = actions[action].alias;
		}
		return ret;
	}, {});
	var acts = minimist(argv, { 'alias': alias });

	Object.keys(acts).forEach(function (key) {
		var action = actions[key];

		if (action) {
			phase[action.phase](function () {
				action.fn(acts[key]);
				if ('exit' in action) {
					process.exit(action.exit);
				}
			});
		}
	});
};