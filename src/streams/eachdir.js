/*jshint node: true */
/**
 * References:
 * 
 * Generating a file per folder
 * https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-task-steps-per-folder.md
 */
var fs = require('fs');
var path = require('path');
var merge = require('merge-stream');
var gulp = require('gulp');

var Stream = require('stream');
var ConfigurationError = require('../errors/configuration_error.js');
var IllegalTaskError = require('../errors/illegal_task_error.js');

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

/**
 * @config 針對本 task 的 configuration。
 * @tasks 傳入的子 tasks 為 configurableTask，是尚未綁定 config 的 task 形式。
 *  
 */
function eachdir(taskConfig, subTasks) {
    var src, folders, streams;
    
    if (typeof taskConfig.src === 'function') {
        src = taskConfig.src.call(gulp, taskConfig);
    }
    else {
        src = taskConfig.src;
    }
    
    if (typeof src !== 'string') {
        throw ConfigurationError('configuration "src" is required and should be a string of folder name');
    }
    
    folders = getFolders(src);
    streams = folders.map(processFolder);
    return merge(streams);

    function processFolder(folder) {
        var subTaskConfig = {
            base: path.join(taskConfig.base || '', src, folder),
            dir: folder
        };
        var stream = subTasks.call(gulp, subTaskConfig, done);
        if (! (stream instanceof Stream)) {
            throw new IllegalTaskError('sub task must return a stream');
        }
        return stream;
    }
    
    function done() {
    }
}

function scripts(config) {
    var outfile = config.outputFile;
    return gulp.src(config.src)
        .pipe(concat(outfile + '.js'))
        .pipe(gulp.dest(config.dest))
        .pipe(uglify())
        .pipe(rename(outfile + '.min.js'))
        .pipe(gulp.dest(config.dest));
}

module.exports = eachdir;