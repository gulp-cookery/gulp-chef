# gulp-chef

Cascading configurable recipes for Gulp 4.0. An elegant, and intuition way to reuse gulp tasks.

This project is still in early development stage and likely has some bugs at the moment. Let me know how it works for you!

## Getting Started

### Install gulp cli 4.0 globally
``` bash
npm install -g "gulpjs/gulp-cli#4.0"
```

### Install gulp 4.0 in your project's devDependencies
``` bash
npm install --save-dev "gulpjs/gulp#4.0"
```

See this [tutorial](http://blog.reactandbethankful.com/posts/2015/05/01/how-to-install-gulp-4/) for detailed installation instructions.

### Install gulp-chef in your project's devDependencies
``` bash
$ npm install --save-dev gulp-chef
```

### Create a gulpfile.js at the root of your project

``` jsavascript
var gulp = require('gulp');
var chef = require('gulp-chef');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

function recipe() {
    return gulp.src(this.config.src.globs)
        .pipe(concat())
        .pipe(uglify())
        .pipe(gulp.dest(this.config.dest.path));
}

var ingredients = {
    src: 'src/**/*.js',
    dest: 'dist/',
    clean: {},
    build: recipe,
    default: ['clean', 'build']
};

var meals = chef(ingredients);

gulp.registry(meals);
```

### Run Gulp
``` bash
$ gulp
```

## Terminology

### Gulp Task
A gulp task is a plain JavaScript function that returns promises, observables, child processes or streams, or call `done()` callback when finished. Starting from gulp 4.0, a gulp task takes `undefined` as context.
``` javascript
function gulpTask(done) {
    assert(this === null);
    // do things ...
    done();
}
```

You register a gulp task using `gulp.task()` method, and then run it from CLI.
``` javascript
gulp.task(gulpTask);
```

``` bash
$ gulp gulpTask
```

### Configurable Task

A configurable task has signature same as normal gulp task, and can be used just as a normal gulp task. But, were called with an object: `{ gulp, config, upstream }` as context.
``` javascript
// Note: You don't write configurable task but configuration.
// The plugin generates configurable task for you.
function configurableTask(done) {
    done();
}
```

You don't write configurable tasks, instead, you create a configurable task by defining a configuration, and call `chef()` function.
``` javascript
var gulp = require('gulp');
var chef = require('gulp-chef');
var meals = chef({
    scripts: {
        src: 'src/**/*.js',
        dest: 'dist/'
    }
});
gulp.registry(meals);
```
This generates a configurable task called "`scripts`" for you, and can be accessed via `meals.get('scripts')`. The configurable task will be called with the configuration defined with it, some kind of like this:
``` javascript
scripts.call({
    gulp: gulp,
    config: {
        src: 'src/**/*.js',
        dest: 'dist/'
    }
}, done);
```

Note the `chef()` function returns a registry, you can call `gulp.registry()` to register all available tasks in the registry.

### Configurable Recipe

A configurable recipe is the actual function that do things, and also has signature same as normal gulp task. A configurable recipe is the actual __recipe__ you want to write and reuse. In fact, a "[configurable task](#Configurable_Task)" is simply a wrapper that calls "configurable recipe" with exactly the same name.
``` javascript
function configurableRecipe(done) {
    var gulp = this.gulp;
    var config = this.config;

    // do things ...
    done();
}
```

## Writing Configurations

### Nesting Task

Tasks can be nested. Sub tasks lexically (or so called "cascading") inherits its parent's configurations. And even better, for some predefined properties, e.g. "`src`", "`dest`", paths are joined automatically.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
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
This creates __3__ configurable tasks for you: `build`, `scripts` and `styles`.

### Parallel Tasks

In the above example, when you run `build`, its sub tasks `scripts` and `styles` will be executed in __parallel__, and be called with configurations like this:
``` javascript
scripts: {
    src: 'src/**/*.js',
    dest: 'dist/'
},
styles: {
    src: 'src/**/*.css',
    dest: 'dist/'
}
```

### Series Tasks

If you want sub tasks be executed in __series__, you can use "`series`" __flow controller__, and add "`order`" property to them:
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
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
However, if you forgot to use "`series`" __flow controller__, and just put "`order`" property, child tasks won't execute in series.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    build: {
		scripts: {
			src: '**/*.js',
			order: 0
		},
		styles: {
			src: '**/*.css',
			order: 1
		}
    }
});
```
In this example, `scripts` and `styles` task are executed in parallel.

There is a simpler way to execute child tasks in series: just put sub task configurations in an array:
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    build: [{
        name: 'scripts',
        src: '**/*.js'
    }, {
        name: 'styles',
        src: '**/*.css'
    }]
};
```

### Referencing Task

You can reference other task by its name.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    clean: {},
    scripts: {
        src: '**/*.js'
    },
    styles: {
        src: '**/*.css'
    },
    build: ['clean', 'scripts', 'styles']
};
```
Referencing tasks won't generate new task names, so you can't run them in console. In this example, only `clean`, `scripts`, `styles` and `build` task were generated.

As said previously, sub tasks lexically inherits its parent's configurations, since refered tasks are not defined under the referencing task, they won't inherit its static configuration. However, dynamic generated configurations are still injected to refered tasks. See [Dynamic Configuration](#Dynamic_Configuration) for detail.

Note in the above example, `clean`, `scripts`, and `styles` are in an array, so they will be executed in series. You can use "`parallel`" __flow controller__ to change this default behavior.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
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

Or you can put them into a common parent, so they will be executed in parallel by default.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    clean: {},
    make: {
        scripts: {
            src: '**/*.js'
        },
        styles: {
            src: '**/*.css'
        }
    },
    build: ['clean', 'make']
});
```

You can use "`task`" property to specify the referred tasks, so referencing tasks can have their own configurations.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
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
        task: ['scripts', 'styles']
    }
};
```

### Plain / Inline Function
Tasks can be a plain JavaScript functions and be referenced directly or defined inline anonymously.
``` javascript
function clean() {
    return del(this.config.dest.path);
}

var meals = chef({
    src: 'src/',
    dest: 'dist/',
    scripts: function (done) {
    },
    styles: function (done) {
    },
    build: [clean, { parallel: ['scripts', 'styles'] }]
};
```
Note in this example, since `clean` was never defined in configuration, it is never exposed, i.e., can't run in CLI. The other thing to note is that even plain functions are called in the `{ gulp, config, upstream }` context.

You can use "`task`" property to specify the plain/inline functions, so referencing tasks can have their own configurations too.
``` javascript
function clean() {
    return del(this.config.dest.path);
}

var meals = chef({
    src: 'src/',
    dest: 'dist/',
	clean: {
	    options: {
	        dryRun: true
	    },
		task: clean
	},
    make: {
        scripts: {
            src: '**/*.js',
            task: function (done) {
            }
        },
        styles: {
            src: '**/*.css',
            task: function (done) {
            }
        }
    },
    build: ['clean', 'make'],
    watch: {
        options: {
            usePolling: true
        },
        task: ['scripts', 'styles']
    }
};
```
Note that in contrast to previous example, there is a `clean` task in configuration in this example, so it will be exposed and can run in CLI.

### Invisible Task
Sometimes there is tasks that never need to run in CLI. An invisible task do not expose itself to CLI and can't be referenced. Hiding a task won't affect its sub tasks: sub tasks still inherit its configuration. An invisible task is still functional and can be invoked from its parent task.

To hide a task from expose to CLI, add a "`visibility`" property with "`hidden`" value to its configuration.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    scripts: {
        concat: {
            visibility: 'hidden',
            file: 'bundle.js',
            src: 'lib/',
            coffee: {
                src: '**/*.coffee'
            },
            js: {
                src: '**/*.js'
            }
        }
    }
};
```
In this example the `concat` task is invisible whereas its sub task `coffee` and `js` is still visible.

For simplicity, you can prefix a task's name with a "`.`" character to hide it, just as [dot-files](https://en.wikipedia.org/wiki/Dot-file).
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    scripts: {
        '.concat': {
            file: 'bundle.js',
            src: 'lib',
            coffee: {
                src: '**/*.coffee'
            },
            js: {
                src: '**/*.js'
            }
        }
    }
};
```
This generates exactly the same results as previous example.


### Disabled Task
Sometimes when you are tweaking gulpfile.js, you need to disable some tasks to figure out where is the source of problems. Disabling a task, meaning the task itself along with all its sub tasks are not defined at all.

To disable a task, add a "`visibility`" property with "`disabled`" value to its configuration.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    scripts: {
        concat: {
            file: 'bundle.js',
            src: 'lib/',
            coffee: {
                visibility: 'disabled',
                src: '**/*.coffee'
            },
            js: {
                src: '**/*.js'
            }
        }
    }
};
```
In this example the `coffee` task is disabled.

For simplicity, you can prefix a task's name with a "`#`" character to disable it, just as you write comments in a bash script.
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    scripts: {
        concat: {
            file: 'bundle.js',
            src: 'lib',
            '#coffee': {
                src: '**/*.coffee'
            },
            js: {
                src: '**/*.js'
            }
        }
    }
};
```
This generates exactly the same results as previous example.

### Passing configuration values

As you may noted: properties in a configuration entry can be task properties and sub tasks. How do you distinguish each and passing configuration values to your recipe function? The reserved "`config`" [keyword](#Reserved_Configuration_Properties_(Keywords)) is exactly reserved for this purpose.
``` javascript
{
    scripts: {
        config: {
            file: 'bundle.js'
        }
    }
```

Sometimes writing a "`config`" entry solely for one property is too over, if this is the case, you can prefix a "`$`" character to any property name, and those properties will be recognized as configuration values rather then sub tasks.

``` javascript
{
    scripts: {
        $file: 'bundle.js'
    }
```
Now the property "`$file`" will be recognized as a configuration value, and you can use "`$file`"  and "`file`" interchangeable in your recipe, though  "`file`" is recommended to allow using the "`config`" keyword.

### Reserved Task Properties (Keywords)
These keywords are reserved for task properties, you can't use them as task name.

#### name
Name of the task. Only required when defining task in an array and you want to run it from CLI.

#### description
Description of the task.

#### config
Configuration values of the task.

#### src
The path or glob that files should be loaded. Normally you define paths in parent task and files in leaf tasks. Files defined in sub tasks inherits parent's path. The property value can be any valid glob, or array of globs, or of the form `{ globs: [], options: {} }`, and will be passed to task with the later form.

#### dest
The path where files should be written. Path should be resolved to a single directory. Path defined in sub tasks inherits parent's path. The property value can be any valid path string, or of the form `{ path: '', options: {} }`, and will be passed to task with the later form.

#### order
Execution order of the task. Only required when you are defining tasks in object and want them be executed in series. Order values are used for sorting, so don't have to be contiguous.

#### recipe
Recipe module name to use. Defaults to the same value of `name`.

#### plugin
A plugin module name to use.

#### task
Define a plain function, inline function, or references to other tasks. If provided as an array, child tasks are forced to run in series, otherwise child tasks are running in parallel.

#### parallel
Instruct sub tasks to run in parallel. Sub tasks can be defined in an array or object. Note sub tasks defined in an object are executed in parallel by default.

#### series
Instruct sub tasks to run in series. Sub tasks can be defined in an array or object. Note sub tasks defined in an array are executed in series by default.

#### spit
Instruct task to write file(s) out if was optional.

#### visibility
Visibility of the task. Valid values are `normal`, `hidden`, and `disabled`.


### Dynamic Configuration / Template Variable Realizing

Some stream processors (e.g., "gulp-ccr-eachdir") programmatically modify and/or generate new configurations. The new configuration values are injected to recipe's configuration at runtime. And templates with `{{var}}` syntax are realized with resolved variables.

### Conditional Configurations
Gulp-chef supports conditional configurations via rumtime environment modes.
By default, `development`, `production` and `staging` modes are supported. You can write your configurations for each specific mode under `development`/`dev`, `production`/`prod`, and `staging`  property respectively.

For example, with the following configuration:
``` javascript
{
    scripts: {
        // common configs
        src: 'src/',

        development: {
            // development configs
            description: 'development mode',
            dest: 'build/',

            options: {
                // development options
                debug: true
            },

            // sub tasks for development mode
            lint: {
            }
        },

		production: {
			// production configs
			description: 'production mode',
			dest: 'dist/',

			options: {
				// production options
				debug: false
			}
		},

        options: {
            // common options

            dev: {
                // development options
                description: 'development mode',
                sourcemap: false
            },

            prod: {
                // production options
                description: 'production mode',
                sourcemap: 'external'
            }
        },

        // sub tasks
		pipe: [{
            typescript: {
                src: '**/*.ts'
            },

            js: {
                src: '**/*.js'
            }
        }, {
			production: {
				// production configs
				description: 'production mode',

				// sub tasks for production mode
				uglify: {
				}
			}
        }, {
			production: {
				// production configs
				description: 'production mode',

				// sub tasks for production mode
				concat: {
				}
			}
		}]
    }
}
```

In `development` mode will becomes:
``` javascript
{
    scripts: {
        src: 'src/',
        description: 'development mode',
        dest: 'build/',
        options: {
            description: 'development mode',
            sourcemap: false,
            debug: true
        },
        lint: {
        },
		pipe: [{
			typescript: {
				src: '**/*.ts'
			},
			js: {
				src: '**/*.js'
			}
		}]
    }
}
```

And in `production` mode will becomes:
``` javascript
{
    scripts: {
        src: 'src/',
		description: 'production mode',
        dest: 'dist/',
        options: {
            description: 'production mode',
            sourcemap: 'external',
            debug: false
        },
		pipe: [{
			typescript: {
				src: '**/*.ts'
			},
			js: {
				src: '**/*.js'
			}
		}, {
        	description: 'production mode',
        	uglify: {
			}
		}, {
        	description: 'production mode',
        	concat: {
			}
		}]
    }
}
```
Super!

#### Run Gulp in Specific Runtime Environment Mode

##### Via CLI Argument
``` bash
$ gulp --development build
```
Or, for short:
``` bash
$ gulp --dev build
```

##### Via Environment Variable
In Linux/Unix:
``` bash
$ NODE_ENV=development gulp build
```
Or, for short:
``` bash
$ NODE_ENV=dev gulp build
```

#### Customizing Rumtime Environment Modes
Rumtime environment modes are totally configurable too. If you are a minimalist, you can even use `d`, `p` and `s` for `development`, `production` and `staging` respectively, just remember that your configurations and runtime environment modes are in sync.
``` javascript
var ingredients = {
    scripts: {
        src: 'src/',
        lint: {
        },
        d: {
            debug: true
        },
        p: {
            debug: false,
            sourcemap: 'external',
            uglify: {
            },
            concat: {
            }
        }
    }
};
var options = {
    modes: {
        production: ['p'],
        development: ['d'],
        staging: ['s'],
        default: 'production'
    }
};
var meals = chef(ingredients, options);
```
Note the `default` in `options.modes`. It won't define a mode. Instead, it define which mode being default. If `options.modes.default` is not specified, first mode will becomes default. However, it's recommended not to omit.

Moreover, you can design any modes you want, with alias support.
``` javascript
var options = {
    modes = {
        build: ['b', 'build'],
        compile: ['c', 'compile'],
        deploy: ['d', 'deploy', 'deployment'],
        review: ['r', 'review']
        default: 'build'
    }
};
```

However, you can't use [keywords](#Reserved_Configuration_Properties_(Keywords)) reserved for task information, of course.

## Writing Recipes

There are 3 kinds of recipes: "__task__", "__stream processor__", and "__flow controller__".

Most of the time, you want to write `task` recipes. Task recipes are the actual task that do things, whereas `stream processor`s and `flow controller`s manipulate other tasks.

For more information about `stream processor` and `flow controller`, or you are willing to share your recipes, you can write them as plugins. Check out [Writing Plugins](#Writing_Plugins) for how.

If you write recipes only for your own project use, you can put them in sub folders within your project's root:

type            |folder
----------------|------------------
task            |gulp, gulp/tasks
stream processor|gulp/streams
flow controller |gulp/flows

If your recipes do not need configuration, you can write them just as normal gulp tasks. That is, your existing gulp tasks are already reusable recipes! You just need to put them in a standalone module file, and put to the "gulp" folder within your project's root folder.

To use your existing recipe, write a configuration with a property name exactly same as your recipe's module name.

For example, say you have your "my-recipe.js" recipe in `<your-project>/gulp` folder. Write a configuration to reference it:
``` javascript
var meals = chef({
    "my-recipe": {}
});
```
Then you can run it by executing `gulp my-recipe` in CLI.

However, configurations helps maximizing the reusability of recpies. A configurable recipe takes its configurations via its execution context, i.e., `this` variable.
``` javascript
function scripts(done) {
    var gulp = this.gulp;
    var config = this.config;

    return gulp.src(config.src.globs)
        .pipe(eslint())
        .pipe(concat(config.file))
        .pipe(uglify())
        .pipe(gulp.dest(config.dest.path));
}

module.exports = scripts;
```
And can be configured as:
``` javascript
var meals = chef({
    src: 'src/',
    dest: 'dist/',
    scripts: {
        src: '**/*.js',
        file: 'bundle.js'
    }
});
```

### Development / Production Mode

Configurable recipes don't have to worry about development/production mode. Configurations are resolved for that specific mode already.


## Build-in Recipes

#### clean
Clean up `dest` folder.

#### copy
Copy assets defined by`src` to `dest` folder, optionally remove or replace relative paths for files.

#### merge
A merge stream processor creates a new stream, that ends only when all its sub tasks' stream ends.

See [merge-stream](https://www.npmjs.com/package/merge-stream) for details.

#### queue
A queue stream processor creates a new stream, that pipe queued streams of its sub tasks progressively, keeping datas order.

See [streamqueue](https://www.npmjs.com/package/streamqueue) for details.

#### pipe
Provides the same functionality of `gulp.pipe()`. Pipe streams from one sub task to another.

#### parallel
A parallel flow controller runs sub tasks in parallel, without waiting until the previous task has completed.

#### series
A series flow controller runs sub tasks in series, each one running once the previous task has completed.

#### watch
A watch flow controller watches source files of specific tasks and their descendants and run corresponding task when a file changes.

## Writing Plugins

### Plugin Types

Aa said in "[Writing Recipes](#Writing_Recipes)" section, there are 3 kinds of recipes: "__task__", "__stream processor__", and "__flow controller__". Gulp-chef need to know which type the plugin is. Since a plugin is installed via `npm install`, plugin must denote which type it is.

``` javascript
function myPlugin(done) {
    done();
}

module.exports = myPlugin;
module.exports.type = 'flow';
```
Valid types are "`flow`", "`stream`", and "`task`".

### Configuration Schema

To simplify the processing of configuration, gulp-chef encourages using "[JSON Schema](http://json-schema.org/)" to validate and transform configuration. Gulp-chef use "[json-normalizer](https://github.com/amobiz/json-normalizer)" to provide extend JSON schema functionality and to normalize configuration. You can define your configuration schema to support property alias, type conversion, and default value, etc. Check out "[json-normalizer](https://github.com/amobiz/json-normalizer)" for how to extend your schema.

The schema can show up in `gulp --recipe <recipe-name>` command, so user can figure out how to write configuration without checking out the document.

``` javascript
var gulpif = require('gulp-if');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

function myPlugin() {
    var gulp = this.gulp;
    var config = this.config;
    var options = this.config.options || {};
    var maps = (options.sourcemaps === 'external') ? './' : null;

    return gulp.src(config.src.globs)
        .pipe(gulpif(config.sourcemaps, sourcemaps.init())
        .pipe(concat(config.file))
        .pipe(gulpif(options.uglify, uglify()))
        .pipe(gulpif(options.sourcemaps, sourcemaps.write(maps)))
        .pipe(gulp.dest(config.dest.path));
}

module.exports = myPlugin;
module.exports.type = 'task';
module.exports.schema = {
    title: 'My Plugin',
    description: 'My first plugin',
    type: 'object',
    properties: {
        src: {
            type: 'glob'
        },
        dest: {
            type: 'path'
        },
        file: {
            description: 'Output file name',
            type: 'string'
        },
        options: {
            type: 'object',
            properties: {
                sourcemaps: {
                    description: 'Sourcemap support',
                    alias: ['sourcemap'],
                    enum: [false, 'inline', 'external'],
                    default: false
                },
                uglify: {
                    description: 'Uglify bundle file',
                    type: 'boolean',
                    default: false
                }
            }
        }
    },
    required: ['file']
};
```
First note that since "`file`" property is required, there is no need to check if "`file`" property was provided in plugin.

Also note the "`sourcemaps`" options has alias "`sourcemap`", user can use both property name interchangeable, whereas the plugin needs just to deal with "`sourcemaps`".

#### Extended Data Types

Gulp-chef provides two extended data type for JSON schema: "`glob`" and "`path`".

##### glob

##### path

### Writing Stream Processor
A stream processor manipulates its sub tasks' input and/or output streams.

In the "Configurable Recipe" section, that said "configurable task" is simply a wrapper that calls "configurable recipe" with exactly the same name. That's not entirely true. Stream processor may not has the same name as "configurable task".

### Writing Flow Controller
A flow controller takes care of when to execute, and execution order of its sub tasks and don't care their input and/or output streams.



### Test Plugin



## List of Recipe Plugins

### Task

#### gulp-ccr-browserify
#### gulp-ccr-bump

### Stream Processor

#### gulp-ccr-concat
#### gulp-ccr-each
#### gulp-ccr-each-dir
#### gulp-ccr-merge
#### gulp-ccr-pipe
#### gulp-ccr-queue

### Flow Controller

#### gulp-ccr-watch


## List of CLI Options

### --task

### --recipe

