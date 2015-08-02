/*jshint node: true */
/*global process: true*/
'use stricts';
var merge = require('merge-stream');
var through = require('through2');
var fs = require('fs');
var path = require('path');
var flatten = require('gulp-flatten');
var gulp = require('gulp');
var gulpIf = require('gulp-if');
var path = require('path');
var _ = require('lodash');

var globJoins = require('./util/glob_util');
var resolveVariables = require('./util/resolve_variables');
var safeRequireDir = require('./util/safe_require_dir');

var stuff = {
    // TODO: lazy require: don't use requireDir, load only names.
    filters: safeRequireDir(path.join(process.cwd(), 'gulp/filters'), './filters'),
    streams: safeRequireDir(path.join(process.cwd(), 'gulp/streams'), './streams'),
    recipes: safeRequireDir(path.join(process.cwd(), 'gulp'), path.join(process.cwd(), 'gulp/tasks'), './tasks')
};

var defaults = {
    config: {
        dest: 'dist'
    },
    consumes: [
        // task
        'depends', 'task', 'options', 
        // runtime
        'name', 'hidden', 'runtime',
        // src 
        'base', 'cwd', 'src',
        // dest 
        'dest', 'file', 'flatten'
    ]
};

function createGulpTasks(taskConfigs, globalConfig) {
    var configs = sortConfigs('', taskConfigs, globalConfig);
    createSubGulpTasks('', configs.subTaskConfigs, configs.taskConfig);
    gulp.task('help', helpTaskRunner);
}

/**
 * If both parentConfig and taskConfig specified src property
 * then try to join paths.
 */
function sortConfigs(name, taskConfig, parentConfig) {
    var inheritedConfig, subTaskConfigs, configurableTask, consumes;

    inheritedConfig = {};
    
    if (parentConfig.src && taskConfig.src) {
        inheritedConfig.src = globJoins(parentConfig.src, taskConfig.src);
    }
    if (parentConfig.dest && taskConfig.dest) {
        // force dest since it may not already exists (asumes dest always be a folder).
        inheritedConfig.dest = globJoins(parentConfig.dest, taskConfig.dest, true);
    }
    
    configurableTask = stuff.filters[name] || stuff.streams[name] || stuff.recipes[name];
    if (configurableTask) {
        consumes = configurableTask.consumes;
    }
    consumes = defaults.consumes.concat(consumes);

    inheritedConfig = _.defaults(inheritedConfig, taskConfig, parentConfig);
    inheritedConfig = _.pick(inheritedConfig, consumes);
    subTaskConfigs = _.omit(taskConfig, consumes);

    return {
        taskConfig: inheritedConfig,
        subTaskConfigs: subTaskConfigs
    };
}

function createSubGulpTasks(prefix, subTaskConfigs, parentConfig) {
    return _.keys(subTaskConfigs).map(function(name) {
        return _createGulpTask(name, subTaskConfigs[name]);
    });
    
    function _createGulpTask(name, taskConfig) {
        var taskInfo, task;
    
        if (name === '_eachdir') {
            debugger;
        }
    
        taskInfo = getTaskRuntimeInfo(name);
        task = createTaskRunner(prefix, taskInfo, taskConfig, parentConfig);
        console.log('creating task: ' + prefix + task.displayName);
        // TODO: call parallel for depends
        if (!task.hidden) { 
            gulp.task(prefix + task.displayName, taskConfig.depends || [], task);
        }
        return task;
    }
}

var regexRuntimeOptions = /^(~?)([-\w]+)([!?]?)$/;
function getTaskRuntimeInfo(name) {
    var match;

    name = _.trim(name);
    match = regexRuntimeOptions.exec(name) || [];
    return {
        name: match[2] || name,
        hidden: match[1] || '',
        runtime: match[3] || ''
    };
}

function createTaskRunner(prefix, taskInfo, taskConfig, parentConfig) {
    var configs, configurableRunner;
    
    configs = sortConfigs(taskInfo.name, taskConfig, parentConfig);
    
    // if there is configurations not being consumed, then treat them as subtasks.
    if (stuff.streams[taskInfo.name] || hasSubTaskConfig(configs.subTaskConfigs)) {
        configurableRunner = createStreamTaskRunner(prefix, taskInfo, configs.taskConfig, configs.subTaskConfigs);
    }
    else {
        configurableRunner = createSoloTaskRunner(taskInfo, configs.taskConfig);
    }

    return wrapTaskRunner(taskInfo, configs.taskConfig, configurableRunner);
}

function hasSubTaskConfig(subTaskConfigs) {
    return _.size(subTaskConfigs) > 0;
}

function createStreamTaskRunner(prefix, taskInfo, taskConfig, subTaskConfigs) {
    // TODO: remove stream runner form parent's config.
    var hidden, streamTask, tasks; 

    streamTask = stuff.streams[taskInfo.name];
    if (streamTask) {
        hidden = true;
        taskInfo.hidden = '~';
    }
    else {
        hidden = taskInfo.hidden;
        streamTask = stuff.streams['merge'];
    }
    if (!hidden) {
        prefix = prefix + taskInfo.name + ':';
    }
    
    tasks = createSubGulpTasks(prefix, subTaskConfigs, taskConfig);    

    return function(config /*, done*/) {
        return streamTask.call(gulp, config, tasks);
    };
}

function createSoloTaskRunner(taskInfo, taskConfig) {
    if (typeof taskConfig.task === 'string') {
        return function (done) {
            var task = gulp.task(taskConfig.task);
            return task.call(gulp, done);
        };
    }
    
    if (_.isArray(taskConfig.task)) {
        return function (done) {
            var tasks = Array.map(taskConfig.task, function(task) {
                return gulp.task(task);
            });
            return stuff.streams.parallel(tasks).call(gulp);
        };
    }
    
    if (typeof taskConfig.task === 'function') {
        return taskConfig.task;
    }

    return stuff.recipes[taskInfo.name] || copyConfigurableRunner;
}

// TODO: make sure config is inherited at config time and injectable at runtime.
function wrapTaskRunner(taskInfo, taskConfig, configurableRunner) {
    // invoked from stream processor
    var run = function(gulp, injectConfig, done) {
        //inject runtime configuration.
        var config = _.defaults({}, taskConfig, injectConfig);
        resolveVariables(config, injectConfig);
        return configurableRunner.call(gulp, config, done);
    };
    // invoked from gulp
    var task = function(done) {
        debugger;
        return run(this, taskConfig, done);
    };
    task.displayName = taskInfo.name;
    task.description = taskConfig.description || configurableRunner.description;
    task.config = taskConfig;
    task.hidden = taskInfo.hidden;
    task.runtime = taskInfo.runtime;
    task.run = run;
    return task;
}

// NOTE: 
// TaskRunner is ready for gulp.task() call.
// ConfigurableTask is called with config, and eventually be wrapped as TaskRunner. 
function helpTaskRunner(done) {
    Object.keys(gulp.tasks).sort().forEach(function (name) {
        var task = gulp.tasks[name];
        console.log(name);
        console.log(' ', task.fn.description || '(no description)');
        console.log('');
    });
    done();
}

function noopConfigurableRunner(config, done) {
    done();
}

function copyConfigurableRunner(config /*, done*/) {
    return gulp.src(config.src)
        .pipe(gulpIf(config.flatten, flatten()))
        .pipe(gulp.dest(config.dest));
}

module.exports = createGulpTasks;
