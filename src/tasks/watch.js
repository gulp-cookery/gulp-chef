var gulp = require('gulp');
var _ = require('lodash');

function watchTask(config) {
    var depends, watchFiles;
    
    if (config.depends) {
        depends = config.depends;
    }
    else if (typeof config.task === 'function') {
        depends = [];
    }
    else if (typeof config.task === 'string') {
        depends = [ config.task ];
    }
    else if (Array.isArray(config.task)) {
        depends = config.task;
    }
    
    // TODO: find all src recursively.
    watchFiles = depends.map(function(name) {
        var task = _.find(gulp.tasks, name);
        if (task) {
            //task.config
        }
    });
    
    // first run all depends and then watch their sources.
    gulp.task('watch', depends, function() {
        gulp.watch(watchFiles, config.task);
    });
}

module.export = watchTask;