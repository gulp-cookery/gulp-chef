'use strict';

var Chai = require('chai'),
	expect = Chai.expect;

var _ = require('lodash');

var base = process.cwd();

var test = require(base + '/test/testcase_runner');

var ConfigurableTaskRunnerRegistry = require(base + '/src/core/configurable_runner_registry');

describe('Core', function () {
	describe('ConfigurableTaskRunnerRegistry', function () {
		describe('constructor()', function () {
			it('should take a hash object of tasks', function () {
				var actual = new ConfigurableTaskRunnerRegistry({
					task: function () {}
				});
				expect(actual).to.be.instanceof(ConfigurableTaskRunnerRegistry);
				expect(actual.size()).to.equal(1);
			});
		});
		describe('#lookup()', function () {
			it('should return a function if found, otherwise, undefined', function () {
				var actual = new ConfigurableTaskRunnerRegistry({
					task: function () {}
				});
				expect(actual.lookup('task')).to.be.a('function');
				expect(actual.lookup('none')).to.be.an('undefined');
			});
		});
	});
});
