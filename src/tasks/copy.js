function copy(config) {
    var gulp = this;
    
    var flatten = require('gulp-flatten');
    
    var stream = gulp.src(config.src);
    if (config.flatten) {
        stream = stream.pipe(flatten());
    }
    return stream.pipe(gulp.dest(config.dest));
}

copy.description = '';
copy.consumes = ['dest', 'flatten', 'src'];

module.exports = copy;