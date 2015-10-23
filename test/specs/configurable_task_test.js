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

function FakeGulp() {
	this.taskRegistry = {};
}

FakeGulp.prototype.task = function(name, runner) {
	if (typeof name === 'function') {
		runner = name;
		name = runner.displayName || runner.name;
	}
	if (typeof name === 'string' && typeof runner === 'function') {
		this.taskRegistry[name] = runner;
	}
	return this.taskRegistry[name];
};

function done(err) {
}

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

		describe('createReferenceTask()', function() {
			var gulp, spy, configurable, run;

			beforeEach(function () {
				gulp = new FakeGulp();

				spy = Sinon.spy();
				spy.displayName = 'spy';
				gulp.task(spy);

				run = Sinon.spy();
				configurable = Sinon.spy();
				configurable.displayName = 'configurable';
				gulp.task(configurable);
				configurable.run = run;
			});

			it('should create a ConfigurableTask instance', function() {
				var actual = ConfigurableTask.createReferenceTask('spy');
				expect(actual).to.be.a('function');
				actual.call(gulp, gulp, {}, null, done);
				expect(spy.calledOn(gulp)).to.be.true;
				expect(spy.calledWithExactly(done)).to.be.true;
			});

			it('should throw at runtime if the referring task not found', function() {
				var actual = ConfigurableTask.createReferenceTask('not-exist');
				expect(function () { actual.call(gulp, gulp, {}, null, done); }).to.throw(ConfigurationError);
			});

			it('should call run() if a configurableTask', function() {
				var actual = ConfigurableTask.createReferenceTask('configurable');
				expect(actual).to.be.a('function');
				actual.call(gulp, gulp, {}, null, done);
				expect(run.calledOn(configurable)).to.be.true;
				expect(run.calledWithExactly(gulp, {}, null, done)).to.be.true;
			});
		});
	});
});
