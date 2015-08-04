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
    
    return queue.call(gulp, config, tasks)
        .pipe(gulpConcat(config.file))
        .pipe(gulp.dest(config.dest));
}


concat.consumes = ['file', 'src'];
concat.description = 'Concatenates files';

module.exports = concat;