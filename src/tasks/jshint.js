var defaults = {
    options: {
        jshintrc: '.jshintrc',
        // reporter: [
        //     'jshint-stylish',
        //     'fail'
        // ]
        reporter: {
            'default': { verbose: true }
            // 'jshint-stylish': {}
        }
    }
};

/**
 * Ingredients:
 * 
 * jshint
 * https://github.com/jshint/jshint
 * 
 * gulp-jshint
 * https://github.com/spalger/gulp-jshint
 */
function jshintTask(config) {
    var gulp = this;
    
    // lazy loading required modules.
    var jshint = require('gulp-jshint');
    var _ = require('lodash');
    
    var options = _.defaults({}, config.options, defaults.options);

    var stream = gulp.src(config.src)
        .pipe(jshint());
    if (typeof options.reporter === 'string') {
        stream = stream.pipe(jshint.reporter(options.reporter));
    }
    else {
        _.each(options.reporter, function(options, name) {
            if (typeof name === 'number') {
                name = options;
                options = {};
            }
            stream = stream.pipe(jshint.reporter(name, options));
        });
    }        
    return stream;
}

jshintTask.description = '';
jshintTask.defaults = defaults;
jshintTask.consumes = ['options', 'src'];

module.exports = jshintTask;
