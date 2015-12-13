'use strict';

/**
 * Recipe:
 * clean build output
 *
 * Ingredients:
 * del
 *
 */
function cleanTask(done) {
	// lazy loading required modules.
	var del = require('del');

	var config = this.config;

	//del(config.dest.path, done);
	done();
}

cleanTask.schema = {
	"title": "clean",
	"description": "",
	"properties": {
		"dest": {
			"description": ""
		}
	},
	"required": ["dest"]
};

cleanTask.type = 'task';

module.exports = cleanTask;
