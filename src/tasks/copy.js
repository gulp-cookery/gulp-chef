function copyTask(gulp, config, stream, done) {
	var flatten = require('gulp-flatten');

	if (!stream) {
		stream = gulp.src(config.src.globs, config.src.options);
	}

	if (config.flatten) {
		stream = stream.pipe(flatten());
	}
	return stream.pipe(gulp.dest(config.dest.path, config.dest.options));
}

copyTask.description = '';
copyTask.consumes = ['dest', 'flatten', 'src'];

module.exports = copyTask;
