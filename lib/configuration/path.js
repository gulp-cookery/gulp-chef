'use strict';

var normalize = require('json-normalizer').sync;

var SCHEMA_PATH = require('../schema/path.json');


function path(values) {
	return normalize(SCHEMA_PATH, values);
}

module.exports = path;
module.exports.SCHEMA = SCHEMA_PATH;
