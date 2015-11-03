'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var _ = require('lodash');
var base = process.cwd();

var ConfigurableTask = require(base + '/src/core/configurable_task');
var ConfigurationError = require(base + '/src/core/configuration_error');

var FakeGulp = require(base + '/test/fake_gulp');
var test = require(base + '/test/testcase_runner');

function done(err) {
}

describe('Core', function () {
	describe('ConfigurableTask', function () {
		describe('getTaskRuntimeInfo()', function () {
			var testCases = [{
				title: 'should accept normal task name',
				value: 'build',
				expected: {
					name: 'build',
					visibility: '',
					runtime: ''
				}
			}, {
				title: 'should accept task name with space, underscore, dash',
				value: '_build the-project',
				expected: {
					name: '_build the-project',
					visibility: '',
					runtime: ''
				}
			}, {
				title: 'should accept . prefix and mark task hidden',
				value: '.build',
				expected: {
					name: 'build',
					visibility: '.',
					runtime: ''
				}
			}, {
				title: 'should accept # prefix and mark task undefined',
				value: '#build',
				expected: {
					name: 'build',
					visibility: '#',
					runtime: ''
				}
			}, {
				title: 'should accept ! postfix and mark task available in production mode only',
				value: 'build!',
				expected: {
					name: 'build',
					visibility: '',
					runtime: '!'
				}
			}, {
				title: 'should accept ? postfix and mark task available in development mode only',
				value: 'build?',
				expected: {
					name: 'build',
					visibility: '',
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
		describe('createConfigurableTask()', function () {
			var gulp, taskInfo, taskConfig, stream, configurableRunner, actual;

			gulp = new FakeGulp();

			taskInfo = {
				name: 'configurable-task',
				visibility: ConfigurableTask.CONSTANT.VISIBILITY.NORMAL,
				runtime: ConfigurableTask.CONSTANT.RUNTIME.ALL
			};

			taskConfig = {
				name: 'taskConfig'
			};

			stream = {
				name: 'fake stream'
			};

			beforeEach(function() {
				configurableRunner = Sinon.spy();
				actual = ConfigurableTask.createConfigurableTask(taskInfo, taskConfig, configurableRunner);
			})

			it('should return a ConfigurableTask (a function with run() method)', function () {
				expect(actual).to.be.a('function');
				expect(actual.run).to.be.a('function');
				expect(actual.displayName).to.equal(taskInfo.name);
				expect(actual.visibility).to.equal(taskInfo.visibility);
				expect(actual.runtime).to.equal(taskInfo.runtime);
			});
			it('should invoke configurableRunner() in configurableTask() method (as a gulp task)', function () {
				actual.call(gulp, done);
				expect(configurableRunner.calledWith(gulp, taskConfig, null, done)).to.be.true;
			});
			it('should invoke configurableRunner() in run() method (as a configurable task)', function () {
				actual.run(gulp, taskConfig, stream, done);
				expect(configurableRunner.calledWith(gulp, taskConfig, stream, done)).to.be.true;
			});
			it('should be able to inject value and resolve config at runtime (as a configurable task)', function () {
				var taskConfig = {
					template: 'inject-value: {{inject-value}}'
				};
				var injectConfig = {
					'inject-value': 'resolved-value'
				}
				var expectedConfig = {
					template: 'inject-value: resolved-value',
					'inject-value': 'resolved-value'
				}
				actual = ConfigurableTask.createConfigurableTask(taskInfo, taskConfig, configurableRunner);
				actual.run(gulp, injectConfig, stream, done);
				expect(configurableRunner.calledWith(gulp, expectedConfig, stream, done)).to.be.true;
			});
		});
	});
});
