'use strict';

var Chai = require('chai'),
	Promised = require("chai-as-promised"),
	expect = Chai.expect;

Chai.use(Promised);

/**
 * Run test runner using given test cases.
 * A tiny mocha test case runner. Suited for simple input to output validation tests.
 *
 * @param testCases
 *   var testCases = [{
 *       title: 'should ...',
 *       value: 'input value for test',
 *       expected: 'expected output value',
 *       error: 'expected error',
 *       options: { description: 'options passed to runner for this case' },
 *       async: false,	// is this an async test? i.e. return promise?
 *       debug: true,	// pause on debugger?
 *       only: true,	// run this case only?
 *       skip: false	// skip this case?
 *   }, {
 *       ...
 *   }];
 * @param runner
 *    function runner(value, options) {
 *    	  return testTarget(value);
 *    }
 */
function test(testCases, runner) {
    var tests = filter(only) || filter(skip) || testCases;
    tests.forEach(function (testCase) {
        it(testCase.title, function () {
            if (testCase.debug) {
                debugger;
            }

            var to = testCase.async ? 'eventually' : 'to';
            if (testCase.error) {
                expect(function () { runner(testCase.value, testCase.options); })[to].throw(testCase.error);
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
