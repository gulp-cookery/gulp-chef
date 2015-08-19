/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function queue(config, tasks) {
    var gulp = this;
    
    // lazy loading required modules.
    var Stream = require('stream');
    var StreamQueue = require('streamqueue');

    var IllegalTaskError = require('../errors/illegal_task_error.js');
    
    if (tasks.length === 0) {
        throw new IllegalTaskError('no sub task specified');
    }
    
    if (tasks.length === 1) {
        return runTask(tasks[0]);
    }

    var streams = tasks.map(runTask);
    var streamQueue = new StreamQueue({ objectMode: true });
    return streamQueue.done.apply(streamQueue, streams);
    
    function runTask(task) {
        var stream = task.run(gulp, config, done);
        if (! (stream instanceof Stream)) {
            throw new IllegalTaskError('sub task must return a stream');
        }
        return stream;

        function done() {
        }
    }
}

queue.description = 'Pipe queued streams progressively';
queue.consumes = [];

module.exports = queue;