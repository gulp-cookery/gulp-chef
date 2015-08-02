/*jshint node: true */
/*global process*/
/**
 * References:
 * 
 * Generating a file per folder
 * https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-task-steps-per-folder.md
 */

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function eachdir(config, tasks) {
    // lazy loading required modules.
    var fs = require('fs');
    var path = require('path');
    var merge = require('merge-stream');
    var _ = require('lodash');
    
    var Queue = require('streamqueue');
    var Stream = require('stream');
    
    var resolveVariables = require('../util/resolve_variables');
    
    var ConfigurationError = require('../errors/configuration_error.js');
    var IllegalTaskError = require('../errors/illegal_task_error.js');
    
    var gulp, cwd, src, folders, streams;
    
    gulp = this;
    
    if (typeof config.src === 'function') {
        src = config.src.call(gulp, config);
    }
    else {
        src = config.src;
    }
    
    if (typeof src !== 'string') {
        throw ConfigurationError('configuration "src" is required and should be a string of folder name');
    }
    
    cwd = process.cwd();
    folders = getFolders(src);
    streams = folders.map(processFolder);
    return merge(streams);

    // glob support in src:
    // function globGetFolders(globs, options) {
    //     var globby = require('globby');
    //     options = options || {};
    //     return globby.sync(globs, options)
    //         .filter(function(file) {
    //             return fs.statSync(path.join(options.base || '', file)).isDirectory();
    //         });
    // }
    
    function getFolders(dir) {
        try {
            return fs.readdirSync(dir).filter(function (file) {
                return fs.statSync(path.join(dir, file)).isDirectory();
            });
        }
        catch(ex) {
            return [];
        }
    }
    
    function processFolder(folder) {
        var injectConfig, streams, queue;
        
        injectConfig = {
            cwd: path.join(cwd, src, folder),
            dir: folder
        };
        resolveVariables(config, injectConfig);
        
        if (tasks && tasks.length) {
            streams = _.map(tasks, function(task) {
                var stream = task.run(gulp, injectConfig, done);
                if (! (stream instanceof Stream)) {
                    throw new IllegalTaskError('sub task must return a stream');
                }
                return stream;
            });
            queue = new Queue({ objectMode: true });
            return queue.done.apply(queue, streams);
        }
        else {
            return gulp.src(config.src);
        }
    }
    
    function done() {
    }
}

eachdir.description = 'Performs actions on each sub folder of the specified folder';
eachdir.consumes = ['src'];
eachdir.produces = ['cwd', 'dir'];

module.exports = eachdir;