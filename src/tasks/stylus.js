var defaults = {
    sourcemap: 'external',  // inline, external, false
    options: {
        'include css': true,
        'resolve url': true,
        'urlfunc': 'url'
    }
};

/**
 * Ingredients:
 * 
 * gulp-stylus
 * https://github.com/stevelacy/gulp-stylus
 * 
 * gulp-flatten
 * https://github.com/armed/gulp-flatten
 * 
 * gulp-newer
 * https://github.com/tschaub/gulp-newer
 * 
 * gulp-sourcemaps
 * https://github.com/floridoo/gulp-sourcemaps
 * 
 */
function stylusTask(gulp, config, stream, done) {
    // lazy loading required modules.
    var stylus = require('gulp-stylus');
    var flatten = require('gulp-flatten');
    var newer = require('gulp-newer');
    var sourcemaps = require('gulp-sourcemaps');
    var _ = require('lodash');

    var options = _.defaults({}, config.options, defaults.options, { compress: !config.debug });
    var sourcemap = !config.debug && (config.sourcemap || config.sourcemaps);

    if (!stream) {
        stream = gulp.src(config.src.globs, config.src.options);
    }
    
    if (config.flatten) {
        stream = stream.pipe(flatten());
    }

    stream = stream.pipe(newer(config.dest.path));
    
    if (sourcemap) {
        stream = stream.pipe(sourcemaps.init());
    }
    
    stream = stream.pipe(stylus(options));

    if (sourcemap) {
        // To write external source map files, 
        // pass a path relative to the destination to sourcemaps.write().
        stream = stream.pipe(sourcemaps.write(sourcemap === 'inline' ? undefined : '.'));
    }
    
    return stream
        .pipe(gulp.dest(config.dest.path, config.dest.options));
}

stylusTask.description = '';
stylusTask.consumes = ['dest', 'flatten', 'options', 'sourcemap', 'sourcemaps', 'src'];
stylusTask.defaults = defaults;

module.exports = stylusTask;
