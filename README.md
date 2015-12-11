# configurable-gulp-recipes (Alpha)

Gulp 4.0 recipes ready to use and configurable. An elegant, intuition way to reuse gulp tasks.

## Install
```
$ npm install --save-dev https://github.com/amobiz/configurable-gulp-recipes.git
```

## Terminology

### Gulp Task

Starting from gulp 4.0, a gulp task takes `undefined` as context, and returns stream / promise, or call `done()` callback when finished.
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

A configurable task has signature same as normal gulp task, and can be used just as a normal gulp task. But, were called with an object: `{ gulp, config, upstream }` as context.
```
function configurableTask(done) {
}
```

You don't write configurable tasks, instead, you create a configurable task by defining a configuration, and call `configure()` function.
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
This generates a configurable task called "`scripts`" for you, and can be accessed via`recipes.get('scripts')`. The configurable task will be called with the configuration defined with it, some kind of like this:
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

#### Nesting Task

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

#### Parallel Tasks

In the above example, when you run `build`, its sub tasks `scripts` and `styles` will be executed in __parallel__, and be called with configurations like this:
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

#### Series Tasks

If you want sub tasks be executed in __series__, you can use `series` "flow controller", and add `order` property to them:
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

#### Referencing Task

You can reference other task by its name.
```
var recipes = configure({
	src: 'src',
	dest: 'dist',
	clean: {},
	scripts: {
		src: '**/*.js'
	},
	styles: {
		src: '**/*.css'
	},
	build: ['clean', ['scripts', 'styles']]
};
```

Referencing tasks won't generate new task names, so you can't run them in console. In this example, only `clean`, `scripts`, `styles` and `build` task were generated.

As said previously, sub tasks lexically inherits its parent's configurations, since refered tasks are not defined under the referencing task, they won't inherit its static configuration. However, dynamic generated configurations are still injected to refered tasks. See [Dynamic Configuration] for detail.

Note in the above example, `scripts` and `styles` are in array, so they will be executed in series. You can use `parallel` "flow controller" to change this default behavior.
```
var recipes = configure({
	src: 'src',
	dest: 'dist',
	clean: {},
	scripts: {
		src: '**/*.js'
	},
	styles: {
		src: '**/*.css'
	},
	build: ['clean', { parallel: ['scripts', 'styles'] }]
};
```

Or you can put them into a common parent, so they will be executed parallel by default. To reference sub tasks, use their full name.
```
var recipes = configure({
	src: 'src',
	dest: 'dist',
	clean: {},
	make: {
		scripts: {
			src: '**/*.js'
		},
		styles: {
			src: '**/*.css'
		}
	},
	build: ['clean', 'make'],
	watch: ['make:scripts', 'make:styles']
});
```

You can use `task` property to specify the referred tasks, so referencing tasks can have their own configurations.
```
var recipes = configure({
	src: 'src',
	dest: 'dist',
	clean: {},
	make: {
		scripts: {
			src: '**/*.js'
		},
		styles: {
			src: '**/*.css'
		}
	},
	build: ['clean', 'make'],
	watch: {
	options: {
		usePolling: true
	},
	task: ['make:scripts', 'make:styles']
	}
};
```

#### Plain / Inline Function
Tasks can be plain Javascript functions and be referenced directly, or can be defined inline and be referenced by name.
```
function clean(done) {
	del(this.dest.path, done);
}

var recipes = configure({
	src: 'src',
	dest: 'dist',
	scripts: function (done) {
	},
	styles: function (done) {
	},
	build: [clean, { parallel: ['scripts', 'styles'] }]
};
```
Note in this example, since `clean` was never defined in configuration, it is never exposed, i.e., can't be run in CLI. The other thing to note is that even plain functions are called in the `{ gulp, config, upstream }` context.

You can use `task` property to specify the plain/inline functions, so referencing tasks can have their own configurations too.
```
function clean(done) {
	del(this.dest.path, done);
}

var recipes = configure({
	src: 'src',
	dest: 'dist',
	make: {
		scripts: {
			src: '**/*.js,
			task: function (done) {
			}
		},
		styles: {
			src: '**/*.css,
			task: function (done) {
			}
		}
	},
	build: {
	options: {
		usePolling: true
	},
	task: [clean, 'make']
	}
};
```

#### Invisible Task
Do not expose a task to CLI and can't be referenced, without affacting its sub tasks. Since it's invisible, its sub tasks won't prefix it's name, but still inherit its configuration. A invisible task is still functional if invoked from its parent task.
```
var recipes = configure({
	src: 'src',
	dest: 'dist',
	scripts: {
		'.concat': {
			hidden: true,
			file: 'bundle.js',
			src: 'lib',
			coffee: {
				src: '**/*.coffee
			},
			js: {
				src: '**/*.js
			}
		}
	}
};

```
In this example the `concat` task is invisible.

#### Disabled Task
Disable a task and all its sub tasks. Not defined at all.


#### Development / Production Mode


### Configurable Recipe

A configurable recipe is the actual function that do things, and also has signature same as normal gulp task. A configurable recipe is the actual __recipe__ you want to write and reuse. In fact, "configurable task" is simply a wrapper that calls "configurable recipe" with exactly the same name.
```
function configurableRecipe(done) {
}
```

There are 3 kinds of recipes: "task", "stream processor" and "flow controller".

If you write recipes only for your own project use, you can put them in sub folders within your project's root folder:

type            |folder
----------------|------------------
task            |gulp, gulp/tasks
stream processor|gulp/streams
flow controller |gulp/flows

If you willing to share your recipes, you can write them as plugins. Check out [Writing Plugins] for how.

If your recipes do not need configuration, you can write them just as normal gulp tasks. That is, your existing gulp tasks are already reusable recipes! You just need to put them in a standalone module file separately, and put to the "gulp" folder within your project's root folder.

To use your existing recipe, write a configuration with a property name exactly same as your recipe's module name.
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

	return gulp.src(config.src.globs)
		.pipe(eslint())
		.pipe(concat(config.file))
		.pipe(uglify())
		.pipe(gulp.dest(config.dest.path));
}

module.exports = scripts;
```
And can be configured as:
```
var recipes = configure({
	src: 'src',
	dest: 'dist',
	scripts: {
		src: '**/*.js',
		file: 'bundle.js'
	}
});
```

#### Dynamic Configuration / Template Variable Realizing

Some stream processors (e.g., "gulp-recipe-eachdir") programmatically modify and/or generate new configurations. The new configuratuin are injected to recipe's configuration at runtime. And templates with `${var}` syntax are realized with resolved variables.

#### Configuration Schema

Configurable-gulp-recipes uses "[json-normalizer](https://www.npmjs.com/package/json-normalizer)" to normalize json configuration. You can use it to support property alias, type convertion, default values, etc.

#### Development / Production Mode

Configurable recipes don't have to worry about development/production mode. Configurations are resolved for that specific mode already.

## Task

### clean

### copy

### help




## Stream Processor

A stream processor manipulates its sub tasks' input and/or output streams.

In the "Configurable Recipe" section, that said "configurable task" is simply a wrapper that calls "configurable recipe" with exactly the same name. That's not entirely true. Stream processor may not has the same name as "configurable task".

### merge
A merge stream processor creates a new stream, that ends only when all its sub tasks' stream ends.
See [merge-stream](https://www.npmjs.com/package/merge-stream) for details.

### queue
A queue stream processor creates a new stream, that pipe queued streams of its sub tasks progressively, keeping datas order.
See [streamqueue](https://www.npmjs.com/package/streamqueue) for details.

### pipe
Provides `gulp.pipe()` functionality. Pipe streams from one sub task to another.



## Flow Controller

### parallel

### series

### watch


## Writing Plugins
