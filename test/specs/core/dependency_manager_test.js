'use strict';

var base = process.cwd();

var DependencyManager = require(base + '/src/core/dependency_manager');


describe('core', function () {
	describe('DependencyManager', function () {
		describe('#register()', function () {
			it('should add newest required version', function () {
			});
			it('should not add entry, if there is existing module in dependencies or devDependencies', function () {
			});
			it('should only touch devDependencies', function () {
			});
		});
		describe('#flush()', function () {
			it('should report dirty if new entry added', function () {
			});
		});
	});
});