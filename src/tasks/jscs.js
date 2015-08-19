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
function jscsTask(config) {
    var gulp = this;
    
    // lazy loading required modules.
    var jscs = require('jscs');
    var _ = require('lodash');

    var options = _.defaults({}, config.options, defaults.options);

    return gulp.src(config.src)
        .pipe(jscs(options));
}

jscsTask.description = '';
jscsTask.defaults = defaults;
jscsTask.consumes = ['options', 'src'];

module.exports = jscsTask;
