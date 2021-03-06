'use strict';

var Sinon = require('sinon');
var _ = require('lodash');

var FakeGulp = require('./gulp');

function createSpyGulpTask(name, gulpTask) {
	var task;

	task = Sinon.spy(gulpTask);
	task.displayName = name;
	return task;
}

function createSpyConfigurableTask(name, optionalRecipe, optionalTaskConfig) {
	var task, recipe, taskConfig;

	recipe = optionalRecipe || Sinon.spy();
	taskConfig = optionalTaskConfig || {};
	task = createSpyGulpTask(name, function (done) {
		var context;

		context = {
			config: this ? _.defaultsDeep({}, taskConfig, this.config) : taskConfig
		};
		recipe.call(context, done);
	});
	task.displayName = name;
	return task;
}

function createFakeGulp() {
	var gulp, gulpTask, configurableTask, configurableTaskConfig, configurableTaskRefConfig;

	gulp = new FakeGulp();

	// task: gulp-task
	gulpTask = createSpyGulpTask('gulp-task');
	gulp.task(gulpTask);

	// task: configurable-task
	configurableTaskConfig = { keyword: 'configurable-task' };
	configurableTask = createSpyConfigurableTask('configurable-task', Sinon.spy(), configurableTaskConfig);
	gulp.task(configurableTask);

	// task: gulp-task-by-ref
	gulp.task(createSpyGulpTask('gulp-task-by-ref'));

	// task: configurable-task-by-ref
	configurableTaskRefConfig = { keyword: 'configurable-task-by-ref' };
	gulp.task(createSpyConfigurableTask('configurable-task-by-ref', Sinon.spy(), configurableTaskRefConfig));

	return gulp;
}

module.exports = {
	createSpyGulpTask: createSpyGulpTask,
	createSpyConfigurableTask: createSpyConfigurableTask,
	createFakeGulp: createFakeGulp
};
