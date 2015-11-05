'use strict';

var Sinon = require('sinon'),
	Chai = require('chai'),
	Promised = require("chai-as-promised"),
	expect = Chai.expect;

Chai.use(Promised);

function test(runner, testCases) {
    var tests = filter(only) || filter(skip) || testCases;
    tests.forEach(function(testCase) {
        it(testCase.title, function() {
            if (testCase.debug) {
                debugger;
            }

            var to = testCase.async ? 'eventually' : 'to';
            if (testCase.error) {
                expect(function() { runner(testCase.value, testCase.options); })[to].throw(testCase.error);
            } else {
                expect(runner(testCase.value, testCase.options))[to].deep.equal(testCase.expected);
            }
        });
    });

    function filter(fn) {
        var tests = testCases.filter(fn);
        if (tests.length) {
            return tests;
        }
    }

    function only(testCase) {
        return testCase.only;
    }

    function skip(testCase) {
        return !testCase.skip;
    }
}

module.exports = test;
