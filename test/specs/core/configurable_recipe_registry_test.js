'use strict';

var Chai = require('chai');
var expect = Chai.expect;

var base = process.cwd();

var ConfigurableRecipeRegistry = require(base + '/lib/core/configurable_recipe_registry');

describe('Core', function () {
	describe('ConfigurableRecipeRegistry', function () {
		describe('constructor()', function () {
			it('should take a hash object of tasks', function () {
				var actual;

				actual = new ConfigurableRecipeRegistry({
					task: function () {}
				});
				expect(actual).to.be.instanceof(ConfigurableRecipeRegistry);
				expect(actual.size()).to.equal(1);
			});
		});
		describe('#lookup()', function () {
			it('should return a function if found, otherwise, undefined', function () {
				var actual;

				actual = new ConfigurableRecipeRegistry({
					task: function () {}
				});
				expect(actual.lookup('task')).to.be.a('function');
				expect(actual.lookup('none')).to.be.an('undefined');
			});
		});
	});
});
