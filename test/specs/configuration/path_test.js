'use strict';

var Sinon = require('sinon');
var expect = require('chai').expect;
var test = require('mocha-cases');

var base = process.cwd();

var path = require(base + '/lib/configuration/path');

describe('Core', function () {
	describe('Configuration', function () {
		describe('.path()', function () {
			it('should accept path string', function () {
				var actual;

				actual = path('dist');
				expect(actual).to.deep.equal({
					path: 'dist'
				});
			});
			it('should accept path object', function () {
				var actual;

				actual = path({
					path: 'dist'
				});
				expect(actual).to.deep.equal({
					path: 'dist'
				});
			});
			it('should accept path object with options', function () {
				var actual;

				actual = path({
					path: 'dist',
					options: {
						cwd: '.'
					}
				});
				expect(actual).to.deep.equal({
					path: 'dist',
					options: {
						cwd: '.'
					}
				});
			});
			it('should accept path object with flat options', function () {
				var actual;

				actual = path({
					path: 'dist',
					cwd: '.'
				});
				expect(actual).to.deep.equal({
					path: 'dist',
					options: {
						cwd: '.'
					}
				});
			});
		});
	});
});
