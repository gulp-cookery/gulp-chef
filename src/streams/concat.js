/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function concat(config, tasks) {
    // lazy loading required modules.
    var queue = require('streamqueue');
    var gulpConcat = require('gulp-concat');
    var _ = require('lodash');
    
    var gulp, streams, streamQueue;
    
    gulp = this;
    
    if (tasks && tasks.length) {
        streams = _.map(tasks, function(task) {
            var taskConfig = _.defaults({}, task.config, config);
            return task.run(gulp, taskConfig, done);
        });
        streamQueue = queue({ objectMode: true }); 
        streams = streamQueue.queue.apply(streamQueue, streams);
    }
    else {
        streams = gulp.src(config.src);
    }

    return streams
        .pipe(gulpConcat(config.file))
        .pipe(gulp.dest(config.dest));
    
    function done() {
    }
}


concat.consumes = ['file', 'src'];
concat.description = 'Concatenates files';

module.exports = concat;