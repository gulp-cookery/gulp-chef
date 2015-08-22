/*jshint node: true */
/*global process*/

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function merge(gulp, config, stream, tasks) {
    // lazy loading required modules.
    var _merge = require('merge-stream');
    
    var IllegalTaskError = require('../errors/illegal_task_error.js');
    
    // TODO: make sure throw error is good decision.
    if (tasks.length === 0) {
        throw new IllegalTaskError('merge', 'no sub task specified');
        //stream.emit('error', new PluginError('no sub task specified', e));
    }
    
    if (tasks.length === 1) {
        return runTask(tasks[0]);
    }
    
    return _merge(tasks.map(runTask));
    
    function runTask(task) {
        var stream = task.run(gulp, config, stream, done);
        if (!isStream(stream)) {
            throw new IllegalTaskError('merge', 'sub task must return a stream');
        }
        return stream;
    
        function done() {
        }
    }

    function isStream(target) {
        return (typeof target.pipe === 'function');
    }
}

merge.description = '';

module.exports = merge;