'use strict';

var Sinon = require('sinon'),
	Chai = require('chai'),
	Promised = require("chai-as-promised"),
	expect = Chai.expect;

Chai.use(Promised);

var _ = require('lodash');

var base = process.cwd();

var bump = require(base + '/src/tasks/bump'),
	ConfigurationError = require(base + '/src/core/configuration_error'),
	ConfigurableTaskError = require(base + '/src/core/configurable_task_error');

describe('task processor', function () {
	describe('bump()', function () {
		it('should ...', function () {
		});
	});
});

