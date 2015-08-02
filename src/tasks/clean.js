var defaults = {
    src: 'dist'
};

function cleanTask(config, done) {
    // lazy loading required modules.
    var del = require('del');
    
    //del(config.src || config.dest || defaults.src, done);
    done();
}

cleanTask.description = '';

module.exports = cleanTask;
