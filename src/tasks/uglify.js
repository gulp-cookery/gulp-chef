
var defaults = {
    options: {
        preserveComments: 'some'
    }    
};

function uglifyTask(config) {
    var gulp = this;
    
    var stream = gulp.src(config.src);
    stream = transform(gulp, config, stream);
    if (!config.file) {
        stream = stream.pipe(gulp.dest(config.dest));
    }
    return stream;
}

function transform(gulp, config, stream) {
    var rename = require('gulp-rename');
    var uglify = require('gulp-uglify');
    var _ = require('lodash');
    
    var options = _.defaults({}, config.options, defaults.options);
    
    if (!config.debug) {
        stream = stream.pipe(uglify(options));
    }
    
    if (config.file) {
        stream = stream.pipe(rename(config.file))
            .pipe(gulp.dest(config.dest));
    }
    
    return stream;
}

uglifyTask.description = '';
uglifyTask.defaults = defaults;
uglifyTask.consumes = ['dest', 'file', 'options', 'src'];
uglifyTask.transform = transform;

module.exports = uglifyTask;