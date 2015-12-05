'use strict';

var Chai = require('chai'),
	expect = Chai.expect;

var _ = require('lodash');
var semver = require('semver');

var base = process.cwd();
var DependencyManager = require(base + '/src/core/dependency_manager');


describe('core', function () {
	describe('semver', function () {
		describe('.clean() & .compare() & .valid()', function () {
			it('do not accept range', function () {
				expect(semver.clean('1.0.9')).to.equal('1.0.9');
				expect(semver.clean('~1.0.9')).to.be.null;
				expect(semver.clean('^1.0.9')).to.be.null;
				expect(semver.clean('>=1.0.9')).to.be.null;
				expect(semver.clean('*')).to.be.null;

				expect(semver.compare('1.0.9', '1.0.9')).to.equal(0);
				expect(function () { semver.compare('~1.0.9', '1.0.9'); }).to.throw;
				expect(function () { semver.compare('1.0.9', '^1.0.9'); }).to.throw;
				expect(function () { semver.compare('~1.0.9', '^1.0.9'); }).to.throw;
				expect(function () { semver.compare('^1.0.9', '1.0.9'); }).to.throw;
				expect(function () { semver.compare('1.0.9', '~1.0.9'); }).to.throw;
				expect(function () { semver.compare('^1.0.9', '~1.0.9'); }).to.throw;

				expect(semver.valid('1.0.9')).to.equal('1.0.9');
				expect(semver.valid('^1.0.9')).to.be.null;
				expect(semver.valid('~1.0.9')).to.be.null;
				expect(semver.valid('*')).to.be.null;
			});
		});
		describe('.validRange()', function () {
			it('accept version & range', function () {
				expect(semver.validRange('1.0.9')).to.equal('1.0.9');
				expect(semver.validRange('^1.0.9')).to.equal('>=1.0.9 <2.0.0');
				expect(semver.validRange('~1.0.9')).to.equal('>=1.0.9 <1.1.0');
			});
			it('just do simple join when multiple ranges provided', function () {
				expect(semver.validRange('~1.0.9 ~1.0.7')).to.equal('>=1.0.9 <1.1.0 >=1.0.7 <1.1.0');
				expect(semver.validRange('~1.0.7 ~1.0.9')).to.equal('>=1.0.7 <1.1.0 >=1.0.9 <1.1.0');
				expect(semver.validRange('^1.0.9 ~1.0.7')).to.equal('>=1.0.9 <2.0.0 >=1.0.7 <1.1.0');
				expect(semver.validRange('^1.0.7 ~1.0.9')).to.equal('>=1.0.7 <2.0.0 >=1.0.9 <1.1.0');
			});
		});
	});

	describe('DependencyManager', function () {
		var store, manager;

		beforeEach(function () {
			store = {
				dependencies: {
					'lodash': '~3.10.1',
					'globby': '^2.1.0'
				},
				devDependencies: {
					"chai": "^3.2.0",
					"chai-as-promised": "^5.1.0",
					"mocha": "^2.3.4",
					"semver": "^5.1.0"
				}
			};
			manager = new DependencyManager(store);
		});

		describe('#register()', function () {
			it('should add newest requested version with caret range to devDependencies', function () {
				var expected = _.defaultsDeep({}, store, {
					devDependencies: {
						'json-normalizer': '^0.1.3',
						'mocha-cases': '^0.1.2'
					}
				});
				manager.register({
					'json-normalizer': '0.1.3'
				});
				manager.register({
					'json-normalizer': '0.1.1',
					'mocha-cases': '0.1.2'
				});
				var actual = manager.flush();
				expect(actual).to.be.true;
				expect(store).to.deep.equal(expected);
			});
			it('should handle tilde and caret ranges', function () {
				var expected = _.defaultsDeep({}, store, {
					devDependencies: {
						'json-normalizer': '^0.1.3',
						'mocha-cases': '^0.1.2'
					}
				});
				manager.register({
					'json-normalizer': '^0.1.2',
					'mocha-cases': '^0.1.0'
				});
				manager.register({
					'json-normalizer': '~0.1.3',
					'mocha-cases': '~0.1.2'
				});
				var actual = manager.flush();
				expect(actual).to.be.true;
				expect(store).to.deep.equal(expected);
			});
			it('should not add entry, if there is existing module in dependencies or devDependencies', function () {
				var expected = _.defaultsDeep({}, store, {
					devDependencies: {
						'mocha-cases': '^0.1.2'
					}
				});
				manager.register({
					'lodash': '3.10.1',
				});
				manager.register({
					'mocha': '2.3.4',
					'mocha-cases': '0.1.2'
				});
				var actual = manager.flush();
				expect(actual).to.be.true;
				expect(store).to.deep.equal(expected);
			});
		});
		describe('#flush()', function () {
			it('should report dirty if new entry added', function () {
			});
		});
	});
});
