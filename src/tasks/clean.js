'use strict';

var defaults = {
	src: 'dist'
};

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

cleanTask.description = '';
cleanTask.consumes = ['dest', 'src'];
cleanTask.defaults = defaults;

module.exports = cleanTask;
