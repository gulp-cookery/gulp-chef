/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *
 */
function concat(gulp, config, stream, tasks) {
	// lazy loading required modules.
	var queue = require('./queue');
	var gulpConcat = require('gulp-concat');

	var ConfigurationError = require('../errors/configuration_error');

	if (!config.file) {
		throw new ConfigurationError('concat', 'configuration property "file" is required')
	}

	if (!config.dest) {
		throw new ConfigurationError('concat', 'configuration property "dest" is required')
	}

	if (tasks.length === 0) {
		if (!config.src) {
			throw new ConfigurationError('concat', 'configuration property "src" is required')
		}

		stream = stream || gulp.src(config.src.globs, config.src.options);
	} else {
		stream = queue(gulp, config, stream, tasks);
	}

	return stream
		.pipe(gulpConcat(config.file))
		.pipe(gulp.dest(config.dest.path, config.dest.options));
}


concat.description = 'Concatenates files';
concat.consumes = ['dest', 'file', 'src'];

module.exports = concat;
