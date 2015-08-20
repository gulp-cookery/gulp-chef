/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function concat(config, tasks) {
    var gulp = this;
    
    // lazy loading required modules.
    var queue = require('./queue');
    var gulpConcat = require('gulp-concat');
    var stream;
    
    if (tasks.length === 0) {
        stream = gulp.src(config.src);
    }
    else {
        stream = queue.call(gulp, config, tasks);
    }
    
    return stream
        .pipe(gulpConcat(config.file))
        .pipe(gulp.dest(config.dest));
}


concat.consumes = ['file', 'src'];
concat.description = 'Concatenates files';

module.exports = concat;