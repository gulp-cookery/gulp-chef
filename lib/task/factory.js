/* eslint consistent-this: 0 */
'use strict';

var _ = require('lodash');
var log = require('gulp-util').log;

var Configuration = require('../configuration');
var metadata = require('./metadata');

function ConfigurableTaskFactory(recipes, registry, settings) {
	this.recipes = recipes;
	this.registry = registry;
	this.settings = settings;
}

function isVisible(task) {
	return task.visibility === Configuration.CONSTANT.VISIBILITY.NORMAL || !('visibility' in task);
}

function isDisabled(task) {
	return task.visibility === Configuration.CONSTANT.VISIBILITY.DISABLED;
}

ConfigurableTaskFactory.prototype.one = function (prefix, rawConfig, parentConfig) {
	var self, recipes, taskInfo;

	self = this;
	recipes = this.recipes;

	taskInfo = Configuration.getTaskRuntimeInfo(rawConfig);
	if (isDisabled(taskInfo)) {
		return null;
	}

	return simple() || composite() || reference() || implicit() || none();

	function simple() {
		var recipe, configs;

		recipe = recipes.inline(taskInfo) || recipes.reference(taskInfo) || recipes.plugin(taskInfo) || recipes.task(taskInfo);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
			return self.create(prefix, taskInfo, configs.taskConfig, recipe);
		}
	}

	function reference() {
		var recipe, configs, tasks;

		recipe = recipes.reference(taskInfo);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
			if (!taskInfo.name && !taskInfo.visibility) {
				taskInfo.visibility = '.';
			}
			return self.create(prefix, taskInfo, configs.taskConfig, recipe, tasks);
		}
	}

	function composite() {
		var recipe, configs, tasks;

		recipe = recipes.stream(taskInfo) || recipes.flow(taskInfo);
		if (recipe) {
			configs = Configuration.sort(taskInfo, rawConfig, parentConfig, recipe.schema);
			// hide explicit composite task by default for simplicity.
			if (!taskInfo.visibility) {
				taskInfo.visibility = '.';
			}
			tasks = createTasks(configs);
			return self.create(prefix, taskInfo, configs.taskConfig, recipe, tasks);
		}
	}

	function implicit() {
		var configs, recipe, tasks;

		configs = Configuration.sort(taskInfo, rawConfig, parentConfig);
		tasks = createTasks(configs);
		// NOTE: must call gulp's series or parallel to profile task's running time.
		if (Array.isArray(taskInfo.task)) {
			recipe = function (done) {
				var fn;

				fn = this.gulp.series.apply(null, tasks);
				return fn.apply(this, done);
			};
			recipe.displayName = '<series>';
		} else {
			recipe = function (done) {
				var fn;

				fn = this.gulp.parallel.apply(null, tasks);
				return fn.apply(this, done);
			};
			recipe.displayName = '<parallel>';
		}
		return self.create(prefix, taskInfo, configs.taskConfig, recipe);
	}

	function none() {
		log('configure', "warning: can't infer to a proper recipe task: " + taskInfo.name);
		return null;
	}

	function createTasks(configs) {
		var tasksPrefix, tasks;

		tasks = configs.taskInfo.parallel || configs.taskInfo.series || configs.taskInfo.task;
		if (tasks || _.size(configs.subTaskConfigs)) {
			tasksPrefix = _tasksPrefix();
			tasks = tasks || configs.subTaskConfigs;
			tasks = self.multiple(tasksPrefix, tasks, configs.taskConfig);
			return tasks;
		}

		function _tasksPrefix() {
			return isVisible(configs.taskInfo) ? prefix + configs.taskInfo.name + ':' : prefix;
		}
	}
};

ConfigurableTaskFactory.prototype.multiple = function (prefix, subTaskConfigs, parentConfig) {
	var self;

	self = this;
	return (array() || arrayify()).reduce(function (result, config) {
		var task;

		task = self.one(prefix, config, parentConfig);
		if (task) {
			result.push(task);
		}
		return result;
	}, []);

	function array() {
		if (Array.isArray(subTaskConfigs)) {
			return _.flatten(subTaskConfigs).map(objectify);
		}

		function objectify(value) {
			if (_.isPlainObject(value)) {
				value.name = value.name || 'anonymous';
				return value;
			}
			if (typeof value === 'string') {
				return {
					task: value
				};
			}
			if (typeof value === 'function') {
				return {
					task: value
				};
			}
			// array etc.
			return {
				task: value
			};
		}
	}

	function arrayify() {
		if (_.isPlainObject(subTaskConfigs)) {
			return _.map(subTaskConfigs, objectify)	// NOTE: becomes an array
				.sort(comparator);
		}
		return [{
			task: subTaskConfigs
		}];

		function objectify(value, name) {
			if (_.isPlainObject(value)) {
				value.name = name;
				return value;
			}
			return {
				name: name,
				task: value
			};
		}

		// tasks not defined "order" property defaults to 0
		function comparator(a, b) {
			return (a.order || 0) - (b.order || 0);
		}
	}
};

ConfigurableTaskFactory.prototype.create = function (prefix, taskInfo, taskConfig, recipe, tasks) {
	var name;

	var registry = this.registry;

	// make sure config is inherited at config time and injected, realized at runtime.
	// invoked from stream processor
	var run = function (done) {
		var context;

		context = this;
		// inject and realize runtime configuration.
		context.config = Configuration.realize(taskConfig, context.config);
		return recipe.call(context, done);
	};
	// invoked from gulp
	var configurableTask = function (done) {
		var context;

		// NOTE: gulp 4.0 task are called on undefined context. So we need gulp reference from registry here.
		// see: [Gulp 4: invoke task on gulp context](https://github.com/gulpjs/gulp/issues/1377)
		context = {
			gulp: registry.gulp,
			config: taskConfig,
			helper: Configuration
		};
		if (configurableTask.tasks) {
			context.tasks = configurableTask.tasks;
		}
		return run.call(context, done);
	};

	name = taskInfo.name || recipe.displayName || recipe.name || '<anonymous>';
	run.schema = configurableTask.schema;
	configurableTask.displayName = run.displayName = prefix + name;
	set(configurableTask, 'description', taskInfo.description || recipe.description);
	set(configurableTask, 'visibility', taskInfo.visibility);
	set(configurableTask, 'runtime', taskInfo.runtime);
	set(configurableTask, 'tasks', tasks);
	configurableTask.recipe = recipe;
	configurableTask.run = run;
	configurableTask.config = taskConfig;
	// TODO: also keep raw config for problem diagnosis?
	if (isVisible(configurableTask)) {
		this.registry.set(prefix + name, configurableTask);
		metadata.set(configurableTask, prefix + name);
	} else {
		metadata.set(configurableTask, name);
	}
	metadata.tree(configurableTask, tasks);
	return configurableTask;

	function set(target, property, value) {
		if (typeof value !== 'undefined') {
			target[property] = value;
		}
	}
};

module.exports = ConfigurableTaskFactory;
