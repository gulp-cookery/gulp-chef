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

function createConfigurableTasks(prefix, subTasks, parentConfig) {
    var tasks = [];

    _.keys(subTasks).forEach(function(name) {
        var task = createConfigurableTask(prefix, name, subTasks[name], parentConfig);
        if (task) {
            tasks.push(task);
        }
    });
    return tasks;
}

function createConfigurableTask(prefix, name, taskConfig, parentConfig) {
	var schema, consumes, configs, taskInfo, runner, task;

	taskInfo = ConfigurableTask.getTaskRuntimeInfo(name);

	if (taskConfig.debug) {
		debugger;
	}

	if (taskInfo.visibility === ConfigurableTask.CONSTANT.VISIBILITY.DISABLED) {
		return null;
	}

	schema = getTaskSchema(taskInfo.name);
	consumes = getTaskConsumes(taskInfo.name);

	if (schema) {
		configs = Configuration.sort(taskConfig, parentConfig, schema);
	} else {
		configs = Configuration.sort_deprecated(taskConfig, parentConfig, consumes);
	}
	runner = createConfigurableRunner(prefix, taskInfo, configs);
	task = ConfigurableTask.createConfigurableTask(taskInfo, configs.taskConfig, runner);

	// TODO: call parallel for depends and then remove it from taskConfig.
	if (!task.visibility) {
		// TODO: warning about name collision.
		// TODO: what about the exec order of task's depends and depends' depends?
		// TODO: what about hidden task's depends?
		gulp.task(prefix + task.displayName, taskConfig.depends || [], task);
	}
	return task;
}

function createConfigurableRunner(prefix, taskInfo, configs) {
	return recipeRunner() || streamRunner() || taskRunner() || defaultRunner();

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
			return ConfigurableRunner.createStreamTaskRunner(taskInfo, configs.taskConfig, prefix, configs.subTasks, stuff.streams, createConfigurableTasks);
		}

		function isStreamTask(name, subTaskConfigs) {
			return !!stuff.streams.lookup(name) || hasSubTasks(subTaskConfigs);
		}
	}

	function taskRunner() {
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

function createHelpGulpTask(gulp) {
	gulp.task('help', require('./task_helper')(gulp));
}

module.exports = function (useGulp, taskConfigs) {
	gulp = useGulp;

	var configs = Configuration.sort(taskConfigs, {}, {});
	createConfigurableTasks('', configs.subTasks, configs.taskConfig);
	createHelpGulpTask(useGulp);
};
