# gulp-chef

[![Join the chat at https://gitter.im/gulp-cookery/gulp-chef](https://badges.gitter.im/gulp-cookery/gulp-chef.svg)](https://gitter.im/gulp-cookery/gulp-chef?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Cascading configurable recipes for gulp 4.0. An elegant, and intuitive way to reuse gulp tasks.

DRY (Don’t repeat yourself) your code, why WET (write everything twice) your gulpfile.js?

This project is still in early development stage and likely has some bugs at the moment. Please report issues and let me know how it works for you! Thank you!

## Features

* Gulp 4.0 support,
* Automatic local recipe lookup,
* Plugin support via npm,
* Nesting task with configuration inheritance,
* Forward and backward task reference,
* Process streams via configuration: merge, queue, or concat streams, etc,
* Control tasks execution via configuration: run tasks in parallel or series,
* Conditional configuration support,
* CLI commands for recipes listing and usage, and
* CLI commands for displaying task description and configuration.

## Q.A.

### Q. Does gulp-chef violate the "preferring code over configuration" philosophy of gulp?

__A__. No, you write codes as usual and abstract changes in configurations.

Gulp-chef adds flexibility by helping:

* [Split tasks across multiple files](https://github.com/gulpjs/gulp/blob/master/docs/recipes/split-tasks-across-multiple-files.md), and
* [Make recipes shareable and usable instantly](https://github.com/gulpjs/gulp/tree/master/docs/recipes).

### Q. Are there any alternatives?

__A__. Yes, there are [gulp-cozy](https://github.com/lmammino/gulp-cozy), [gulp-load-subtasks](https://github.com/skorlir/gulp-load-subtasks), [gulp-starter](https://github.com/vigetlabs/gulp-starter), [elixir](https://github.com/laravel/elixir), and a lot [more](https://github.com/search?utf8=%E2%9C%93&q=gulp+recipes&type=Repositories&ref=searchresults).

### Q. So, what advantages do gulp-chef have over others?

__A__.

* Gulp-chef is non-intrusive. It does not force or restrict you to its API to write recipes.
* Gulp-chef is powerful yet easy to use. Build in best practices such as merge, and queue streams. This means you can make your task [do one thing and do it well](https://en.wikipedia.org/wiki/Unix_philosophy), and then assemble your tasks via configuration.
* Gulp-chef itself and its sharable plugins are true node modules. That means you can install and manage dependencies via npm. No more copy and paste, stop worrying about outdated, or out of sync tasks.
* There is great flexibility you can decide how to use gulp-chef, [minimal](https://github.com/gulp-cookery/example-minimal-configuration) or [maximal](https://github.com/gulp-cookery/example-recipes-demo), whatever you choice.

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

var ingredients = {
    src: 'src/',
    dest: 'dist/',
    clean: {},
    make: {
        styles: {
            recipe: 'copy',
            src: '**/*.js'
        },
        browserify: {
            bundle: {
                entry: 'main.js'
            }
        }
    },
    build: ['clean', 'make'],
    default: 'build'
};

var meals = chef(ingredients);

gulp.registry(meals);
```

### Run Gulp

``` bash
$ gulp
```

## Examples

* [example-minimal-configuration](https://github.com/gulp-cookery/example-minimal-configuration)

Demonstrates using gulp-chef as a glue, all tasks are plain functions without configuration.

* [example-recipes-demo](https://github.com/gulp-cookery/example-recipes-demo)

Taking examples from [gulp-cheatsheet](https://github.com/osscafe/gulp-cheatsheet), demonstrates what gulp-chef can achieve. Writing configuration this way is not encouraged.

* [example-todomvc-angularjs-browserify](https://github.com/gulp-cookery/example-todomvc-angularjs-browserify)

Taking a full working example from [angularjs-gulp-example](https://github.com/jhades/angularjs-gulp-example). Demonstrates rewriting gulpfile.js using gulp-chef. Also check out the great article: "[A complete toolchain for AngularJs - Gulp, Browserify, Sass](http://blog.jhades.org/what-every-angular-project-likely-needs-and-a-gulp-build-to-provide-it/)" from the author.

* [example-webapp-seed](https://github.com/gulp-cookery/example-webapp-seed)

A simple web app seed project.

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

You register a gulp task using `gulp.task()` method.

``` javascript
gulp.task(gulpTask);
```

And then run it in CLI.

``` bash
$ gulp gulpTask
```

### <a href="#" id="configurable-task"></a> Configurable Task

A configurable task has the same signature as normal gulp task, but be called with an object: `{ gulp, config, upstream }` as context.

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

This generates a configurable task called "`scripts`" for you. The `chef()` function returns a gulp registry. You can access the "`scripts`" configurable task via `meals.get('scripts')`. But normally you call `gulp.registry()` to register all available tasks in the registry.

``` javascript
gulp.registry(meals);
```

Once you call `gulp.registry()`, you can run registered tasks in CLI.

``` bash
$ gulp scripts
```

When invoked, the configurable task will be called with the configuration defined with it, some kind of like this:

``` javascript
scripts.call({
    gulp: gulp,
    config: {
        src: 'src/**/*.js',
        dest: 'dist/'
    }
}, done);
```

Also note that in this example, the "`scripts`" entry in the configuration is the module name of a recipe, that must be present in your project's "`gulp`" folder, or of a plugin, that must be installed. Check out [Writing Recipes](#writing-recipes) and [Using Plugins](#using-plugins) for more information.

### Configurable Recipe

A configurable recipe is, a configurable and reusable gulp task, that has the same signature as normal gulp task, but be called with an object: `{ gulp, config, upstream }` as context. A configurable recipe is the function you actually write and reuse. In fact, a "[configurable task](#configurable-task)" is simply a wrapper that calls "configurable recipe" with exactly the same name.

``` javascript
function scripts(done) {
    // Note: you have asscess to the gulp instance.
    var gulp = this.gulp;
    // Note: you can access configuration via 'config' property.
    var config = this.config;

    // do things ...

    done();
}
```

## Writing Configurations

A configuration is a plain JSON object. Each entries and nested entries are either "configuration property" or "sub task".

### Nesting Task

Tasks can be nested. Sub tasks lexically (or statically) cascading inherits its parent's configurations. And even better, for some predefined properties, e.g. "`src`", "`dest`", paths are joined automatically.

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

This creates __three__ configurable tasks for you: `build`, `scripts`, and `styles`.

### Parallel Tasks

In the above example, when you run `build`, its sub tasks `scripts`, and `styles` will be executed in __parallel__, and be called with configurations listed as the following because of inheritance:

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

However, if you forgot to use "`series`" __flow controller__, but just put "`order`" property, child tasks won't execute in series.

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

In this example, `scripts` and `styles` task will be executed in parallel.

There is a simpler way to execute child tasks in series: put sub task configurations in an array:

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

Looks funny? Well, read on.

### Referencing Task

You can reference other task by its name. Reference can be forward and backward.

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

In this example, the `build` task has three sub tasks, that referring to `clean`, `scripts`, and `styles` task, respectively. Referencing tasks won't generate and register new tasks, so you can't run them directly in CLI. Of course you can still run them via parent task (in series order in this example).

As said previously, sub tasks lexically inherits their parent's configurations, since referred tasks are not defined under the referencing task, they won't inherit its static configuration. However, dynamic generated configurations are still injected to refered tasks. See [Dynamic Configuration](#dynamic-configuration) for detail.

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
    build: {
        description: 'Clean and make',
        task: ['clean', 'make']
    },
    watch: {
        description: 'Watch and run related task',
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

Note in this example, since `clean` was never defined in configuration, it is never exposed, i.e., can't run in CLI.

The other thing to note is that even plain functions are called in the `{ gulp, config, upstream }` context.

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

### Handling Name Collisions

It is recommended that you name all your task in unique, distinct names.

However, if you have many tasks, there is a great chance that more than one task utilize a same recipe or plugin. And by default, task name is direct mapping to recipe name. Then how gulp-chef generate task names when name collision happens? It automaticly prefix task names with their parent's name, like this: "`make:scripts:concat`".

In fact, you can turn this behavior on by default using "`exposeWithPrefix`" settings. The default setting is `"auto"`. You can set to `true` to turn it on.

``` javascript
var ingredients = { ... };
var settings = { exposeWithPrefix: true };
var meals = chef(ingredients, settings);
```

Not your style? There is other ways you can overcome this behavior.

#### Use a new parent and hide the name collision task

``` javascript
{
    scripts: {
        concatScripts: {
            '.concat': {
                file: 'bundle.js'
            }
        }
    },
    styles: {
        concatStyles: {
            '.concat': {
                file: 'main.css'
            }
        }
    }
}
```

#### Use `recipe` keyword

``` javascript
{
    scripts: {
        concatScripts: {
            recipe: 'concat',
            file: 'bundle.js'
        }
    },
    styles: {
        concatStyles: {
            recipe: 'concat',
            file: 'main.css'
        }
    }
}
```

Note: to minimize the chance to get into name collision and to simplify task tree, some tasks are hidden by default. Namely the __stream processor__ and the __flow controller__. See [Writing Stream Processor](#writing-stream-processor) and [Writing Flow Controller](#writing-flow-controller) for more information.

### Using Gulp Plugins

Sometimes your task is merely calling a plain gulp plugin. In this case, you don't even bother to write a recipe, you can use "`plugin`" keyword to reference the plugin.

``` javascript
{
    concat: {
        plugin: 'gulp-concat',
        options: 'bundle.js'
    }
}
```

The plugin property accepts `string` and `function` value. When string provided, it tries to "`require()`" the module. The "`plugin`" property expects an optional "`options`" configuration value, and pass to the plugin function if provided.

You can apply the "`plugin`" keyword to any gulp plugin that takes 0 or 1 parameter and returns a stream or a promise. Plugins must be installed using `npm install`.

Don't get this confused with [plugins for gulp-chef](#using-plugins), that stand for "Cascading Configurable Recipe for Gulp", or "gulp-ccr" for sort.

### Passing Configuration Values

As you may noted: properties in a configuration entry can be either task properties and sub tasks. How do you distinguish each one? The general rule is: except the [keywords](#keywords) "`config`", "`description`", "`dest`", "`name`", "`order`", "`parallel`", "`plugin`", "`recipe`", "`series`", "`spit`", "`src`", "`task`", and "`visibility`", all other properties are recognized as sub tasks.

So, how do you passing configuration values to your recipe function? The reserved "`config`" keyword is exactly reserved for this purpose:

``` javascript
{
    myPlugin: {
        config: {
            file: 'bundle.js'
        }
    }
}
```

Here the "`file`" property of "`config`" property will be passed to recipe. And recipe can take the "`file`" property via the "`config`" property (explained in [Writing Recipes](#writing-recipes)).

``` javascript
function myPlugin(done) {
    var file = this.config.file;
    done();
}

module.exports = myPlugin;
```

Sometimes writing a "`config`" entry solely for one property is too over, if this is the case, you can prefix a "`$`" character to any property name, and those properties will be recognized as configuration values rather then sub tasks.

``` javascript
{
    myPlugin: {
        $file: 'bundle.js'
    }
}
```

Now the property "`$file`" will be recognized as a configuration value, and you can use "`file`" in your configuration and recipe. Note: the property name is not "`$file`", that's because we want to allow user using the "`$`" character and the "`config`" keyword interchangeably.

#### Recipe / Plugin Reserved Configuration Properties

Recipes and plugins can [define](#configuration-schema) their own configuration properties using [JSON Schema](http://json-schema.org/). In this case, you can write configuration values directly inside the configuration entry without the "`$`" character and the "`config`" keyword.

For example, the "[gulp-ccr-browserify](https://github.com/gulp-cookery/gulp-ccr-browserify)" plugin defines "`bundles`", and "`options`" properties, you can put them directly inside the configuration entry.

Instead of this:

``` javascript
{
    src: 'src/',
    dest: 'dest/',
    browserify: {
        config: {
            bundles: {
                entry: 'main.ts'
            },
            options: {
                plugins: 'tsify',
                sourcemaps: 'external'
            }
        }
    }
}
```

You can write your configuration like this:

``` javascript
{
    src: 'src/',
    dest: 'dest/',
    browserify: {
        bundles: {
            entry: 'main.ts'
        },
        options: {
            plugins: 'tsify',
            sourcemaps: 'external'
        }
    }
}
```

#### Smart Configuration Properties

For convenience sake, when a configuration entry uses any of "`task`", "`series`",  "`parallel`",  or "`plugin`" keywords, it is considered there is no ambiguous between sub tasks and properties, and all non-reserved properties will be recognized as the task's properties.

### <a href="#" id="dynamic-configuration"></a> Dynamic Configuration / Template Variable Realizing

Some stream processors (e.g., "[gulp-ccr-each-dir](https://github.com/gulp-cookery/gulp-ccr-each-dir)") programmatically or dynamically generate new configuration values. The new configuration values were injected to sub task's configuration at runtime. Of course recipe and plugin can access these values via "`config`" property.
Sub tasks can also reference these values via templates with `{{var}}` syntax that are realized (or interpolated) with resolved values.

``` javascript
{
    src: 'src/',
    dest: 'dist/',
    'each-dir': {
        dir: 'modules/',
        concat: {
            file: '{{dir}}',
            spit: true
        }
    }
}
```

Here the "[each-dir](https://github.com/gulp-cookery/gulp-ccr-each-dir)" plugin iterates sub folders of "`modules`" folder that was denoted by the "`dir`" property, and generates a new "`dir`" property, passing to each sub tasks (only one task "concat" here). Sub tasks can read this value in their "`config`" property, and user can use the "`{{dir}}`" syntax to reference the value in configuration.

### Conditional Configurations

Gulp-chef supports conditional configurations via runtime environment modes. This functionality is based on [json-regulator](https://github.com/amobiz/json-regulator?utm_referer="gulp-chef"), check it out for more information.

By default, `development`, `production`, and `staging` modes are supported. You can write your configurations for each specific mode under `development`/`dev`, `production`/`prod`, and `staging`  property respectively.

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

In `development` mode, will becomes:

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

And in `production` mode, will becomes:

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
var settings = {
    modes: {
        production: ['p'],
        development: ['d'],
        staging: ['s'],
        default: 'production'
    }
};
var meals = chef(ingredients, settings);
```

Note the `default` in `settings.modes`. It won't define a mode. Instead, it define which mode being default. If `settings.modes.default` is not specified, first mode will becomes default. However, it's recommended not to omit.

Moreover, you can design any modes you want, with alias support.

``` javascript
var settings = {
    modes = {
        build: ['b', 'build'],
        compile: ['c', 'compile'],
        deploy: ['d', 'deploy', 'deployment'],
        review: ['r', 'review']
        default: 'build'
    }
};
```

However, you can't use [keywords](#keywords) reserved for task properties, of course.

## Build-in Recipes

#### [clean](https://github.com/gulp-cookery/gulp-ccr-clean)

Clean up `dest` folder.

#### [copy](https://github.com/gulp-cookery/gulp-ccr-copy)

Copy assets defined by`src` to `dest` folder, optionally remove or replace relative paths for files.

#### [merge](https://github.com/gulp-cookery/gulp-ccr-merge)

A merge stream processor creates a new stream, that ends only when all its sub tasks' stream ends.

See [merge-stream](https://www.npmjs.com/package/merge-stream) for details.

#### [queue](https://github.com/gulp-cookery/gulp-ccr-queue)

A queue stream processor creates a new stream, that pipe queued streams of its sub tasks progressively, keeping data's order.

See [streamqueue](https://www.npmjs.com/package/streamqueue) for details.

#### [pipe](https://github.com/gulp-cookery/gulp-ccr-pipe)

A pipe stream processor provides the same functionality of [`stream.Readable.pipe()`](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options). Pipe streams from one sub task to another.

#### [parallel](https://github.com/gulp-cookery/gulp-ccr-parallel)

A parallel flow controller runs sub tasks in parallel, without waiting until the previous task has completed.

#### [series](https://github.com/gulp-cookery/gulp-ccr-series)

A series flow controller runs sub tasks in series, each one running once the previous task has completed.

#### [watch](https://github.com/gulp-cookery/gulp-ccr-watch)

A watch flow controller watches source files of specific tasks and their descendants and run corresponding task when a file changes.

## <a href="#" id="using-plugins"></a> Using Plugins

Before you write your own recipes, take a look and find out what others already done, maybe there is a perfect one for you. You can search [github.com](https://github.com/search?utf8=%E2%9C%93&q=gulp-ccr) and [npmjs.com](https://www.npmjs.com/search?q=gulp-ccr) using keyword: "`gulp recipe`", or the recommended: "`gulp-ccr`".  The term "`gulp-ccr`" stand for "Cascading Configurable Recipe for Gulp".

Once you found one, say, [`gulp-ccr-browserify`](https://github.com/gulp-cookery/gulp-ccr-browserify), install it in your project's devDependencies:

``` bash
$ npm install --save-dev gulp-ccr-browserify
```

Gulp-chef remove plugin name prefix "`gulp-ccr-`" for you, so you must reference it without the "`gulp-ccr-`" prefix.

``` javascript
{
    browserify: {
        description: 'Using the gulp-ccr-browserify plugin'
    }
}
```

## <a href="#" id="writing-recipes"></a> Writing Recipes

There are 3 kinds of recipes: "__task__", "__stream processor__", and "__flow controller__".

Most of the time, you want to write task recipes. Task recipes are the actual task that do things, whereas `stream processor`s and `flow controller`s manipulate other tasks.

For more information about `stream processor` and `flow controller`, or you are willing to share your recipes, you can write them as plugins. Check out [Writing Plugins](#writing-plugins) for how.

If you write recipes only for your own project use, you can put them in sub folders within your project's root:

type            |folder
----------------|------------------
task            |gulp, gulp/tasks
stream processor|gulp/streams
flow controller |gulp/flows

If your recipes do not need configuration, you can write them just as normal gulp tasks. That is, your existing gulp tasks are already reusable recipes! You just need to put them in a standalone module file, and put to the "gulp" folder within your project's root folder.

To use your existing recipe, write a configuration with a property name exactly the same as your recipe's module name.

For example, say you have your "`my-recipe.js`" recipe in `<your-project>/gulp` folder. Write a configuration to reference it:

``` javascript
var gulp = require('gulp');
var chef = require('gulp-chef');
var meals = chef({
    "my-recipe": {}
});
gulp.registry(meals);
```

That's it. And then you can run it by executing `gulp my-recipe` in CLI.

However, configurations helps maximizing the reusability of recpies.

A configurable recipe takes its configurations via its execution context, i.e., `this` variable.

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

Recipes for gulp-chef don't have to worry about development/production mode. Configurations are resolved for that specific mode already.


## Writing Plugins

A gulp-chef plugin is just a normal Node.js module, plus some required information.

### Plugin Types

Aa said in [Writing Recipes](#writing-recipes) section, there are 3 kinds of recipes: "__task__", "__stream processor__", and "__flow controller__". Gulp-chef need to know which type the plugin is. Since a plugin is installed via `npm install`, there is no folder name from which gulp-chef reailze which type a local recipe is, therefore plugin must denote which type it is.

``` javascript
function myPlugin(done) {
    done();
}

module.exports = myPlugin;
module.exports.type = 'flow';
```

Valid types are "`flow`", "`stream`", and "`task`".

### <a href="#" id="configuration-schema"></a> Configuration Schema

To simplify the processing of configuration, gulp-chef encourages using [JSON Schema](http://json-schema.org/) to validate and transform configuration. Gulp-chef use [json-normalizer](https://github.com/amobiz/json-normalizer?utm_referer="gulp-chef") to maximize flexibility of configuration by extending JSON Schema functionality and normalizing configuration. You can define your configuration schema to support property alias, type conversion, and default value, etc. Also the schema can show up in `gulp --recipe <recipe-name>` command, so user can figure out how to write configuration without checking out the document. Check out [json-normalizer](https://github.com/amobiz/json-normalizer?utm_referer="gulp-chef") for how to define and extend your schema.

Here is a simple plugin with configuration schema:

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

First note that since "`file`" property is required, plugin can use JSON Schema validator to validate configuration, without checking the "`file`" property itself.

Also note the "`sourcemaps`" options has alias "`sourcemap`", user can use both property name interchangeable, whereas the plugin needs only to deal with "`sourcemaps`".

#### Extended Data Types

Gulp-chef provides two extended JSON Schema data type: "`glob`" and "`path`".

##### glob

A "`glob`" property can accepts a path, a glob, an array of paths and/or globs, and optionally along with options.

The following all are valid glob values:

``` javascript
// a path string
'src'
// an array of path string
['src', 'lib']
// a glob
'**/*.js'
// an array of paths and/or globs
['**/*.{js,ts}', '!test*']
// non-normalized object form (note the "glob" property)
{ glob: '**/*.js' }
```

All above values will be normalized to their "object form":

``` javascript
// a path string
{ globs: ['src'] }
// an array of path string
{ globs: ['src', 'lib'] }
// a glob
{ globs: ['**/*.js'] }
// an array of globs
{ globs: ['**/*.{js,ts}', '!test*'] }
// object form (note that 'glob' was normalized to 'globs')
{ globs: ['**/*.js'] }
```

Note that "`glob`" is alias of "`globs`" property, and will be normalized as is, and all globs values will be converted to array.

In its object form, a glob property can take options via "`options`" property.

``` javascript
{
    globs: ['**/*.{js,ts}', '!test*'],
    options: {
        base: 'src',
        buffer: true,
        dot: true
    }
}
```

See [node-glob](https://github.com/isaacs/node-glob#options) for more options.

Any properties of type "glob" in sub task will inherit its parent's "`src`" property, and if both parent and sub task specified, path will be joined.

``` javascript
{
    src: 'src',
    browserify: {
        bundles: {
            entries: 'main.js'
        }
    }
}
```

In this example, the "[browserify](https://github.com/gulp-cookery/gulp-ccr-browserify)" plugin has a "`bundles`" property that has an nested "`entries`" property of glob type. The "`entries`" property will inherit "`src`" property, and has the value: `{ globs: "src/main.js" }`.

If you don't want this behavior, you can specify "`join`" option to override it.

``` javascript
{
    src: 'src',
    browserify: {
        bundles: {
            entry: {
                glob: 'main.js',
                join: false
            }
        }
    }
}
```

Now the "`entries`" property will have the value: `{ globs: "main.js", options: { join: false } }`.

The "`join`" option also can take a string, specifing which parent's property to inherit, which must be of type "`glob`" or "`path`" .

You can also define default property to inherit via [configuration schema](#configuration-schema) in plugin. Always remember to pass "`options`" properties (to whatever API you use) and write code like this to allow user specify options:

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;

    return gulp.src(config.src.globs, config.src.options)
        .pipe(...);
}
```

##### path

A "`path`" property can accepts a path string and optionally along with options.

The following all are valid path values:

``` javascript
// a path string
'dist'
// a path string
'src/lib/'
// object form
{ path: 'maps/' }
```

All above values will be normalized to their "object form":

``` javascript
// a path string
{ path: 'dist' }
// a path string
{ path: 'src/lib/' }
// object form
{ path: 'maps/' }
```

In its object form, a path property can take options.

``` javascript
{
    path: 'dist/',
    options: {
        cwd: './',
        overwrite: true
    }
}
```

See [gulp.dest()](https://github.com/gulpjs/gulp/blob/4.0/docs/API.md#options-1) for more options.

Any properties of type "path" in sub task will inherit its parent's "`dest`" property, and if both parent and sub task specified, path will be joined.

``` javascript
{
    dest: 'dist/',
    scripts: {
        file: 'bundle.js'
    }
}
```

Assume that the "`file`" property is of type "`path`", it will inherit "`dest`" property and have the value: "`{ path: 'dist/bundle.js' }`".

If you don't want this behavior, you can specify "`join`" option to override it.

``` javascript
{
    dest: 'dist/',
    scripts: {
        file: {
            path: 'bundle.js',
            join: false
        }
    }
}
```

Now the "`file`" property will have the value: "`{ path: 'bundle.js', options: { join: false } }`".

The "`join`" option also can take a string, specifing which parent's property to inherit, which must be of type "`path`".

You can also define default property to inherit via [configuration schema](#configuration-schema) in plugin. Always remember to pass "`options`" properties (to whatever API you use) and write code like this to allow user specify options:

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;

    return gulp.src(config.src.globs, config.src.options)
        .pipe(...)
        .pipe(gulp.dest(config.dest.path, config.dest.options));
}
```
### <a href="#" id="writing-stream-processor"></a> Writing Stream Processor

A stream processor manipulates its sub tasks' input and/or output streams.

A stream processor may generate streams itself, or from it's sub tasks. A stream processor can pass stream between sub tasks; or merge, or queue streams from sub tasks, any thing you can imaging. The only restriction is that stream processor must return a stream.

A stream processor takes a "`tasks`" property from its context. Sub tasks are passed to stream processor via the "tasks" array.

When invoking the sub task, a stream processor must setup a context for the sub task.

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;
    var tasks = this.tasks;
    var context, stream;

    context = {
        gulp: gulp,
        // pass the given config to allow parents injecting configuration values
        config: config
    };
    // inject more new configuration values for sub task if desired
    context.config.injectedValue = 'hello!';
    stream = tasks[0].call(context);
    // ...
    return stream;
};
```

Note that parent can inject [dynamic configuration](#dynamic-configuration) to sub tasks. Only new value can be injected: the injected value won't overwrite sub task's existing configuration value.

When passing stream to the sub task, a stream processor must setup a context with "`upstream`" property for the sub task.

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;
    var tasks = this.tasks;
    var context, stream, i;

    context = {
        gulp: gulp,
        config: config
    };
    stream = gulp.src(config.src.globs, config.src.options);
    for (i = 0; i < tasks.length; ++i) {
        context.upstream = stream;
        stream = tasks[i].call(context);
    }
    return stream;
};
```

If a stream processor expecting its sub task returning a stream, and sub task don't, it should throw an exception.

Note: According to the [guidelines](https://github.com/gulpjs/gulp/blob/4.0/docs/writing-a-plugin/guidelines.md) about writing gulp plugin that said: "__do not throw errors inside a stream__". No, you shouldn't. But since we are between streams, not inside a stream, it's OK to throw.

You can use [gulp-ccr-stream-helper](https://github.com/gulp-cookery/gulp-ccr-stream-helper) to help invoking sub tasks and checking results.

Check out [gulp-ccr-merge](https://github.com/gulp-cookery/gulp-ccr-merge), and [gulp-ccr-queue](https://github.com/gulp-cookery/gulp-ccr-queue) for example.

### <a href="#" id="writing-flow-controller"></a> Writing Flow Controller

A flow controller takes care of when to execute, and execution order of its sub tasks and don't care their input and/or output streams.

There is little restriction on flow controller. The only rule is a flow controller must ensure its sub tasks ended properly, say, calling the "`done()`" callback, returning a stream or a promise, etc. Check out [gulp-ccr-parallel](https://github.com/gulp-cookery/gulp-ccr-parallel), [gulp-ccr-series](https://github.com/gulp-cookery/gulp-ccr-series), and [gulp-ccr-watch](https://github.com/gulp-cookery/gulp-ccr-watch) for example.

### Testing Plugin

It is recommended you start writing your plugin as a local recipe, and transform to a plugin when you think it is done. Most recipe testings are data-driven, if this is your case, maybe you want give [mocha-cases](https://github.com/amobiz/mocha-cases) a shot.

### <a href="#" id="keywords"></a> List of Reserved Task Properties (Keywords)

These keywords are reserved for task properties, you can't use them as task names or property names.

#### config

Configuration values of the task.

#### description

Description of the task.

#### dest

The path where files should be written. Path defined in sub tasks inherits parent's path. The property value can be any valid path string, or of the form `{ path: '', options: {} }`, and will be passed to task with the later form.

#### name

Name of the task. Only required when defining task in an array and you want to run it from CLI.

#### order

Execution order of the task. Only required when you are defining tasks in object and want them be executed in series. Order values are used for sorting, so don't have to be contiguous.

#### parallel

Instruct sub tasks to run in parallel. Sub tasks can be defined in an array or object. Note sub tasks defined in an object are executed in parallel by default.

#### plugin

The gulp plugin to use. Can be module name or function.

#### recipe

The recipe module name to use. Defaults to the same value of `name`.

#### series

Instruct sub tasks to run in series. Sub tasks can be defined in an array or object. Note sub tasks defined in an array are executed in series by default.

#### spit

Instruct task to write file(s) out if was optional.

#### src

The path or glob that files should be loaded. Files defined in sub tasks inherits parent's path. Normally you define paths in parent task and files in leaf tasks. The property value can be any valid glob, or array of globs, or of the form `{ globs: [], options: {} }`, and will be passed to task with the later form.

#### task

Define a plain function, inline function, or references to other tasks. If provided as an array, child tasks are forced to run in series, otherwise child tasks are running in parallel.

#### visibility

Visibility of the task. Valid values are `normal`, `hidden`, and `disabled`.


## <a href="#" id="settings"></a> List of Settings

Settings are used to cheange default behavior and to define custom conditional runtime environment modes.

The `chef()` method takes settings as second parameter:

``` javascript
var config = {
};
var settings = {
};
var meals = chef(config, settings);
```

### settings.exposeWithPrefix

Switch on or off whether to automaticly prefix task names with their parent's name. When turned on, task name will be of the form: "`make:scripts:concat`".

Defaults to `"auto"`. You can set to `true` to turn it on. Set to `false` to turn off, will throw error when name collision occurred.

### settings.lookups

A hash object to set custom local recipe lookup folders. Defaults to:

``` javascript
{
    lookups: {
        flows: 'flows',
        streams: 'streams',
        tasks: 'tasks'
    }
}
```

### settings.lookups.flows

The lookup folder for flow controller recipes. Defaults to `"flows"`.

### settings.lookups.streams

The lookup folder for stream processor recipes. Defaults to `"streams"`.

### settings.lookups.tasks

The lookup folder for task recipes. Defaults to `"tasks"`.

### settings.plugins

Options passed to "[gulp-load-plugins](https://github.com/jackfranklin/gulp-load-plugins)".
Gulp-chef use "gulp-load-plugins" to load configurable task plugins, i.e. "gulp-ccr" plugins.
By default any plugins that don't have `"gulp-ccr"` prefix won't be loaded.
You can change the "`plugins`" settings to load these plugins.

Defaults to:

``` javascript
{
    plugins: {
        camelize: false,
        config: process.cwd() + '/package.json',
        pattern: ['gulp-ccr-*'],
        replaceString: /^gulp[-.]ccr[-.]/g
    }
}
```

### settings.plugins.DEBUG

When set to true, the plugin will log info to console. Useful for bug reporting and issue debugging.

### settings.plugins.camelize

If true, transforms hyphenated plugins names to camel case.

### settings.plugins.config

Where to find the plugins, by default searched up from process.cwd().

### settings.plugins.pattern

The glob(s) to search for. Defaults to `"gulp-ccr-*"`.

### settings.plugins.scope

Which keys in the config to look within. Defaults to

``` javascript
['dependencies', 'devDependencies', 'peerDependencies'].
```

### settings.plugins.replaceString

What to remove from the name of the module when adding it to the context. Defaults to  `/^gulp[-.]ccr[-.]/g`.

### settings.plugins.lazy

Whether the plugins should be lazy loaded on demand. Defaults to true.

### settings.plugins.rename

A mapping hash object of plugins to rename.

### settings.plugins.renameFn

A function to handle the renaming of plugins (the default works).

### settings.modes

A hash object to set custom modes for conditional configurations.

Keys except `default` that denotes default mode, are 'mode' for specific conditional configuration.

Values must be array of 'identifier's, that can be used in configuration and CLI.

Defaults to:

``` javascript
{
    modes: {
        production: ['production', 'prod'],
        development: ['development', 'dev'],
        staging: ['staging'],
        default: 'production'
    }
}
```

## List of CLI Options

### --task

Look up a task and display its description and configurations.

``` bash
$ gulp --task <task-name>
```

### --recipe

List available recipes, including all build-in recipes, local recipes, and installed plugins.

You can use "`--recipes`",  "`--recipe`",  and "`--r`" interchangeable.

``` bash
$ gulp --recipes
```

Look up a recipe and display its description and [configuration schema](#configuration-schema) if available.

``` bash
$ gulp --recipe <recipe-name>
```

## Build and Contribute

``` bash
$ git clone https://github.com/gulp-cookery/gulp-chef.git
$ cd gulp-chef
$ npm install
```

## Issues

[Issues](https://github.com/gulp-cookery/gulp-chef/issues)

## Test

Tests are written in [mocha](https://mochajs.org/). Run tests in terminal:

``` bash
$ npm test
```

## License

[MIT](http://opensource.org/licenses/MIT)

## Author

[Amobiz](https://github.com/amobiz)
