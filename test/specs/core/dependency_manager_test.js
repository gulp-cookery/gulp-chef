'use strict';

var base = process.cwd();

var DependencyManager = require(base + '/src/core/dependency_manager');


describe('core', function () {
	describe('DependencyManager', function () {
		var manager;

		beforeEach(function () {
			manager = new DependencyManager({
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
			});
		});

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