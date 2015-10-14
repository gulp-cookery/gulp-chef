var defaults = {
	options: {
		optimizationLevel: 3,
		progressive: true,
		interlaced: true
	}
};

/**
 * Ingredients:
 *
 * gulp-flatten
 * https://github.com/armed/gulp-flatten
 *
 * gulp-imagemin
 * https://github.com/sindresorhus/gulp-imagemin
 *
 * gulp-newer
 * https://github.com/tschaub/gulp-newer
 */
function imagesTask(gulp, config, stream, done) {
	// lazy loading required modules.
	var flatten = require('gulp-flatten');
	var imagemin = require('gulp-imagemin');
	var newer = require('gulp-newer');

	if (!stream) {
		stream = gulp.src(config.src.globs, config.src.options);
	}

	if (config.flatten) {
		stream = stream.pipe(flatten());
	}

	stream = stream.pipe(newer(config.dest));

	if (!config.debug) {
		stream = stream.pipe(imagemin(config.options));
	}

	return stream
		.pipe(gulp.dest(config.dest.path, config.dest.options));
}

function imagesTaskV2(gulp, config, stream, done) {
	// lazy loading required modules.
	var contents = require('file-contents');
	var flatten = require('gulp-flatten');
	var imagemin = require('gulp-imagemin');
	var newer = require('gulp-newer');
	var path = require('path');
	var _ = require('lodash');

	// we don't want waste time to read unchanged files.
	if (!stream) {
		stream = gulp.src(config.src.globs, _.defaults({
			read: false
		}, config.src.options));
	}

	// so, must first filter newer files.
	var newerOptions = {
		dest: config.dest
	};
	if (config.flatten) {
		newerOptions.map = function(relativePath) {
			console.log('relativePath=' + relativePath);
			return path.basename(relativePath);
		};
	}
	stream = stream.pipe(newer(newerOptions));

	// and then read their contents.
	stream = stream.pipe(contents());

	// and can finally flatten their filenames.
	if (config.flatten) {
		stream = stream.pipe(flatten());
	}

	if (!config.debug) {
		stream = stream.pipe(imagemin(config.options));
	}

	return stream
		.pipe(gulp.dest(config.dest.path, config.dest.options));
}

imagesTask.description = 'Optimize images.';
imagesTask.consumes = ['dest', 'flatten', 'options', 'src'];
imagesTask.defaults = defaults;

module.exports = imagesTaskV2;
