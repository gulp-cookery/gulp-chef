var del = require('del');

var defaults = {
    src: 'dist'
};

function cleanTask(config, done) {
    //del(config.src || config.dest || defaults.src, done);
    done();
}

cleanTask.description = '';

module.exports = cleanTask;
