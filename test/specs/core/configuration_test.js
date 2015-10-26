'use strict';

var Sinon = require('sinon');
var Chai = require('chai');
var expect = Chai.expect;

var base = process.cwd();

var Configuration = require(base + '/src/core/configuration');
var ConfigurationError = require(base + '/src/errors/configuration_error');

var test = require(base + '/test/testcase_runner');
var _ = require('lodash');

describe('Core', function () {
	describe('Configuration', function () {
		describe('src()', function () {
			it('should accept path string', function () {
				var actual = Configuration.src('src');
				expect(actual).to.deep.equal({
					globs: ["src"]
				});
			});
			it('should accept globs', function () {
				var actual = Configuration.src('src/**/*.js');
				expect(actual).to.deep.equal({
					globs: ["src/**/*.js"]
				});
			});
			it('should accept globs array', function () {
				var actual = Configuration.src(['src/**/*.js', 'lib/**/*.js']);
				expect(actual).to.deep.equal({
					globs: ['src/**/*.js', 'lib/**/*.js']
				});
			});
			it('should accept globs object with options', function () {
				var actual = Configuration.src({
					globs: '**/*.js',
					options: {
						base: 'src'
					}
				});
				expect(actual).to.deep.equal({
					globs: ["**/*.js"],
					options: {
						base: "src"
					}
				});
			});
			it('should accept globs object with flat options', function () {
				var actual = Configuration.src({
					globs: '**/*.js',
					base: 'src'
				});
				expect(actual).to.deep.equal({
					globs: ["**/*.js"],
					options: {
						base: "src"
					}
				});
			});
		});
		describe('dest()', function () {
			it('should accept path string', function () {
				var actual = Configuration.dest('dist');
				expect(actual).to.deep.equal({
					path: "dist"
				});
			});
			it('should accept path object', function () {
				var actual = Configuration.dest({
					path: 'dist'
				});
				expect(actual).to.deep.equal({
					path: "dist"
				});
			});
			it('should accept path object with options', function () {
				var actual = Configuration.dest({
					path: 'dist',
					options: {
						cwd: '.'
					}
				});
				expect(actual).to.deep.equal({
					path: "dist",
					options: {
						cwd: "."
					}
				});
			});
			it('should accept path object with flat options', function () {
				var actual = Configuration.dest({
					path: 'dist',
					cwd: '.'
				});
				expect(actual).to.deep.equal({
					path: "dist",
					options: {
						cwd: "."
					}
				});
			});
		});
		describe('sort()', function () {
			it('_.defaultsDeep should not merge string characters into array', function() {
				expect(_.defaultsDeep({ src: ['src'] }, { src: 'src' })).to.deep.equal({
					src: ['src']
				});
			});
			it('should accept empty config', function () {
				var actual = Configuration.sort({}, {}, {});
				expect(actual).to.deep.equal({
					taskConfig: {},
					subTaskConfigs: {}
				});
			});
			it('should always accept src and dest property even schema not defined', function () {
				var actual = Configuration.sort({
					src: 'src',
					dest: 'dist'
				}, {}, {});
				expect(actual).to.deep.equal({
					taskConfig: {
						src: {
							globs: ["src"]
						},
						dest: {
							path: "dist"
						}
					},
					subTaskConfigs: {}
				});
			});
			it('should inherit parent config', function () {
				var actual = Configuration.sort({
					src: 'src',
					dest: 'dist'
				}, {}, {});
				expect(actual).to.deep.equal({
					taskConfig: {
						src: {
							globs: ["src"]
						},
						dest: {
							path: "dist"
						}
					},
					subTaskConfigs: {}
				});
			});
			it('should join parent path config', function () {
				var actual = Configuration.sort({
					src: ['services/**/*.js', 'views/**/*.js'],
					dest: 'lib'
				}, {
					src: {
						globs: ['src']
					},
					dest: {
						path: 'dist'
					}
				}, {});
				expect(actual).to.deep.equal({
					taskConfig: {
						src: {
							globs: ['src/services/**/*.js', 'src/views/**/*.js'],
						},
						dest: {
							path: "dist/lib"
						}
					},
					subTaskConfigs: {}
				});
			});
		});
	});
});
