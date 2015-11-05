'use strict';

var Sinon = require('sinon'),
	Chai = require('chai'),
	expect = Chai.expect;

var _ = require('lodash');

var base = process.cwd();

var ConfigurableTaskRunnerFactory = require(base + '/src/core/configurable_runner_factory'),
	ConfigurableTaskFactory = require(base + '/src/core/configurable_task_factory'),
	Configuration = require(base + '/src/core/configuration'),
	ConfigurationError = require(base + '/src/core/configuration_error');

var createFakeStuff = require(base + '/test/fake/stuff'),
	FakeGulp = require(base + '/test/fake/gulp');

describe('Core', function () {
	describe('ConfigurableTaskFactory', function () {
		var gulp, factory;

		beforeEach(function() {
			var stuff = createFakeStuff(),
				registry = {
					register: function() {}
				};
			factory = new ConfigurableTaskFactory(stuff, new ConfigurableTaskRunnerFactory(stuff), registry);
			gulp = new FakeGulp();
		})

		describe('#create()', function () {
			var taskInfo, taskConfig, stream, configurableRunner;

			taskInfo = {
				name: 'configurable-task',
				visibility: Configuration.CONSTANT.VISIBILITY.NORMAL,
				runtime: Configuration.CONSTANT.RUNTIME.ALL
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
				var prefix = 'dev:',
					actual = factory.create(prefix, taskInfo, taskConfig, configurableRunner);
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
					},
					injectConfig = {
						'inject-value': 'resolved-value'
					},
					expectedConfig = {
						template: 'inject-value: resolved-value',
						'inject-value': 'resolved-value'
					};
				var actual = factory.create('', taskInfo, taskConfig, configurableRunner);
				actual.run(gulp, injectConfig, stream, done);
				expect(configurableRunner.calledWith(gulp, expectedConfig, stream, done)).to.be.true;
			});
		});
		describe('#one()', function () {
			it('should resolve a recipe task', function () {
				var actual = factory.one('', 'recipe-task', {}, {});
				expect(actual).to.be.a('function');
			});
			it('should resolve a stream task', function () {
				var actual = factory.one('', 'stream-task', {}, {});
				expect(actual).to.be.a('function');
			});
			it('should resolve a non-existent task with sub-task configs to a merge stream task', function () {
				var actual = factory.one('', 'non-existent-stream-task-with-sub-task-configs', {
					'recipe-task': {},
					'stream-task': {},
					'non-existent-but-with-src-and-dest-defined': {
						src: 'src',
						dest: 'dist'
					}
				}, {});
				expect(actual).to.be.a('function');
			});
			it('should throw if can not resolve to a task', function () {
				expect(function () { factory.one('', 'non-existent', {}, {}) }).to.throw(ConfigurationError);
			});
		});
		describe('#multiple()', function () {
			it('should process each config defined in subTaskConfigs', function () {
				Sinon.spy(factory, 'one');
				var actual = factory.multiple('', {
					'recipe-task': {},
					'stream-task': {}
				}, {});
				expect(factory.one.calledTwice).to.be.true;
				expect(actual).to.be.an('array');
				expect(actual.length).to.be.equal(2);
				factory.one.restore();
			});
		});
	});
});
