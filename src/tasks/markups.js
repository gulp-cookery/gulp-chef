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
 */
function markupsTask(config) {
    var gulp = this;
    
    var stream = gulp.src(config.src);
    stream = transform(gulp, config, stream);
    return stream.pipe(gulp.dest(config.dest));
}

function transform(gulp, config, stream) {
    // lazy loading required modules.
    var flatten = require('gulp-flatten');
    var htmlmin = require('gulp-htmlmin');
    var newer = require('gulp-newer');
    var _ = require('lodash');
    
    var options = _.defaults({}, config.options, defaults.options);
    
    if (config.flatten) {
        stream = stream.pipe(flatten());
    }
    
    stream = stream.pipe(newer(config.dest));
    
    if (!config.debug) {
        stream = stream.pipe(htmlmin(options));
    }
    
    return stream;
}

markupsTask.description = '';
markupsTask.defaults = defaults;
markupsTask.consumes = ['dest', 'flatten', 'options', 'src'];
markupsTask.transform = transform;

module.exports = markupsTask;
