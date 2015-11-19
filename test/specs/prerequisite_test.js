'use strict';

var Chai = require('chai'),
	expect = Chai.expect;

var Stream = require('stream');

var gulp = require('gulp');
var _ = require('lodash');

function isGulp3() {
	return !!gulp.run;
}

function isGulp4() {
	return !!gulp.registry;
}

describe('Prerequisite', function () {
	if (isGulp3()) {
		describe('Gulp 3.X', function () {
			describe('.src()', function () {
				it('should always return a stream', function () {
					var stream = gulp.src('non-existent');
					expect(stream).to.be.an.instanceof(Stream);
					expect(stream).to.have.property('on');
				});
			});
		});
	}

	if (isGulp4()) {
		describe('Gulp 4.X', function () {
			describe('.src()', function () {
				it('should throw if target not exist', function () {
					if (isGulp4()) {
						expect(function () {
							gulp.src('non-existent');
						}).to.throw;
					}
				});
			});
		});
	}

	describe('Lodash', function () {
		describe('.defaultsDeep()', function () {
			it('should not merge string characters into array', function () {
				expect(_.defaultsDeep({ src: ['src'] }, { src: 'src' })).to.deep.equal({
					src: ['src']
				});
			});
		});
	});
});
