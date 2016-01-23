'use strict';

var Sinon = require('sinon');
var expect = require('chai').expect;
var test = require('mocha-cases');

var _ = require('lodash');

var base = process.cwd();

var realize = require(base + '/lib/configuration/realize');

describe('Core', function () {
	describe('Configuration', function () {
		describe('.realize()', function () {
			it('should call resolver function', function () {
				var resolved, values, expected;

				resolved = 'resolver called';
				values = {
					runtime: Sinon.spy(function () {
						return resolved;
					})
				};
				expected = {
					runtime: resolved
				};

				expect(realize(values)).to.deep.equal(expected);
				expect(values.runtime.calledWith(values)).to.be.true;
			});
			it('should render template using given values', function () {
				var rootResolver = function () {
					return 'value from rootResolver()';
				};
				var nestResolver = function () {
					return 'value from nestedResolver()';
				};
				var template = 'Hello {{plainValue}}! {{nested.plainValue}}, {{resolver}} and {{nested.resolver}}.';
				var realized = 'Hello World! Inner World, value from rootResolver() and value from nestedResolver().';
				var values = {
					message: template,
					nested: {
						message: template,
						resolver: nestResolver,
						plainValue: 'Inner World'
					},
					resolver: rootResolver,
					plainValue: 'World'
				};
				var expected = {
					message: realized,
					nested: {
						message: realized,
						resolver: nestResolver(),
						plainValue: 'Inner World'
					},
					resolver: rootResolver(),
					plainValue: 'World'
				};
				var actual;

				actual = realize(values);
				expect(actual).to.deep.equal(expected);
			});
		});
	});
});
