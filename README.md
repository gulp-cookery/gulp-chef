# configurable-gulp-recipes (Alpha)

Gulp 4.0 recipes ready to use and configurable.


## Terminology

### Gulp Task

Start from gulp 4.0, a normal gulp task takes `undefined` as context,
and returns stream / promise, or call `done()` callback when finished.
```
function gulpTask(done) {
}
```

Normally, you define a task by calling `gulp.task()`:
```
function myTask(done) {
	// do things ...
	done();
}

gulp.task(myTask);
```

### Configurable Task

A configurable task has signature same as normal gulp task, and can be used just as a normal gulp task. But, were called with an object: `{ gulp, config, upstream }`as context.
Configs come from the json that passed to `configure()` function.
```
function configurableTask(done) {
}
```

You don't have to write a configurable task function, instead, you create a configurable task by defining a configuration, and call `configure()` function.
```
var gulp = require('gulp');
var configure = require('configurable-gulp-recipes');
var recipes = configure({
  scripts: {
    src: 'src/**/*.js',
    dest: 'dist'
  }
});
gulp.registry(recipes);
```
This creates a configurable task called "`scripts`" for you, and can be accessed via`recipes.get('scripts')`. The configurable task will be called with the configuration defined with it, some kind of like this:
```
scripts.call({
  gulp: gulp,
  config: {
    src: 'src/**/*.js',
    dest: 'dist'
  }
}, done);
```

Note the `configure()` function returns a registry, you can call `gulp.registry()` to register all available tasks in the registry.

Tasks can be nested. Sub tasks lexically inherits its parent's configurations. Even better, for some predefined properties, e.g. `src`, `dest`, paths are joined automatically.
```
var recipes = configure({
  src: 'src',
  dest: 'dist',
  build: {
	scripts: {
	  src: '**/*.js'
	},
	styles: {
	  src: '**/*.css'
	}
  }
});
```
This creates __3__ configurable tasks for you: "`build`", "`build:scripts`" and "`build:styles`". When you run `build`, its sub tasks `scripts` and `styles` will be executed in __parallel__, and be called with configurations like this:
```
scripts: {
  src: 'src/**/*.js',
  dest: 'dist'
}

styles: {
  src: 'src/**/*.css',
  dest: 'dist'
}
```
If you want sub tasks executed in __series__, you can use `series` "flow control", and add `order` property to them:
```
var recipes = configure({
  src: 'src',
  dest: 'dist',
  build: {
    series: {
	  scripts: {
	    src: '**/*.js',
	    order: 0
	  },
 	  styles: {
	    src: '**/*.css',
	    order: 1
      }
	}
  }
});
```
Or even simpler, just put sub task configurations in array:
```
var recipes = configure({
  src: 'src',
  dest: 'dist',
  build: [{
	name: 'scripts',
    src: '**/*.js'
  }, {
	name: 'styles',
    src: '**/*.css'
  }]
};
```

### Configurable Task Runner

A configurable task runner is the actual function that do things, and also has signature same as normal gulp task. A configurable task runner is the actual __recipe__ you want to write and reuse.
```
function configurableTaskRunner(done) {
}
```