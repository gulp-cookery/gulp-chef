# configurable-gulp-recipes (Alpha)

Gulp 4.0 recipes ready to use and configurable.

## Install
```
$ npm install --save-dev https://github.com/amobiz/configurable-gulp-recipes.git
```

## Terminology

### Gulp Task

Starting from gulp 4.0, a normal gulp task takes `undefined` as context,
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
Configurations come from the json that passed to `configure()` function.
```
function configurableTask(done) {
}
```

You don't write a configurable task function, instead, you create a configurable task by defining a configuration, and call `configure()` function.
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

Tasks can be nested. Sub tasks lexically inherits its parent's configurations. And even better, for some predefined properties, e.g. `src`, `dest`, paths are joined automatically.
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
This creates __3__ configurable tasks for you: "`build`", "`build:scripts`" and "`build:styles`".

When you run `build`, its sub tasks `scripts` and `styles` will be executed in __parallel__, and be called with configurations like this:
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
If you want sub tasks executed in __series__, you can use `series` "flow controller", and add `order` property to them:
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

There are 3 kinds of recipes: "task", "stream processor" and "flow controller".

If you write recipes only for your own project use, you can put them in sub folders within your project's root folder:

type            |folder
----------------|------------------
task            |gulp, gulp/tasks
stream processor|gulp/streams
flow controller |gulp/flows

If you willing to share your recipes, you can write them as plugins. Check out [Write Plugins] for how.

If your recipes do not need configuration, you can write them just as normal gulp tasks. That is, your existing gulp tasks are already reusable recipes! You just need to put them in a standalone module file separately, and put to the "gulp" folder within your project's root folder.

To use your existing recipe, write a configuration with a property name same as your recipe's module name.
For example, say you have your "my-recipe.js" recipe in `<your-project>/gulp` folder. Write a configuration to reference it:
```
var recipes = configure({
	"my-recipe": {}
});
```
Then you can run it by executing `gulp my-recipe` from console.

However, configurations helps maximizing the reusability of recpies. A configurable task runner takes its configurations via its execution context, i.e., `this` variable.
```
function scripts(done) {
	var gulp = this.gulp,
		config = this.config;

	return gulp.src(config.src)
		.pipe(eslint())
		.pipe(concat())
		.pipe(uglify())
		.pipe(gulp.dest(config.dest));
}

module.exports = scripts;
```

## Task

### clean

### copy

### help




## Stream Processor

### merge

### queue

### pipe




## Flow Controller

### parallel

### series

### watch


## Write Plugins
