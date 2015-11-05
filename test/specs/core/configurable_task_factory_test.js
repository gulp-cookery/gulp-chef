'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var _ = require('lodash');
var base = process.cwd();

var ConfigurableTaskFactory = require(base + '/src/core/configurable_task_factory');
var ConfigurationError = require(base + '/src/core/configuration_error');

var createFakeStuff = require(base + '/test/fake/stuff');
var FakeGulp = require(base + '/test/fake/gulp');
var test = require(base + '/test/testcase_runner');

function done(err) {
}

describe('Core', function () {
	describe('ConfigurableTaskFactory', function () {
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
			test(ConfigurableTaskFactory.getTaskRuntimeInfo, testCases);
		});
		describe('create()', function () {
			var gulp, taskInfo, taskConfig, stream, configurableRunner, actual;

			gulp = new FakeGulp();

			taskInfo = {
				name: 'configurable-task',
				visibility: ConfigurableTaskFactory.CONSTANT.VISIBILITY.NORMAL,
				runtime: ConfigurableTaskFactory.CONSTANT.RUNTIME.ALL
			};

			taskConfig = {
				name: 'taskConfig'
			};

			stream = {
				name: 'fake stream'
			};

			beforeEach(function() {
				configurableRunner = Sinon.spy();
				actual = ConfigurableTaskFactory.create('', taskInfo, taskConfig, configurableRunner);
			})

			it('should return a ConfigurableTask (a function with run() method)', function () {
				expect(actual).to.be.a('function');
				expect(actual.run).to.be.a('function');
				expect(actual.displayName).to.equal(taskInfo.name);
				expect(actual.visibility).to.equal(taskInfo.visibility);
				expect(actual.runtime).to.equal(taskInfo.runtime);
			});
			it('should return a ConfigurableTask with the given prefix name', function () {
				var prefix = 'dev:';
				actual = ConfigurableTaskFactory.create(prefix, taskInfo, taskConfig, configurableRunner);
				expect(actual.displayName).to.equal(prefix + taskInfo.name);
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
				actual = ConfigurableTaskFactory.create('', taskInfo, taskConfig, configurableRunner);
				actual.run(gulp, injectConfig, stream, done);
				expect(configurableRunner.calledWith(gulp, expectedConfig, stream, done)).to.be.true;
			});
		});
	});
});
