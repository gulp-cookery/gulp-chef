var defaults = {
    options: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true
    }
};

/**
 * 
 * 
 * Ingredients:
 * 
 * gulp-flatten
 * https://github.com/armed/gulp-flatten
 * 
 * gulp-htmlmin
 * https://github.com/jonschlinkert/gulp-htmlmin 
 * 
 * gulp-newer
 * https://github.com/tschaub/gulp-newer
 * 
 * gulp-sourcemaps
 * https://github.com/floridoo/gulp-
 * 
 * html-minifier
 * https://github.com/kangax/html-minifier
 * 
 */
function mackupTask(config) {
    var gulp = this;
    
    // lazy loading required modules.
    var flatten = require('gulp-flatten');
    var htmlmin = require('gulp-htmlmin');
    var newer = require('gulp-newer');
    var _ = require('lodash');
    
    var options = _.defaults({}, config.options, defaults.options);
    
    var stream = gulp.src(config.src);
    
    if (config.flatten) {
        stream = stream.pipe(flatten());
    }
    
    stream = stream.pipe(newer(config.dest));
    
    if (!config.debug) {
        stream = stream.pipe(htmlmin(options));
    }
    
    return stream
        .pipe(gulp.dest(config.dest));
}

mackupTask.description = '';
mackupTask.defaults = defaults;
mackupTask.consumes = ['dest', 'flatten', 'options', 'src'];

module.exports = mackupTask;
