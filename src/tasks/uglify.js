
var defaults = {
    options: {
        preserveComments: 'some'
    }    
};

function uglifyTask(gulp, config, stream) {
    var rename = require('gulp-rename');
    var uglify = require('gulp-uglify');
    
    if (!stream) {
        stream = gulp.src(config.src);
    }

    if (!config.debug) {
        stream = stream.pipe(uglify(config.options));
    }
    
    // TODO: determine when to write file:
    //    1.only if config.file exist? but if user don't want to rename?
    //    2.only if config.dest exist? but config.dest usally set globally.
    if (config.file) {
        stream = stream.pipe(rename(config.file))
            .pipe(gulp.dest(config.dest));
    }
    
    return stream;
}


uglifyTask.description = '';
uglifyTask.consumes = ['dest', 'file', 'options', 'src'];
uglifyTask.defaults = defaults;

module.exports = uglifyTask;