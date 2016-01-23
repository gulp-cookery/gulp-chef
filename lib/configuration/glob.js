'use strict';

var normalize = require('json-normalizer').sync;

/*
 * NOTE:
 * According to [gulp API](https://github.com/gulpjs/gulp/blob/master/docs/API.md)
 * and [gulp 4.0 API](https://github.com/gulpjs/gulp/blob/4.0/docs/API.md):
 * gulp supports all options supported by node-glob and glob-stream except ignore and adds the following options.
 *
 * @see
 * [node-glob](https://github.com/isaacs/node-glob)
 * [glob-stream](https://github.com/gulpjs/glob-stream)
 *
 */
var SCHEMA_GLOB = require('../schema/glob.json');

function glob(values) {
	return normalize(SCHEMA_GLOB, values);
}

module.exports = glob;
module.exports.SCHEMA = SCHEMA_GLOB;
