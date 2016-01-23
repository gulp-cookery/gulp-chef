'use strict';

var Sinon = require('sinon');
var expect = require('chai').expect;
var test = require('mocha-cases');

var base = process.cwd();

var glob = require(base + '/lib/configuration/glob');

describe('Core', function () {
	describe('Configuration', function () {
		describe('.glob()', function () {
			it('should accept path string', function () {
				var actual;

				actual = glob('src');
				expect(actual).to.deep.equal({
					globs: ['src']
				});
			});
			it('should accept globs', function () {
				var actual;

				actual = glob('src/**/*.js');
				expect(actual).to.deep.equal({
					globs: ['src/**/*.js']
				});
			});
			it('should accept globs array', function () {
				var actual;

				actual = glob(['src/**/*.js', 'lib/**/*.js']);
				expect(actual).to.deep.equal({
					globs: ['src/**/*.js', 'lib/**/*.js']
				});
			});
			it('should accept globs object with options', function () {
				var actual;

				actual = glob({
					globs: '**/*.js',
					options: {
						base: 'src'
					}
				});
				expect(actual).to.deep.equal({
					globs: ['**/*.js'],
					options: {
						base: 'src'
					}
				});
			});
			it('should accept globs object with flat options', function () {
				var actual;

				actual = glob({
					globs: '**/*.js',
					base: 'src'
				});
				expect(actual).to.deep.equal({
					globs: ['**/*.js'],
					options: {
						base: 'src'
					}
				});
			});
		});
	});
});
