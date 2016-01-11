'use strict';

var gulp = require('gulp');
var chef = require('gulp-chef');

var prepare = function (courses) {
  return each(Object.assign(courses, { default: 'intro' }));

  function each(items) {
    return Object.keys(items).reduce(function (ret, name) {
      var item, task, msg;

      item = items[name];
      if (item.msg) {
        msg = print(item.msg);
        delete item.msg;
        item.intro = msg;
        task = each(item);
      } else {
        task = print(item);
      }
      ret[name] = task;
      return ret;
    }, {});
  }

  function print(messages) {
    return function (done) {
      console.log(Array.isArray(messages) ? messages.join('\n') : messages);
      done();
    };
  }
};

var COURSES = {
  intro: [
    'Hello Chef!',
    'First time running gulp-chef interactive course?',
    'Run `gulp --tasks` for available tasks.',
    'And then run `gulp  <task-name>` for whatever you would like to know about.'
  ],
  configuration: {
    msg: [
      'TODO: intro about the relationship between recipe and task name.',
      ''
    ],
    recipe: [
    ],
    glob: [
      'TODO: print transformed configuration for all use case.',
      ''
    ],
    path: [
      'TODO: print transformed configuration for all use case.',
      ''
    ],
    casscading: [
      'TODO: show how the parent configuration inherited by child.',
      ''
    ],
    _task_: [
      '',
      ''
    ]
  },
  'build-in-recipes': [
    '',
    ''
  ],
  'writing-recipe': [
    '',
    ''
  ],
  api: [
    '',
    ''
  ],
  keywords: [
    '',
    ''
  ],
  cli: [
    '',
    ''
  ]
};

var recipes, meal;

recipes = prepare(COURSES);
meal = chef(recipes, { exposeWithPrefix: 'always' });
gulp.registry(meal);
