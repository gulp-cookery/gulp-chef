'use strict';

var Sinon = require('sinon');
var _ = require('lodash');

var FakeGulp = require('./gulp');

function createSpyGulpTask(name, gulpTask) {
	var task = Sinon.spy(gulpTask);
	task.displayName = name;
	return task;
}

function createSpyConfigurableTask(name, configurableRunner, taskConfig) {
	var run, task;
	configurableRunner = configurableRunner || Sinon.spy();
	taskConfig = taskConfig || {};
	run = Sinon.spy(function (gulp, config, stream, done) {
		config = _.defaultsDeep([], taskConfig, config);
		configurableRunner(gulp, config, stream, done);
	});
	task = createSpyGulpTask(name, function (done) {
		run(this, taskConfig, null, done);
	});
	task.displayName = name;
	task.run = run;
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
