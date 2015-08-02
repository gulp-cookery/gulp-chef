/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function merge(config, tasks) {
    var _merge = require('merge-stream');
    var _ = require('lodash');
    
    var gulp = this;
    
    return _merge(_.map(tasks, function(task) {
        // make sure runtime config being injected to configs of sub tasks.
        var taskConfig = _.defaults({}, task.config, config);
        return task.run(gulp, taskConfig, done);                
    }));
    
    function done() {
    }
}

module.exports = merge;