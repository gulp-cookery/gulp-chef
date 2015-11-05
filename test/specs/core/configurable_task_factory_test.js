'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var _ = require('lodash');
var base = process.cwd();

var ConfigurableTaskRunnerFactory = require(base + '/src/core/configurable_runner_factory');
var ConfigurableTaskFactory = require(base + '/src/core/configurable_task_factory');
var ConfigurationError = require(base + '/src/core/configuration_error');

var createFakeStuff = require(base + '/test/fake/stuff');
var FakeGulp = require(base + '/test/fake/gulp');
var test = require(base + '/test/testcase_runner');

describe('Core', function () {
	describe('ConfigurableTaskFactory', function () {
		var gulp, factory

		beforeEach(function() {
			var stuff = createFakeStuff();
			factory = new ConfigurableTaskFactory(stuff, new ConfigurableTaskRunnerFactory(stuff));
			gulp = new FakeGulp();
		})

		describe('.getTaskRuntimeInfo()', function () {
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
		describe('#create()', function () {
			var taskInfo, taskConfig, stream, configurableRunner;

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

			function done(err) {
			}

			beforeEach(function() {
				configurableRunner = Sinon.spy();
			})

			it('should return a ConfigurableTask (a function with run() method)', function () {
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				expect(actual).to.be.a('function');
				expect(actual.run).to.be.a('function');
				expect(actual.displayName).to.equal(taskInfo.name);
				expect(actual.visibility).to.equal(taskInfo.visibility);
				expect(actual.runtime).to.equal(taskInfo.runtime);
			});
			it('should return a ConfigurableTask with the given prefix name', function () {
				var prefix = 'dev:';
				var actual = factory.create(prefix, taskInfo, taskConfig, configurableRunner);
				expect(actual.displayName).to.equal(prefix + taskInfo.name);
			});
			it('should invoke configurableRunner() when act as a gulp task', function () {
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				actual.call(gulp, done);
				expect(configurableRunner.calledWith(gulp, taskConfig, null, done)).to.be.true;
			});
			it('should invoke configurableRunner() in run() method whe act as a configurable task', function () {
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				actual.run(gulp, taskConfig, stream, done);
				expect(configurableRunner.calledWith(gulp, taskConfig, stream, done)).to.be.true;
			});
			it('should be able to inject value and resolve config at runtime when act as a configurable task', function () {
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
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				actual.run(gulp, injectConfig, stream, done);
				expect(configurableRunner.calledWith(gulp, expectedConfig, stream, done)).to.be.true;
			});
		});
		describe('#one()', function () {
			it('should ...', function () {

			});
		});
		describe('#multiple()', function () {
			it('should ...', function () {

			});
		});
	});
});
