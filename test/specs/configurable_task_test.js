'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var Promised = require("chai-as-promised");
var expect = Chai.expect;
Chai.use(Promised);

var _ = require('lodash');
var base = process.cwd();

var test = require(base + '/test/testcase_runner');
var ConfigurableTask = require(base + '/src/configurable_task');
var ConfigurationError = require(base + '/src/errors/configuration_error');

describe('Core', function() {
	describe('ConfigurableTask', function() {
		describe('getTaskRuntimeInfo()', function() {
			var testCases = [{
				title: 'should accept normal task name',
				value: 'build',
				expected: {
					name: 'build',
					hidden: '',
					runtime: ''
				}
			}, {
				title: 'should accept task name with space, underscore, dash',
				value: '_build the-project',
				expected: {
					name: '_build the-project',
					hidden: '',
					runtime: ''
				}
			}, {
				title: 'should accept . prefix and mark task hidden',
				value: '.build',
				expected: {
					name: 'build',
					hidden: '.',
					runtime: ''
				}
			}, {
				title: 'should accept # prefix and mark task undefined',
				value: '#build',
				expected: {
					name: 'build',
					hidden: '#',
					runtime: ''
				}
			}, {
				title: 'should accept # prefix and mark task undefined',
				value: '#build',
				expected: {
					name: 'build',
					hidden: '#',
					runtime: ''
				}
			}, {
				title: 'should accept ! postfix and mark task available in production mode only',
				value: 'build!',
				expected: {
					name: 'build',
					hidden: '',
					runtime: '!'
				}
			}, {
				title: 'should accept ? postfix and mark task available in development mode only',
				value: 'build?',
				expected: {
					name: 'build',
					hidden: '',
					runtime: '?'
				}
			}, {
				title: 'should throw if invalid name',
				value: 'build?!',
				error: ConfigurationError
			}, {
				title: 'should throw if invalid name',
				value: '?build',
				error: ConfigurationError
			}];
			test(ConfigurableTask.getTaskRuntimeInfo, testCases);
		});
	});
});
