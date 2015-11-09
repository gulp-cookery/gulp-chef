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

cleanTask.displayName = 'clean';
cleanTask.description = '';
cleanTask.schema = {
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
