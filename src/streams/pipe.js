
function pipe(gulp, config, stream, tasks) {
    var IllegalTaskError = require('../errors/illegal_task_error.js');
    
    var i, n;
    
    if (tasks.length === 0) {
        throw IllegalTaskError('pipe', 'no sub tasks');
    }

    for (i = 0, n = tasks.length; i < n; ++i) {
        stream = tasks[i].run(gulp, config, stream, done);
    }
    return stream;

    function done() {
    }
}

pipe.description = '';

module.exports = pipe;