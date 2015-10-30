'use stricts';
var gulp;

var flatten = require('gulp-flatten');
var merge = require('merge-stream');
var path = require('path');
var _ = require('lodash');

var safeRequireDir = require('./util/safe_require_dir');

var ConfigurableRunnerRegistry = require('./core/configurable_runner_registry');
var ConfigurableRunner = require('./core/configurable_runner');
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
	return new ConfigurableRunnerRegistry(tasks);
}

function createGulpTasks(prefix, subTasks, parentConfig) {
    var tasks = [];

    _.keys(subTasks).forEach(function(name) {
        var task = createGulpTask(prefix, name, subTasks[name], parentConfig);
        if (task) {
            tasks.push(task);
        }
    });
    return tasks;
}

function createGulpTask(prefix, name, taskConfig, parentConfig) {
	var taskInfo, task;

	taskInfo = ConfigurableTask.getTaskRuntimeInfo(name);

	if (taskConfig.debug) {
		debugger;
	}

	if (taskInfo.visibility === ConfigurableTask.CONSTANT.VISIBILITY.DISABLED) {
		return null;
	}

	task = createConfigurableRunner(prefix, taskInfo, taskConfig, parentConfig);
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

function createConfigurableRunner(prefix, taskInfo, taskConfig, parentConfig) {
    var configs, schema, consumes, configurableRunner;

    schema = getTaskSchema(taskInfo.name);
    consumes = getTaskConsumes(taskInfo.name);

    if (schema) {
        configs = Configuration.sort(taskConfig, parentConfig, schema);
    } else {
        configs = Configuration.sort_deprecated(taskConfig, parentConfig, consumes);
    }

	configurableRunner = recipeRunner() || streamRunner() || referRunner() || defaultRunner();
    return createConfigurableTask(taskInfo, configs.taskConfig, configurableRunner);

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
				return ConfigurableRunner.createReferenceTaskRunner(task);
			}
		}

		function parallelRunner() {
			if (Array.isArray(task)) {
				return ConfigurableRunner.createParallelTaskRunner(task);
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
function createConfigurableTask(taskInfo, taskConfig, configurableRunner) {
    // invoked from stream processor
    var run = function(gulp, injectConfig, stream, done) {
        // inject and realize runtime configuration.
        var config = Configuration.realize(taskConfig, injectConfig, configurableRunner.defaults);
        return configurableRunner(gulp, config, stream, done);
    };
    // invoked from gulp
    var configurableTask = function(done) {
        return run(this, taskConfig, null, done);
    };
    configurableTask.displayName = taskInfo.name;
    configurableTask.description = taskConfig.description || configurableRunner.description;
    configurableTask.config = taskConfig;
    configurableTask.visibility = taskInfo.visibility;
    configurableTask.runtime = taskInfo.runtime;
    configurableTask.run = run;
    return configurableTask;
}

function createStreamTaskRunner(taskInfo, taskConfig, prefix, subTasks) {
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

    tasks = createGulpTasks(prefix, subTasks, taskConfig);

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
