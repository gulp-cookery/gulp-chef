/*jshint node: true */
'use stricts';
var requireDir = require('require-dir');
var merge = require('merge-stream');
var flatten = require('gulp-flatten');
var gulpIf = require('gulp-if');
var gulp = require('gulp');
var path = require('path');
var _ = require('lodash');

var stuff = {
    filters: requireDir('./filters'),
    streams: requireDir('./streams'),
    configurableTasks: requireDir('./tasks')
};

var defaults = {
    config: {
        src: 'src',
        dest: 'dist'
    },
    omit: ['depends', 'task', 'eachdir', 'base', 'cwd', 'src', 'dest', 'file', 'flatten']
};

function createGulpTasks(taskConfigs, globalConfig) {
    createSubGulpTasks('', taskConfigs, globalConfig);
    gulp.task('help', helpTaskRunner);
}

function createSubGulpTasks(prefix, taskConfig, parentConfig) {
    var tasks, inheritedConfig;

    inheritedConfig = inheritConfig(parentConfig, taskConfig);
        
    tasks = [];
    _.forOwn(_.omit(taskConfig, defaults.omit), function(config, name) {
        var taskInfo, taskRunner;
        taskInfo = parseTaskRuntimeOptions(name);        
        taskRunner = createTaskRunner(taskInfo.name, config, inheritedConfig);        
        if (taskRunner) {
            //console.log('creating task: ' + prefix + taskInfo.name);
            gulp.task(prefix + taskInfo.name, config.depends || [], taskRunner);
            tasks.push(taskRunner);
        }
    });
    
    return tasks;
}


var regexRuntimeOptions = /^(~?)([-\w]+)([!?]?)$/;
function parseTaskRuntimeOptions(name) {
    var match;
    
    name = _.trim(name);
    match = regexRuntimeOptions.exec(name) || [];
    return {
        name: match[2] || name,
        hidden: match[1] || '',
        runtime: match[3] || ''
    };
}

function inheritConfig(taskConfig, parentConfig) {
    var inheritedConfig;
    
    inheritedConfig = _.extend({}, parentConfig, taskConfig);
    inheritedConfig = _.omit(inheritedConfig, defaults.omit);
    return inheritedConfig;
}

function createTaskRunner(name, taskConfig, parentConfig) {
    var tasks;
    
    if (stuff.streams[name]) {
        tasks = createSubGulpTasks(name, taskConfig, parentConfig);
        return createStreamTaskRunner(stuff.streams[name], tasks, taskConfig, parentConfig);
    }
    else if (taskConfig.src || taskConfig.task || stuff.configurableTasks[name]) {
    //else if (taskConfig.task || stuff.configurableTasks[name]) {
        return createSoloTaskRunner(name, taskConfig, parentConfig);
    }
    return createMergeTaskRunner(name, taskConfig, parentConfig);
}

function createStreamTaskRunner(streamTask, tasks, taskConfig, parentConfig) {
}

function createSoloTaskRunner(name, taskConfig, parentConfig) {
    var configurableTask, taskRunner, inheritedConfig;

    inheritedConfig = inheritConfig(parentConfig, taskConfig);

    if (typeof taskConfig.task === 'string') {
        taskRunner = function(done) {
            gulp.start(taskConfig.task, done);
        };
    }
    else if (_.isArray(taskConfig.task)) {
        taskRunner = function(done) {
            var tasks = _.clone(taskConfig.task);
            tasks.push(done);
            gulp.start.apply(gulp, tasks);
        };
    }
    else {
        if (typeof taskConfig.task === 'function') {
            configurableTask = taskConfig.task;
        }
        else {
            configurableTask = stuff.configurableTasks[name] || configurableCopyTask;
        }
        taskRunner = function(done) {
            return configurableTask.call(gulp, inheritedConfig, done);
        };
    }
    
    taskRunner.description = taskConfig.description || configurableTask ? configurableTask.description : '';
    return taskRunner;
}

function createMergeTaskRunner(name, taskConfig, parentConfig) {
    var taskRunner, tasks, prefix;

    prefix = name + ':';
    tasks = createSubGulpTasks(prefix, taskConfig, parentConfig);
    if (tasks.length > 1) {
        taskRunner = function() {
            return merge(_.map(tasks, function(task) {
                return task.call(gulp);
            }));
        };
    }
    else {
        taskRunner = tasks[0] || noopTaskRunner;
    }
    taskRunner.description = taskConfig.description || taskRunner.description;
    return taskRunner;
}

// NOTE: 
// TaskRunner is ready for gulp.task() call.
// ConfigurableTask is called with config, and eventually be wrapped as TaskRunner. 
function helpTaskRunner(done) {
    Object.keys(gulp.tasks).sort().forEach(function(name) {
        var task = gulp.tasks[name];
        console.log(name);
        console.log(' ', task.fn.description || '(no description)');
        console.log('');
    });
    done();
}

function noopTaskRunner(done) {
    done();
}

function configurableCopyTask(config) {
    return gulp.src(config.src)
        .pipe(gulpIf(config.flatten, flatten()))
        .pipe(gulp.dest(config.dest));
}

module.exports = createGulpTasks;
