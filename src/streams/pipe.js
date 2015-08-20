
function pipe(config, tasks) {
    var gulp = this;
    
    var IllegalTaskError = require('../errors/illegal_task_error.js');
    
    var stream, task, i, n;
    
    if (tasks.length === 0) {
        throw IllegalTaskError('no sub tasks');
    }

    stream = tasks[0].run(gulp, config);
    for (i = 1, n = tasks.length; i < n; ++i) {
        task = tasks[i];
        if (typeof task.transform !== 'function') {
            throw IllegalTaskError('task does not support stream transform via pipe');
        }
        stream = task.transform(gulp, config, stream);
    }
    return stream;
}

pipe.description = '';
pipe.consumes = [];

module.exports = pipe;