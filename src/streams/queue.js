/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function queue(config, tasks) {
    var _ = require('lodash');
    var Queue = require('streamqueue');
    
    var gulp = this;
    
    var queue, streams;
    
    streams = _.map(tasks, function(task) {
        // make sure runtime config being injected to configs of sub tasks.
        var taskConfig = _.defaults({}, task.config, config);
        return task.run(gulp, taskConfig, done);                
    });
    
    queue = new Queue({ objectMode: true });
    return queue.done.apply(queue, streams);
    
    function done() {
    }
}

queue.description = 'Pipe queued streams progressively';
queue.consumes = [];

module.exports = queue;