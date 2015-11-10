'use strict';

/**
 * Ingredients:
 *
 */
function cleanTask(gulp, config, stream, done) {
	// lazy loading required modules.
	var del = require('del');

	//del(config.dest.path, done);
	done();
}

cleanTask.schema = {
	"title": "clean",
	"description": "",
	"properties": {
		"src": {
			"description": ""
		},
		"dest": {
			"description": ""
		}
	},
	"required": []
};

module.exports = cleanTask;
