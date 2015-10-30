'use stricts';
var gulp;

var flatten = require('gulp-flatten');
var merge = require('merge-stream');
var path = require('path');
var _ = require('lodash');

var safeRequireDir = require('./util/safe_require_dir');

var ConfigurableTaskRegistry = require('./core/configurable_task_registry');
var ConfigurableTask = require('./core/configurable_task');
var Configuration = require('./core/configuration');
var defaults = require('./defaults');

var cwd = process.cwd();

var stuff = {
    flows: loadRegistry(path.join(cwd, 'gulp/flows'), './flows'),
    streams: loadRegistry(path.join(cwd, 'gulp/streams'), './streams'),
    recipes: loadRegistry(path.join(cwd, 'gulp'), path.join(cwd, 'gulp/tasks'), './tasks')
};

function loadRegistry() {
	var tasks = safeRequireDir.apply(null, arguments);
	return new ConfigurableTaskRegistry(tasks);
}

function createGulpTasks(prefix, subTaskConfigs, parentConfig) {
    var tasks = [];

    _.keys(subTaskConfigs).forEach(function(name) {
        var task = _createGulpTask(name, subTaskConfigs[name]);
        if (task) {
            tasks.push(task);
        }
    });
    return tasks;

    function _createGulpTask(name, taskConfig) {
        var taskInfo, task;

        taskInfo = ConfigurableTask.getTaskRuntimeInfo(name);

        if (taskConfig.debug) {
            debugger;
        }

        if (taskInfo.visibility === ConfigurableTask.CONSTANT.VISIBILITY.DISABLED) {
            return null;
        }

        task = createTaskRunner(prefix, taskInfo, taskConfig, parentConfig);
        //console.log('creating task: ' + prefix + task.displayName);
        // TODO: call parallel for depends and then remove it from taskConfig.
        if (!task.visibility) {
            // TODO: warning about name collision.
            // TODO: what about the exec order of task's depends and depends' depends?
            // TODO: what about hidden task's depends?
            gulp.task(prefix + task.displayName, taskConfig.depends || [], task);
        }
        return task;
    }
}

function createTaskRunner(prefix, taskInfo, taskConfig, parentConfig) {
    var configs, schema, consumes, configurableRunner;

    schema = getTaskSchema(taskInfo.name);
    consumes = getTaskConsumes(taskInfo.name);

    if (schema) {
        configs = Configuration.sort(taskConfig, parentConfig, schema);
    } else {
        configs = Configuration.sort_deprecated(taskConfig, parentConfig, consumes);
    }

	configurableRunner = recipeRunner() || streamRunner() || referRunner() || defaultRunner();
    return wrapTaskRunner(taskInfo, configs.taskConfig, configurableRunner);

	/**
	 * if there is a matching recipe, use it and ignore any sub-configs.
	 */
	function recipeRunner() {
		if (isRecipeTask(taskInfo.name)) {
			if (hasSubTasks(configs.subTasks)) {
				// TODO: warn about ignoring sub-configs.
			}
			return stuff.recipes.lookup(taskInfo.name);
		}

		function isRecipeTask(name) {
			return !!stuff.recipes.lookup(name);
		}
	}

	/**
	 * if there is configurations not being consumed, then treat them as sub-tasks.
	 */
	function streamRunner() {
		if (isStreamTask(taskInfo.name, configs.subTasks)) {
			return createStreamTaskRunner(taskInfo, configs.taskConfig, prefix, configs.subTasks);
		}

		function isStreamTask(name, subTaskConfigs) {
			return !!stuff.streams.lookup(name) || hasSubTasks(subTaskConfigs);
		}
	}

	function referRunner() {
		var task = configs.taskSettings.task;
		delete configs.taskSettings.task;
		return inlineRunner() || referenceRunner() || parallelRunner();

		function inlineRunner() {
			if (typeof task === 'function') {
				return task;
			}
		}

		function referenceRunner() {
			if (typeof task === 'string') {
				return ConfigurableTask.createReferenceTaskRunner(task);
			}
		}

		function parallelRunner() {
			if (Array.isArray(task)) {
				return ConfigurableTask.createParallelTaskRunner(task);
			}
		}
	}

	function defaultRunner() {
		return stuff.recipes.lookup('copy');
	}
}


function getTaskSchema(name) {
    var schema;
    var configurableTask = stuff.streams.lookup(name) || stuff.recipes.lookup(name);
    if (configurableTask) {
        schema = configurableTask.schema;
    }
    return schema;
}

function getTaskConsumes(name) {
    var consumes = defaults.consumes;
    var configurableTask = stuff.streams.lookup(name) || stuff.recipes.lookup(name);
    if (configurableTask) {
        consumes = consumes.concat(configurableTask.consumes);
    }
    return consumes;
}

function hasSubTasks(subTasks) {
    return _.size(subTasks) > 0;
}

// TODO: make sure config is inherited at config time and injectable at runtime.
function wrapTaskRunner(taskInfo, taskConfig, configurableRunner) {
    // invoked from stream processor
    var run = function(gulp, injectConfig, stream, done) {
        //inject runtime configuration.
        var config = Configuration.realize(taskConfig, injectConfig, configurableRunner.defaults);
        return configurableRunner(gulp, config, stream, done);
    };
    // invoked from gulp
    var task = function(done) {
        debugger;
        return run(this, taskConfig, null, done);
    };
    task.displayName = taskInfo.name;
    task.description = taskConfig.description || configurableRunner.description;
    task.config = taskConfig;
    task.visibility = taskInfo.visibility;
    task.runtime = taskInfo.runtime;
    task.run = run;
    return task;
}

function createStreamTaskRunner(taskInfo, taskConfig, prefix, subTaskConfigs) {
    // TODO: remove stream runner form parent's config.
    var hidden, streamTask, tasks;

    streamTask = stuff.streams.lookup(taskInfo.name);
    if (streamTask) {
        hidden = true;
        taskInfo.visibility = ConfigurableTask.CONSTANT.VISIBILITY.HIDDEN;
    } else {
        hidden = !!taskInfo.visibility;
        streamTask = stuff.streams.lookup('merge');
    }
    if (!hidden) {
        prefix = prefix + taskInfo.name + ':';
    }

    tasks = createGulpTasks(prefix, subTaskConfigs, taskConfig);

    return function(gulp, config, stream /*, done*/ ) {
        return streamTask(gulp, config, stream, tasks);
    };
}

module.exports = function (useGulp, taskConfigs) {
	gulp = useGulp;

	var configs = Configuration.sort(taskConfigs, {}, {});
	createGulpTasks('', configs.subTasks, configs.taskConfig);
	gulp.task('help', require('./task_helper')(useGulp));
};
