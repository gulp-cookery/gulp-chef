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
function imagesTask(config) {
    var gulp = this;
    
    // lazy loading required modules.
    var flatten = require('gulp-flatten');
    var imagemin = require('gulp-imagemin');
    var newer = require('gulp-newer');
    var _ = require('lodash');

    var options = _.defaultsDeep({}, config.options, defaults.options);
    
    var stream = gulp.src(config.src);

    if (config.flatten) {
        stream = stream.pipe(flatten());
    } 
    
    stream = stream.pipe(newer(config.dest));
        
    if (!config.debug) {
        stream = stream.pipe(imagemin(options));
    } 
    
    return stream
        .pipe(gulp.dest(config.dest));
}

function imagesTaskV2(config) {
    var gulp = this;
    
    // lazy loading required modules.
    var contents = require('file-contents');
    var flatten = require('gulp-flatten');
    var imagemin = require('gulp-imagemin');
    var newer = require('gulp-newer');
    var path = require('path');
    var _ = require('lodash');

    var options = _.defaults({}, config.options, defaults.options);
    
    // we don't want waste time to read unchanged files.
    var stream = gulp.src(config.src, { read: false });
    
    // so, must first filter newer files.
    var newerOptions = {
        dest: config.dest
    };
    if (config.flatten) {
        newerOptions.map = function(relativePath) {
            console.log('relativePath='+relativePath);
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
        stream = stream.pipe(imagemin(options));
    } 
    
    return stream
        .pipe(gulp.dest(config.dest));
}

imagesTask.description = 'Optimize images.';
imagesTask.defaults = defaults;
imagesTask.consumes = ['dest', 'flatten', 'options', 'src'];

module.exports = imagesTaskV2;
