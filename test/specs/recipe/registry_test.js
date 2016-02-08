'use strict';

var Chai = require('chai');
var expect = Chai.expect;

var base = process.cwd();

var ConfigurableRecipeRegistry = require(base + '/lib/recipe/registry');

describe('Core', function () {
	describe('ConfigurableRecipeRegistry', function () {
		describe('constructor()', function () {
			it('should take a hash object of tasks', function () {
				var registry;

				registry = new ConfigurableRecipeRegistry({
					task: function () {}
				});
				expect(registry).to.be.instanceof(ConfigurableRecipeRegistry);
				expect(registry.size()).to.equal(1);
			});
		});
		describe('#lookup()', function () {
			it('should return a function if found, otherwise, undefined', function () {
				var registry;

				registry = new ConfigurableRecipeRegistry({
					task: function () {}
				});
				expect(registry.lookup('task')).to.be.a('function');
				expect(registry.lookup('none')).to.be.an('undefined');
			});
		});
	});
});
