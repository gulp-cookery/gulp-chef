'use strict';

var base = process.cwd();

var DependencyManager = require(base + '/src/core/dependency_manager');


describe('core', function () {
	describe('DependencyManager', function () {
		describe('#add()', function () {
			it('should keep newest version', function () {
			});
		});
		describe('#save()', function () {
			it('should not overwrite existing entries in package.json, neither dependencies nor devDependencies', function () {
			});
			it('should write to devDependencies', function () {
			});
		});
	});
});