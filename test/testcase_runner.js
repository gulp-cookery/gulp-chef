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
 *       only: true,	// run this case only?
 *       skip: false	// skip this case?
 *   }, {
 *       ...
 *   }];
 * @param runner
 *    function runner(value, options) {
 *    	  return testTarget(value);
 *    }
 * @param options
 *
 *
 * Alternatives:
 * run-mocha-cases
 * https://www.npmjs.com/package/run-mocha-cases
 *
 */
function cases(testCases, runner, options) {
    var prefix, tests;

	tests = filter(only) || filter(skip) || testCases;
	options = options || {};
	prefix = options.prefix || '';
    tests.forEach(function (testCase) {
        it(prefix + testCase.name, function () {
            var to = (testCase.async || options.async) ? 'eventually' : 'to';
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

module.exports = cases;
