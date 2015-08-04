/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function merge(config, tasks) {
    var gulp = this;
    
    // lazy loading required modules.
    var Stream = require('stream');
    var _merge = require('merge-stream');
    
    var IllegalTaskError = require('../errors/illegal_task_error.js');
    
    // TODO: return a empty stream that already end.
    if (tasks.length === 0) {
        return null;
    }
    
    if (tasks.length === 1) {
        return runTask(tasks[0]);
    }
    
    return _merge(tasks.map(runTask));
    
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

module.exports = merge;