var defaults = {
    src: 'dist'
};

/**
 * Ingredients:
 * 
 */
function cleanTask(gulp, config, stream, done) {
    // lazy loading required modules.
    var del = require('del');
    
    //del(config.src || config.dest || defaults.src, done);
    done();
}

cleanTask.description = '';
cleanTask.defaults = defaults;
cleanTask.consumes = ['dest', 'src'];

module.exports = cleanTask;
