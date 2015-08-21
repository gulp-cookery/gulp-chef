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
function markupsTask(gulp, config, stream, done) {
   
    // lazy loading required modules.
    var flatten = require('gulp-flatten');
    var htmlmin = require('gulp-htmlmin');
    var newer = require('gulp-newer');
    
    if (!stream) {
        stream = gulp.src(config.src);
    }
    
    if (config.flatten) {
        stream = stream.pipe(flatten());
    }
    
    stream = stream.pipe(newer(config.dest));
    
    if (!config.debug) {
        stream = stream.pipe(htmlmin(config.options));
    }

    return stream.pipe(gulp.dest(config.dest));
}

markupsTask.description = '';
markupsTask.defaults = defaults;
markupsTask.consumes = ['dest', 'flatten', 'options', 'src'];

module.exports = markupsTask;
