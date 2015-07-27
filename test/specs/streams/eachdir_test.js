/*global describe, it, before, after, beforeEach, afterEach */
/*jshint expr: true*/
'use strict';

var mockfs = require('mock-fs');
var Sinon = require('sinon');
var Chai = require('chai');
var Promised = require("chai-as-promised");
var expect = Chai.expect;
Chai.use(Promised);

var Stream = require('stream');
var Readable = require('stream').Readable;
var Transform = require('stream').Transform;
var through = require('through2');
var fs = require('fs');
var _ = require('lodash');

var gulp = require('gulp');

var eachdir = require('../../../src/streams/eachdir.js');
var ConfigurationError = require('../../../src/errors/configuration_error.js');
var IllegalTaskError = require('../../../src/errors/illegal_task_error.js');

var dirs = {
    'app': {
        'index.html': '<html></html>',
        'modules': {
            'directive': {},
            'modules.js': '',
            'service': {}
        },
        'views': {
            'about': {},
            'all.js': '',
            'auth': {},
            'main': {}
        }
    },
    'README.md': 'bla bla...',
    'package.json': '{}'
};

var testCases = {
    'mock-fs': {
        path: 'app/modules',
        result: ['directive', 'modules.js', 'service']
    },
    'modules': {
        path: 'app/modules',
        result: ['directive', 'service']
    },
    'views': {
        path: 'app.views',
        result: ['about', 'auth', 'main']
    },
    'file': {
        path: 'app/index.html',
        result: []
    },
    'not-exist': {
        path: 'not-exist',
        result: []
    }
};

describe('stream processor', function() {
    
    describe('eachdir()', function() {
        var tasks;
        
        before(function() {
            mockfs(dirs);
        });
        
        after(function() {
            mockfs.restore();
        });
        
        beforeEach(function() {
            tasks = Sinon.spy();
        });
        
        afterEach(function() {
        });
        
        it('should mock-fs works (prerequisite)', function() {
            var testCase = testCases['mock-fs'];
            expect(fs.readdirSync(testCase.path)).to.be.deep.equal(testCase.result);
        });        
    
        it('should gulp.src() always return a stream (prerequisite)', function() {
            var stream = gulp.src('not-exist');
            expect(stream).to.be.an.instanceof(Stream);
            expect(stream).to.have.property('on');
        });

        it('should throw if config.src is not a valid string', function() {
            var configs = {
                empty: {
                },
                emptyString: {
                    src: ''
                },
                number: {
                    src: 1024
                },
                array: {
                    src: ['app/views']
                },
                arrayEmptyString: {
                    src: ['']
                },
                emptyArray: {
                    src: []
                },
            };
            _.forOwn(configs, function(config) {
                //console.log(JSON.stringify(config));
                expect(function() { eachdir(config, tasks); }).to.throw(ConfigurationError);
            });
        });
    
        it('should invoke the given task for each folder', function() {
            var testCase = testCases.modules;
            var config = {
                src: testCase.path
            };
            var visits = [];
            var tasks = Sinon.spy(function(config, done) {
                visits.push(config.dir);
                return through.obj();
            });
            eachdir(config, tasks);
            expect(visits).to.deep.equal(testCase.result);        
        });
    
        it('should throw if the given task does not return a stream', function() {
            var testCase = testCases.modules;
            var config = {
                src: testCase.path
            };
            var tasks = function(config, done) {
            };
            expect(function() { eachdir(config, tasks); }).to.throw(IllegalTaskError);        
        });
    
        it('should always return a stream, even if dir does not exist or is a file', function() {
            var configs = {
                exist: {
                    src: testCases.views.path
                },
                notExist: {
                    src: testCases['not-exist'].path
                },
                file: {
                    src: testCases.file.path
                }
            };
            _.forOwn(configs, function(config) {
                //console.log(JSON.stringify(config));
                expect(eachdir(config, tasks)).to.be.an.instanceof(Stream);
            });
        });
    
    });
});