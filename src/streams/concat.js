/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function concat(gulp, config, stream, tasks) {
    // lazy loading required modules.
    var queue = require('./queue');
    var gulpConcat = require('gulp-concat');
    
    if (tasks.length === 0) {
        stream = stream || gulp.src(config.src);
    }
    else {
        stream = queue(gulp, config, stream, tasks);
    }
    
    return stream
        .pipe(gulpConcat(config.file))
        .pipe(gulp.dest(config.dest));
}


concat.description = 'Concatenates files';
concat.consumes = ['file', 'src'];

module.exports = concat;