var defaults = {
    options: {
        esnext: true,
        reporter: 'console'
    }
};

/**
 * Ingredients:
 * 
 * 
 */
function jscsTask(gulp, config, stream, done) {
    // lazy loading required modules.
    var jscs = require('jscs');

    return gulp.src(config.src)
        .pipe(jscs(config.options));
}

jscsTask.description = '';
jscsTask.consumes = ['options', 'src'];
jscsTask.defaults = defaults;

module.exports = jscsTask;
