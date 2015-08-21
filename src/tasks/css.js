var defaults = {
    sourcemap: 'external',  // inline, external, false
    options: {
        autoprefixer: {
            browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1', 'safari 5', 'ie 9', 'ios 6', 'android 4'],
            cascade: true,
            remove: true            
        },
        minify: {
            //processImport: true
        }
    }
};

/**
 * Ingredients:
 * 
 * clean-css
 * https://github.com/jakubpawlowicz/clean-css
 * 
 * gulp-autoprefixer
 * https://github.com/sindresorhus/gulp-autoprefixer
 * 
 * gulp-flatten
 * https://github.com/armed/gulp-flatten
 * 
 * gulp-minify-css
 * https://github.com/murphydanger/gulp-minify-css
 * 
 * gulp-newer
 * https://github.com/tschaub/gulp-newer
 *
 * gulp-rename
 * https://github.com/hparra/gulp-rename
 *  
 * gulp-sourcemaps
 * https://github.com/floridoo/gulp-sourcemaps
 */
function cssTask(gulp, config, stream, done) {
    // lazy loading required modules.
    var autoprefixer = require('gulp-autoprefixer');
    var flatten = require('gulp-flatten');
    var minify = require('gulp-minify-css');
    var newer = require('gulp-newer');
    var rename = require('gulp-rename');
    var sourcemaps = require('gulp-sourcemaps');
    var _ = require('lodash');

    var options = _.defaultsDeep({}, config.options, defaults.options);
    var sourcemap = !config.debug && (config.sourcemap || config.sourcemaps);

    if (!stream) {
        stream = gulp.src(config.src);
    }

    if (config.flatten) {
        stream = stream.pipe(flatten());
    }

    stream = stream.pipe(newer(config.dest));
    
    if (sourcemap) {
        stream = stream.pipe(sourcemaps.init());    
    }
    
    stream = stream.pipe(autoprefixer(options.autoprefixer));
    
    if (!config.debug) {
        if (config['min.css']) {
            stream = stream.pipe(gulp.dest(config.dest))
                .pipe(rename({ extname: '.min.css' })); 
        }
        stream = stream.pipe(minify(options.minify || options));
    }
        
    if (sourcemap) {
        // To write external source map files, 
        // pass a path relative to the destination to sourcemaps.write().
        stream = stream.pipe(sourcemaps.write(sourcemap === 'inline' ? undefined : '.'));
    }

    return stream
        .pipe(gulp.dest(config.dest));
}

cssTask.description = '';
cssTask.defaults = defaults;
cssTask.consumes = ['dest', 'flatten', 'options', 'sourcemap', 'sourcemaps', 'src', "min.css"];

module.exports = cssTask;
