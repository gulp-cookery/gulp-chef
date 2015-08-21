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
function jshintTask(gulp, config, stream, done) {
    
    // lazy loading required modules.
    var jshint = require('gulp-jshint');
    var _ = require('lodash');

    if (!stream) {
        stream = gulp.src(config.src);
    }
    stream = stream.pipe(jshint());
    
    if (typeof config.options.reporter === 'string') {
        stream = stream.pipe(jshint.reporter(config.options.reporter));
    }
    else {
        _.each(config.options.reporter, function(options, name) {
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
jshintTask.consumes = ['options', 'src'];
jshintTask.defaults = defaults;

module.exports = jshintTask;
