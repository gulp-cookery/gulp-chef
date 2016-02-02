# gulp-chef

支援 Gulp 4.0，允许嵌套配置任务及组态。以优雅、直觉的方式，重复使用 gulp 任务。

编码的时候你遵守 DRY 原则，那编写 gulpfile.js 的时候，为什么不呢？

注意：此专案目前仍处于早期开发阶段，因此可能还存有错误。请协助回报问题并分享您的使用经验，谢谢！

## 功能

* 支援 Gulp 4.0，
* 自动载入本地 recipe，
* 支援透过 npm 安装 plugin，
* 支援嵌套任务并且允许子任务继承组态配置，
* 支援向前、向后参照任务，
* 透过组态配置即可处理串流：譬如 merge, queue, 或者 concat，
* 透过组态配置即可控制子任务的执行： parallel 或者 series，
* 支援条件式组态配置，
* 支援命令行指令，查询可用的 recpies 及使用方式，以及
* 支援命令行指令，查询可用的任务说明及其组态配置。

## 问与答

### 问. gulp-chef 违反了 gulp 的『编码优于组态配置 (preferring code over configuration)』哲学吗？

__答__ 没有， 你还是像平常一样编码， 并且将可变动部份以组态配置的形式萃取出来。

Gulp-chef 透过简化以下的工作来提高使用弹性：

* [分割任务到不同的档案](https://github.com/gulpjs/gulp/blob/master/docs/recipes/split-tasks-across-multiple-files.md)，以及
* [让任务可分享并立即可用](https://github.com/gulpjs/gulp/tree/master/docs/recipes)。

## 入门

### 将 gulp cli 4.0 安装为公用程式 (全域安装)

``` bash
npm install -g "gulpjs/gulp-cli#4.0"
```

### 将 gulp 4.0 安装为专案的 devDependencies

``` bash
npm install --save-dev "gulpjs/gulp#4.0"
```

更详细的安装及 Gulp 4.0 入门请参阅 <<[Gulp 4.0 前瞻](http://segmentfault.com/a/1190000002528547)>> 这篇文章。

### 将 gulp-chef 安装为专案的 devDependencies

``` bash
$ npm install --save-dev gulp-chef
```

### 在专案根目录建立 gulpfile.js 档案

``` jsavascript
var gulp = require('gulp');
var chef = require('gulp-chef');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

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

### 执行 Gulp
``` bash
$ gulp
```

## 参考范例

* [example-minimal-configuration](https://github.com/gulp-cookery/example-minimal-configuration)

示范只将 gulp-chef 作为任务的黏合工具，所有的任务都是没有组态配置、单纯的 JavaScript 函数。

* [example-recipes-demo](https://github.com/gulp-cookery/example-recipes-demo)

根据 [gulp-cheatsheet](https://github.com/osscafe/gulp-cheatsheet) 的范例，展示 gulp-chef 的能耐。通常不建议以这里采用的方式配置任务及组态。

* [example-todomvc-angularjs-browserify](https://github.com/gulp-cookery/example-todomvc-angularjs-browserify)

根据现成完整可运作的范例程式 [angularjs-gulp-example](https://github.com/jhades/angularjs-gulp-example)，示范如何将普通的 gulpfile.js 改用 gulp-chef 来撰写。同时不要错过了来自范例作者的好文章： "[A complete toolchain for AngularJs - Gulp, Browserify, Sass](http://blog.jhades.org/what-every-angular-project-likely-needs-and- a-gulp-build-to-provide-it/)"。

* [example-webapp-seed](https://github.com/gulp-cookery/example-webapp-seed)

一个简单的 web app 种子专案。同时也可以当做是一个示范使用本地 recipe 的专案。


## 用语说明

### Gulp Task

一个 gulp task 只是普通的 JavaScript 函数，函数可以回传 Promise, Observable, Stream, 子行程，或者是在完成任务时呼叫 `done()` 回呼函数。从 Gulp 4.0 开始，函数被呼叫时，其执行环境 (context)，也就是 `this` 值，是 `undefined`。

``` javascript
function gulpTask(done) {
    assert(this === null);
    // do things ...
    done();
}
```

必须使用 `gulp.task()` 函数注册之后，函数才会成为 gulp task。

``` javascript
gulp.task(gulpTask);
```

然后才能在命令行下执行。

``` bash
$ gulp gulpTask
```

### <a href="#" id="configurable-task"></a> Configurable Task

一个可组态配置的 gulp 任务在 gulp-chef 中称为 configurable task，其函数参数配置与普通 gulp task 相同。但是被 gulp-chef 呼叫时，gulp-chef 将传递一个 `{ gulp, config, upstream }` 物件做为其执行环境 (context)。

``` javascript
// 注意: configurable task 不能直接撰写，必须透过配置组态的方式来产生。
function configurableTask(done) {
    done();
}
```

你不能直接撰写 configurable task，而是必须透过定义组态配置，并呼叫 `chef()` 函数来产生。

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

在这个范例中，gulp-chef 为你建立了一个名为 "`scripts`" 的 configurable task。注意 `chef()` 函数回传一个 gulp registry 物件，你可以透过回传的 gulp registry 物件，以 `meals.get('scripts')` 的方式取得该 configurable task。但是通常你会呼叫 `gulp.registry()` 来注册所有包含在 registry 之中的任务。

``` javascript
gulp.registry(meals);
```

一旦你呼叫了 `gulp.registry()` 之后，你就可以在命令行下执行那些已注册的任务。

``` bash
$ gulp scripts
```

当 configurable task 被呼叫时，将连同其一起配置的组态，经由其执行环境传入，大致上是以如下的方式呼叫：

``` javascript
scripts.call({
    gulp: gulp,
    config: {
        src: 'src/**/*.js',
        dest: 'dist/'
    }
}, done);
```

另外注意到在这个例子中，在组态中的 "`scripts`" 项目，实际上对应到一个 recipe 或 plugin 的模组名称。如果是 recipe 的话，该 recipe 模组档案必须位于专案的 "`gulp`" 目录下。如果对应的是 plugin 的话，该 plugin 必须先安装到专案中。更多细节请参考『[撰写 recipe](#writing-recipes)』及『[使用 plugin](#using-plugins)』的说明。

### Configurable Recipe

一个支援组态配置，可供gulp 重复使用的任务，在gulp-chef 中称为configurable recipe <sub>[注]</sub>，其函数参数配置也与普通gulp task 相同，在被gulp-chef呼叫时，gulp-chef 也将传递一个`{ gulp, config, upstream }` 物件做为其执行环境(context)。这是你真正撰写，并且重复使用的函数。事实上，前面提到的 "[configurable task](#configurable-task)"，就是透过名称对应的方式，在组态配置中对应到真正的 configurable recipe，然后加以包装、注册为 gulp 任务。

``` javascript
function scripts(done) {
    // 注意：在 configurable recipe 中，你可以直接由 context 取得 gulp 实体。
    var gulp = this.gulp;
    // 注意：在 configurable recipe 中，你可以直接由 context 取得 config 组态。
    var config = this.config;

    // 用力 ...

    done();
}
```

注：在 gulp-chef 中，recipe 意指可重复使用的任务。就像一份『食谱』可以用来做出无数的菜肴一样。

## 撰写组态配置

组态配置只是普通的 JSON 物件。组态中的每个项目、项目的子项目，要嘛是属性 (property)，要不然就是子任务。

### 嵌套任务

任务可以嵌套配置。子任务依照组态的语法结构 (lexically)，或称静态语汇结构 (statically)，以层叠结构 (cascading) 的形式继承 (inherit) 其父任务的组态。更棒的是，一些预先定义的属性，譬如 "`src`", "`dest`" 等路径性质的属性，gulp-chef 会自动帮你连接好路径。

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

这个例子建立了__三个__ configurable tasks 任务：`build`, `scripts` 以及 `styles`。

### 并行任务

在上面的例子中，当你执行 `build` 任务时，它的子任务 `scripts` 和 `styles` 会以并行 (parallel) 的方式同时执行。并且由于继承的关系，它们将获得如下的组态配置：

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

### 序列任务

如果你希望任务以序列(series) 的顺序执行，你可以使用"`series`" __流程控制器(flow controller)__，并且在子任务的组态配置中，加上"`order`" 属性：

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

记住，你必须使用 "`series`" 流程控制器，子任务才会以序列的顺序执行，仅仅只是加上 "`order`" 属性并不会达到预期的效果。

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

在这个例子中，`scripts` 和 `styles` 会以并行的方式同时执行。

其实有更简单的方式，可以使子任务以序列的顺序执行：使用数组。

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

不过，看起来似乎有点可笑？别急，请继续往下看。

### 参照任务

你可以使用名称来参照其他任务。向前、向后参照皆可。

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

在这个例子中，`build` 任务有三个子任务，分别参照到 `clean`, `scripts` 以及 `styles` 任务。参照任务并不会产生并注册新的任务，所以，在这个例子中，你无法直接执行 `build` 任务的子任务，但是你可以透过执行 `build` 任务执行它们。

前面提到过，子任务依照组态的语法结构 (lexically)，或称静态语汇结构 (statically)，以层叠结构 (cascading) 的形式继承 (inherit) 其父任务的组态。既然『被参照的任务』不是定义在『参照任务』之下，『被参照的任务』自然不会继承『参照任务』及其父任务的静态组态配置。不过，有另一种组态是执行时期动态产生的，动态组态会在执行时期注入到『被参照的任务』。更多细节请参考『[动态组态](#dynamic-configuration)』的说明。

在这个例子中，由于使用数组来指定参照 `clean`, `scripts` 及 `styles` 的任务，所以是以序列的顺序执行。你可以使用 "`parallel`" 流程控制器改变这个缺省行为。

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

或者，其实你可以将子任务以物件属性的方式，放在一个共同父任务之下，这样它们就会缺省以并行的方式执行。

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

你可以另外使用 "`task`" 关键字来引用『被参照的任务』，这样『参照任务』本身就可以同时拥有其他属性。

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

### 纯函数 / 内联函数

任务也可以以普通函数的方式定义并且直接引用，或以内联匿名函数的形式引用。

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

注意在这个例子中，在组态配置中并未定义 `clean` 项目，所以`clean` 并不会被注册为 gulp task。

另外一个需要注意的地方是，即使只是纯函数，gulp-chef 呼叫时，总是会以 `{ gulp, config, upstream }` 做为执行环境来呼叫。

你一样可以使用 "`task`" 关键字来引用函数，这样任务本身就可以同时拥有其他属性。

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

注意到与上个例子相反地，在这里组态配置中定义了 `clean` 项目，因此 gulp-chef 会产生并注册 `clean` 任务，所以可以由命令行执行`clean` 任务。

### 隐藏任务

有时候，某些任务永远不需要单独在命令行下执行。隐藏任务可以让任务不要注册，同时不可被其它任务引用。隐藏一个任务不会影响到它的子任务，子任务仍然会继承它的组态配置并且注册为 gulp 任务。隐藏任务仍然是具有功能的，但是只能透过它的父任务执行。

要隐藏一个任务，可以在项目的组态中加入具有 "`hidden`" 值的 "`visibility`" 属性。

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

在这个例子中，`concat` 任务已经被隐藏了，然而它的子任务 `coffee` 和 `js` 依然可见。

为了简化组态配置，你也可以使用在任务名称前面附加上一个"`.`" 字元的方式来隐藏任务，就像UNIX 系统的[dot-files](https://en.wikipedia.org /wiki/Dot-file) 一样。

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

这将产出与上一个例子完全相同的结果。

### 停用任务

有时候，当你在调整 gulpfile.js 时，你可能需要暂时移除某些任务，找出发生问题的根源。这时候你可以停用任务。停用任务时，连同其全部的子任务都将被停用，就如同未曾定义过一样。

要停用一个任务，可以在项目的组态中加入具有 "`disabled`" 值的 "`visibility`" 属性。

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

在这个例子中，`coffee` 任务已经被停用了。

为了简化组态配置，你也可以使用在任务名称前面附加上一个 "`#`" 字元的方式来停用任务，就像 UNIX 系统的 bash 指令档的注解一样。

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

这将产出与上一个例子完全相同的结果。

### 处理命名冲突问题

在使用 gulp-chef 时，建议你为所有的任务，分别取用唯一、容易区别的名称。

然而，如果你有非常多的任务，那么将有很高的机率，有一个以上的任务必须使用相同的 recipe 或 plugin。

在缺省情况下，任务名称必须与 recipe 名称相同，这样 gulp-chef 才有办法找到对应的 recipe。那么，当发生名称冲突时，gulp-chef 是怎么处理的呢？ gulp-chef 会自动为发生冲突的的任务，在前方附加父任务的名称，像这样："`make:scripts:concat`"。

事实上，你也可以将这个附加名称的行为变成缺省行为：在呼叫 `chef()` 函数时，在 `settings` 参数传入值为 `true` 的 "`exposeWithPrefix`" 属性即可。 "`exposeWithPrefix`" 属性的缺省值为 "`auto`"。

``` javascript
var ingredients = { ... };
var settings = { exposeWithPrefix: true };
var meals = chef(ingredients, settings);
```

不是你的菜？没关系，你也可以使用其他办法。

#### 引入新的父任务并隐藏名称冲突的任务

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

#### 使用 `recipe` 关键字

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

注意：为了尽量避免发生名称冲突的可能性，并且简化任务树，某些特定种类的任务是缺省隐藏的。主要是『__串流处理器 (stream processor)__』及『__流程控制器 (flow controller)__』。请参考 [撰写串流处理器](#writing-stream-processor) and [撰写流程控制器](#writing-flow-controller) 的说明。

### 使用 Gulp Plugins

有时候，你所撰写的任务所做的，只不过是转呼叫一个 plugin。如果只是这样的话，事实上你完全可以不用费心写一个 recipe，你可以直接在组态配置中使用 "`plugin`" 关键字做为属性来引用 plugin。

``` javascript
{
    concat: {
        plugin: 'gulp-concat',
        options: 'bundle.js'
    }
}
```

这个 "`plugin`" 属性可以接受 `string` 和 `function` 类型的值。当指定的值不是 `function` 而是 `string` 类型时，gulp-chef 将以此字串做为模组名称，尝试去 "`require()`" 该模组。使用 "`plugin`" 属性时，另外还可以指定 "`options`" 属性，该属性的值将直接做为唯一参数，用来呼叫 plugin 函数。

任何gulp plugin，只要它只接受0 或1 个参数，并且回传一个Stream 或Promise 物件，就可以使用`plugin`" 关键字来加以引用。前提当然是plugin 已经使用`npm install` 指令先安装好了。

千万不要将 gulp plugin 与 [gulp-chef 专用的 plugin](#using-plugins) 搞混了。 gulp-chef 专用的 plugin 称为 "Cascading Configurable Recipe for Gulp" 或简称 "gulp-ccr"，意思是『可层叠组态配置、可重复使用的 Gulp 任务』。

### 传递组态值

如同你到目前为止所看到的，在组态配置中的项目，要嘛是任务的属性，要不然就是子任务。你要如何区别两者？基本的规则是，除了"`config`", "`description`", "`dest`", "`name`", "`order`", "`parallel`", "`plugin`", "` recipe`", "`series`", "`spit`", "`src`", "`task`" 以及"`visibility`" 这些[关键字](#keywords)之外，其余的项目都将被视为子任务。

那么，你要如何传递组态值给你的 recipe 函数呢？其实，"`config`" 关键字就是特地为了这个目的而保留的。

``` javascript
{
    myPlugin: {
        config: {
            file: 'bundle.js'
        }
    }
}
```

这里"`config`" 属性连同其"`file`" 属性，将一起被传递给recipe 函数，而recipe 函数则透过执行环境依序取得"`config`" 属性及"`file`" 属性(在『 [撰写recipe](#writing-recipes)』中详细说明)。

``` javascript
function myPlugin(done) {
    var file = this.config.file;
    done();
}

module.exports = myPlugin;
```

只为了传递一个属性，就必须特地写一个"`config`" 项目来传递它，如果你觉得这样做太超过了，你也可以直接在任意属性名称前面附加一个"`$`" 字元，这样它们就会被视为是组态属性，而不再会被当作是子任务。

``` javascript
{
    myPlugin: {
        $file: 'bundle.js'
    }
}
```

这样 "`$file`" 项目就会被当作是组态属性，而你在组态配置及 recipe 中，可以透过 "`file`" 名称来存取它。 (注意，名称不是 "`$file`"，这是为了允许使用者可以交换使用 "`$`" 字元和 "`config`" 项目来传递组态属性。)

#### Recipe / Plugin 专属组态属性

Recipe 以及 plugin 可以使用 [JSON Schema](http://json-schema.org/) 来定义它们的组态属性及架构。如果它们确实定义了组态架构，那么你就可以在组态配置项目中，直接列举专属的属性，而不需要透过 "`$`" 字元和 "`config`" 关键字。

举例，在"[gulp-ccr-browserify](https://github.com/gulp-cookery/gulp-ccr-browserify)" plugin 中，它定义了"`bundles`" 及"`options`" 属性，因此你可以在组态项目中直接使用这两个属性。

原本需要这样写：

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

现在可以省略写成这样：

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

#### 自动识别属性

为了方便起见，当组态项目中包含有"`task`", "`series`", "`parallel`" 或"`plugin`" 关键字的时候，这时候除了保留属性之外，其余的属性都将自动认定为组态属性，而不是子任务。

### <a href="#" id="dynamic-configuration"></a> 动态组态属性 / 模板引值

有些『串流处理器』 (譬如"[gulp-ccr-each-dir](https://github.com/gulp-cookery/gulp-ccr-each-dir)")，会以程序化或动态的方式产生新的组态属性。这些新产生的属性，将在执行时期，插入到子任务的的组态中。除了recipe 及plugin 可以透过"`config`" 属性取得这些值之外，子任务也可以透过使用模板的方式，以"`{{var}}`" 这样的语法，直接在组态中引用这些值。

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

这个例子里，"[each-dir](https://github.com/gulp-cookery/gulp-ccr-each-dir)" plugin 会根据"`dir`" 属性指定的内容，也就是"`modules `" 目录，找出其下的所有子目录，然后产生新的"`dir`" 属性，透过这个属性将子目录资讯传递给每个子任务(这里只有"concat" 任务)。子任务可以透过 "`config`" 属性读取这个值。使用者也可以使用 "`{{dir}}`" 这样的语法，在组态配置中引用这个值。

### 条件式组态配置

Gulp-chef 支援条件式组态配置。可以透过设定执行时期环境的模式来启用不同的条件式组态配置。这个功能的实作是基于[json-regulator](https://github.com/amobiz/json-regulator?utm_referer="gulp-chef") 这个模组，可以参考该模组的说明以便获得更多的相关资讯。

缺省提供了 `development`, `production` 及 `staging` 三个模式。你可以在组态配置中，将相关的组态内容，分别写在对应的 `development` 或 `dev`, `production` 或 `prod` ，或 `staging` 项目之下。

譬如，如果将组态配置写成这样：

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
                // development opt​​ions
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
                // development opt​​ions
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

当启用 `development` 模式时，组态配置将被转换为：

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

而启用 `production` 模式时，组态配置将被转换为：

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

超强的！

#### 以特定的执行时期环境模式启动 Gulp

##### 经由命令行参数

``` bash
$ gulp --development build
```

也可以使用简写:

``` bash
$ gulp --dev build
```

##### 经由环境变数

在 Linux/Unix 下：

``` bash
$ NODE_ENV=development gulp build
```

同样地，若使用简写:

``` bash
$ NODE_ENV=dev gulp build
```

#### 自订执行时期环境模式

Gulp-chef 允许你自订执行时期环境模式。如果你崇尚极简主义，你甚至可以分别使用 `d`, `p` 及 `s` 代表 `development`, `production` 及 `staging` 模式。只是要记得，组态配置必须与执行时期环境模式配套才行。

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

注意到在 `settings.modes` 之下的 `default` 属性。这个属性不会定义新的模式​​，它是用来指定缺省的模式。如果没有指定 `settings.modes.default` ，那么，缺省模式会成为列在 `settings.modes` 之下的第一个模式。建议最好不要省略。

除了改变模式的代号，你甚至可以设计自己的模式，并且还能一次提供多个代号。

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

但是要注意的是，不要使用到保留给任务使用的[关键字](#keywords)。

## 内建的 Recipe

#### [clean](https://github.com/gulp-cookery/gulp-ccr-clean)

清除 `dest` 属性指定的目录。

#### [copy](https://github.com/gulp-cookery/gulp-ccr-copy)

复制由 `src` 属性指定的档案，到由 `dest` 属性指定的目录，可以选择是否移除或改变档案的相对路径。

#### [merge](https://github.com/gulp-cookery/gulp-ccr-merge)

这是一个串流处理器。回传一个新的串流，该串流只有在所有的子任务的串流都停止时才会停止。

更多资讯请参考 [merge-stream](https://www.npmjs.com/package/merge-stream) 。

#### [queue](https://github.com/gulp-cookery/gulp-ccr-queue)

这是一个串流处理器。可以汇集子任务所回传的串流，并回传一个新的串流，该串流会将子任务回传的串流，依照子任务的顺序排列在一起。

更多资讯请参考 [streamqueue](https://www.npmjs.com/package/streamqueue) 。

#### [pipe](https://github.com/gulp-cookery/gulp-ccr-pipe)

这是一个串流处理器。提供与 [`stream.Readable.pipe()`](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options) 相同的功能。方便在子任务之间递送 (pipe) 串流。

#### [parallel](https://github.com/gulp-cookery/gulp-ccr-parallel)

这是一个流程控制器。会以并行 (parallel) 的方式执行子任务，子任务之间不会互相等待。

#### [series](https://github.com/gulp-cookery/gulp-ccr-series)

这是一个流程控制器。会以序列 (series) 的方式执行子任务，前一个子任务结束之后才会执行下一个子任务。

#### [watch](https://github.com/gulp-cookery/gulp-ccr-watch)

这是一个流程控制器。负责监看指定的子任务、以及其所有子任务的来源档案，当有任何档案异动时，执行对应的指定任务。

## <a href="#" id="using-plugins"></a> 使用 Plugin

在你撰写自己的 recipe 之前，先看一下别人已经做了哪些东西，也许有现成的可以拿来用。你可以使用" `gulp recipe`"，或者，更建议使用"`gulp-ccr`"，在[github.com](https://github.com/search?utf8=%E2%9C%93&q=gulp -ccr) 和[npmjs.com](https://www.npmjs.com/search?q=gulp-ccr) 上搜寻。这个 "`gulp-ccr`" 是 "Cascading Configurable Recipe for Gulp" 的简写，意思是『可层叠组态配置、可重复使用的 Gulp 任务』。

一旦你找到了，譬如，[`gulp-ccr-browserify`](https://github.com/gulp-cookery/gulp-ccr-browserify) ，将它安装为专案的 devDependencies：

``` bash
$ npm install --save-dev gulp-ccr-browserify
```

Gulp-chef 会为你移除附加在前面的 "`gulp-ccr-`" 名称，所以你在使用 plugin 的时候，请移除 "`gulp-ccr-`" 部份。

``` javascript
{
    browserify: {
        description: 'Using the gulp-ccr-browserify plugin'
    }
}
```

## <a href="#" id="writing-recipes"></a> 撰写 Recipe

有三种 recipe： __任务型 (task)__、__串流处理器 (stream processor)__ 以及 __流程控制器 (flow controller)__。

大多数时候，你想要写的是任务型 recipe。任务型 recipe 负责做苦工，而串流处理器及流程控制器则负责操弄其它 recipe。

更多关于串流处理器及流程控制器的说明，或者你乐于分享你的 recipe，你可以写成 plugin，请参考 [撰写 Plugin](#writing-plugins) 的说明。

如果你撰写的 recipe 只打算给特定专案使用，你可以将它们放在专案根目录下的特定子目录下：

类型 |目录
---------|------------------
任务型 |gulp, gulp/tasks
串流处理器 |gulp/streams
流程控制器 |gulp/flows

如果你的 recipe 不需要组态配置，你可以像平常写 gulp task 一样的方式撰写 recipe。知道这代表什么意思吗？这代表你以前写的 gulp task 都可以直接拿来当作 recipe 用。你只需要将它们个别存放到专属的模组档案，然后放到专案根目录下的 "gulp" 目录下即可。

使用 recipe 的时候，在组态配置中，使用一个属性名称与 recipe 模组名称一模一样的项目来引用该 recipe。

譬如，假设你有一个 "`my-recipe.js`" recipe 放在 `<your-project>/gulp` 目录下。可以这样撰写组态配置来引用它：

``` javascript
var gulp = require('gulp');
var chef = require('gulp-chef');
var meals = chef({
    "my-recipe": {}
});
gulp.registry(meals);
```

就是这么简单。之后你就可以在命令行下，以 `gulp my-recipe` 指令执行它。

然而，提供组态配置的能力，才能最大化 recipe 的重复使用价值。

要让 recipe 可以处理组态内容，可以在 recipe 函数中，透过执行环境，也就是 `this` 变数，取得组态。

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

上面的 "`scripts`" recipe，在使用的时候可以像这样配置：

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

### Development / Production 模式

Gulp-chef 的 recipe 不需要自行处理条件式组态配置。组态配置在传递给 recipe 之前，已经先根据执行环境模式处理完毕。

## <a href="#" id="writing-plugins"></a> 撰写 Plugin

Gulp-chef 的 plugin，只是普通的 Node.js 模组，再加上一些必要的资讯。

### Plugin 的类型

在前面[撰写Recipe](#writing-recipes) 的部份提到过，recipe 有三种：__任务型(task)__、__串流处理器(stream processor)__ 以及__流程控制器( flow controller)__。 Gulp-chef 需要知道 plugin 的类型，才能安插必要的辅助功​​能。由于 plugin 必须使用 `npm install` 安装，gulp-chef 无法像本地的 recipe 一样，由目录决定 recipe 的类型，因此 plugin 必须自行提供类型资讯。

``` javascript
function myPlugin(done) {
    done();
}

module.exports = myPlugin;
module.exports.type = 'flow';
```

有效的类型为： "`flow`"、"`stream`" 以及 "`task`"。

### <a href="#" id="configuration-schema"></a> 组态架构 (Configuration Schema)

为了简化组态配置的处理过程，gulp-chef 鼓励使用 [JSON Schema](http://json-schema.org/) 来验证和转换组态配置。 Gulp-chef 使用[json-normalizer](https://github.com/amobiz/json-normalizer?utm_referer="gulp-chef") 来为JSON Schema 提供扩充功能，并且协助将组态内容一般化(或称正规化)，以提供最大的组态配置弹性。你可以为你的 plugin 定义组态架构，以提供属性别名、类型转换、缺省值等功能。同时，组态架构的定义内容还可以显示在命令行中，使用者可以使用指令 `gulp --recipe <recipe-name>` 查询，不必另外查阅文件，就可以了解如何撰写组态配置。请参考 [json-normalizer](https://github.com/amobiz/json-normalizer?utm_referer="gulp-chef") 的说明，了解如何定义组态架构，甚至加以扩充。

以下是一个简单的 plugin，示范如何定义组态架构：

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

首先，注意到 "`file`" 被标示为『必须』，plugin 可以利用组态验证工具自动进行检查，因此在程式中就不须要再自行判断。

另外注意到"`sourcemaps`" 选项允许"`sourcemap`" 别名，因此使用者可以在组态配置中随意使用"`sourcemaps`" 或"`sourcemap`"，但是同时在plugin 中，却只需要处理"`sourcemaps`" 即可。

#### 扩充资料型别

Gulp-chef 提供两个扩充的 JSON Schema 资料型别： "`glob`" 及 "`path`"。

##### glob

一个属性如果是 "`glob`" 型别，它可以接受一个路径、一个路径匹配表达式 (glob)，或者是一个由路径或路径匹配表达式组成的数组。另外还可以额外附带选项资料。

以下都是正确的 "`glob`" 数值：

``` javascript
// 一个路径字串
'src'
// 一个由路径字串组成的数组
['src', 'lib']
// 一个路径匹配表达式
'**/*.js'
// 一个由路径或路径匹配表达式组成的数组
['**/*.{js,ts}', '!test*']
// 非正规化的『物件表达形式』(注意 "glob" 属性)
{ glob: '**/*.js' }
```

上面所有的数值，都会被正规化为所谓的『物件表达形式』：

``` javascript
// 一个路径字串
{ globs: ['src'] }
// 一个由路径字串组成的数组
{ globs: ['src', 'lib'] }
// 一个路径匹配表达式
{ globs: ['**/*.js'] }
// 一个由路径或路径匹配表达式组成的数组
{ globs: ['**/*.{js,ts}', '!test*'] }
// 正规化之后的『物件表达形式』(注意 "glob" 属性已经正规化为 "globs")
{ globs: ['**/*.js'] }
```

注意到 "`glob`" 是 "`globs`" 属性的别名，在正规化之后，被更正为 "`globs`"。同时，"`glob`" 型别的 "`globs`" 属性的型态为数组，因此，所有的值都将自动被转换为数组。

当以『物件表达形式』呈现时，还可以使用 "`options`" 属性额外附带选项资料。

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

更多选项资料，请参考 [node-glob](https://github.com/isaacs/node-glob#options) 的说明。

在任务中，任何具有 "`glob`" 型别的组态属性，都会继承其父任务的 "`src`" 属性。这意谓着，当父任务定义了"`src`" 属性时，gulp-chef 会为子任务的"`glob`" 型别的组态属性，自动连接好父任务的"`src`" 属性的路径。

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

在这个例子中，"[browserify](https://github.com/gulp-cookery/gulp-ccr-browserify)" plugin 具有一个"`bundles`" 属性，"`bundles`" 属性下又有一个" `entries`" 属性，而该属性为"`glob`" 型别。这个 "`entries`" 属性将继承外部的 "`src`" 属性，因而变成： `{ globs: "src/main.js" }` 。

如果这不是你要的，你可以指定 "`join`" 选项来覆盖这个行为。

``` javascript
{
    src: 'src',
    browserify: {
        bundles: {
            entry: {
                glob: 'main.js',
                options: {
                    join: false
                }
            }
        }
    }
}
```

现在 "`entries`" 属性的值将成为： `{ globs: "main.js" }` 。

选项​​ "`join`" 也可以接受字串，用来指定要从哪一个属性继承路径，该属性必须是 "`glob`" 或 "`path`" 型别。

在 plugin 中，也可以透过[组态架构](#configuration-schema)来定义要继承的缺省属性。请记住，除非有好的理由，请永远记得同时将 "`options`" 传递给呼叫的 API，以便允许使用者指定选项。像这样：

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;

    return gulp.src(config.src.globs, config.src.options)
        .pipe(...);
}
```

##### path

一个属性如果是 "`path`" 型别，它可以接受一个路径字串。另外还可以额外附带选项资料。

以下都是正确的 "`path`" 数值：

``` javascript
// 一个路径字串
'dist'
// 一个路径字串
'src/lib/'
// 『物件表达形式』
{ path: 'maps/' }
```

上面所有的数值，都会被正规化为所谓的『物件表达形式』：

``` javascript
// 一个路径字串
{ path: 'dist' }
// 一个路径字串
{ path: 'src/lib/' }
// 『物件表达形式』
{ path: 'maps/' }
```

当以『物件表达形式』呈现时，还可以使用 "`options`" 属性额外附带选项资料。

``` javascript
{
    path: 'dist/',
    options: {
        cwd: './',
        overwrite: true
    }
}
```

更多选项资料，请参考 [gulp.dest()](https://github.com/gulpjs/gulp/blob/4.0/docs/API.md#options-1) 的说明。

在任务中，任何具有 "`path`" 型别的组态属性，都会继承其父任务的 "`dest`" 属性。这意谓着，当父任务定义了"`dest`" 属性时，gulp-chef 会为子任务的"`path`" 型别的组态属性，自动连接好父任务的"`dest`" 属性的路径。

``` javascript
{
    dest: 'dist/',
    scripts: {
        file: 'bundle.js'
    }
}
```

假设这里的 "`file`" 属性是 "`path`" 型别，它将会继承外部的 "`dest`" 属性，而成为： "`{ path: 'dist/bundle.js' }`"。

如果这不是你要的，你可以指定 "`join`" 选项来覆盖这个行为。

``` javascript
{
    dest: 'dist/',
    scripts: {
        file: {
            path: 'bundle.js',
            options: {
                join: false
            }
        }
    }
}
```

现在 "`file`" 属性将成为： "`{ path: 'bundle.js' }`"。

选项​​ "`join`" 也可以接受字串，用来指定要从哪一个属性继承路径，该属性必须是 "`path`" 型别。

在 plugin 中，也可以透过[组态架构](#configuration-schema)来定义要继承的缺省属性。请记住，除非有好的理由，请永远记得同时将 "`options`" 传递给呼叫的 API，以便允许使用者指定选项。像这样：

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;

    return gulp.src(config.src.globs, config.src.options)
        .pipe(...)
        .pipe(gulp.dest(config.dest.path, config.dest.options));
}
```
### <a href="#" id="writing-stream-processor"></a> 撰写串流处理器

串流处理器负责操作它的子任务输入或输出串流。

串流处理器可以自己输出串流，或者由其中的子任务输出。串流处理器可以在子任务之间递送串流；或合并；或串接子任务的串流。任何你能想像得到的处理方式。唯一必要的要求就是：串流处理器必须回传一个串流。

串流处理器由执行环境中取得 "`tasks`" 属性，子任务即是经由此属性，以数组的方式传入。

当呼叫子任务时，串流处理器必须为子任务建立适当的执行环境。

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;
    var tasks = this.tasks;
    var context, stream;

    context = {
        gulp: gulp,
        // 传入获得的组态配置，以便将上层父任务动态插入的组态属性传递给子任务
        config: config
    };
    // 如果需要的话，可以额外插入新的组态属性
    context.config.injectedValue = 'hello!';
    stream = tasks[0].call(context);
    // ...
    return stream;
};
```

注意父任务可以动态给子任务插入新的组态属性。只有新的值可以成功插入，若子任务原本就配置了同名的属性，则新插入的属性不会覆盖原本的属性。

如果要传递串流给子任务，串流处理器必须透过 "`upstream`" 属性传递。

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

如果串流处理器期望子任务回传一个串流，然而子任务却没有，那么此时串流处理器必须抛出一个错误。

注意：官方关于撰写gulp plugin 的[指导方针](https://github.com/gulpjs/gulp/blob/4.0/docs/writing-a-plugin/guidelines.md) 中提到: "__不要在串流中抛出错误(do not throw errors inside a stream)__"。没错，你不应该在串流中抛出错误。但是在串流处理器中，如果不是位于处理串流的程式流程中，而是在处理流程之外，那么，抛出错误是没有问题的。

你可以使用 [gulp-ccr-stream-helper](https://github.com/gulp-cookery/gulp-ccr-stream-helper) 来协助呼叫子任务，并且检查其是否正确回传一个串流。

你可以从[gulp-ccr-merge](https://github.com/gulp-cookery/gulp-ccr-merge) 以及[gulp-ccr-queue](https://github.com/gulp-cookery/ gulp-ccr-queue) 专案，参考串流处理器的实作。

### <a href="#" id="writing-flow-controller"></a> 撰写流程控制器

流程控制器负责控制子任务的执行时机，顺序等，而且并不关心子任务的输出、入串流。

流程控制器没有什么特别的限制，唯一的规则是，流程控制器必须正确处理子任务的结束事件。譬如，子任务可以呼叫 "`done()`" 回呼函数；回传一个串流或 Promise，等等。

你可以从[gulp-ccr-parallel](https://github.com/gulp-cookery/gulp-ccr-parallel) 、 [gulp-ccr-series](https://github.com/gulp-cookery/ gulp-ccr-series) 以及[gulp-ccr-watch](https://github.com/gulp-cookery/gulp-ccr-watch) 专案，参考流程控制器的实作。

### 测试 Plugin

建议你可以先写供专案使用的本地 recipe，完成之后，再转换为 plugin。大多数的 recipe 测试都是资料导向的，如果你的 recipe 也是这样，也许你可以考虑使用我的另一个专案： [mocha-cases](https://github.com/amobiz/mocha-cases) 。

## <a href="#" id="keywords"></a> 任务专用属性列表 (关键字)

以下的关键字保留给任务属性使用，你不能使用这些关键字做为你的任务或属性名称。

#### config

要传递给任务的组态配置。

#### description

描述任务的工作内容。

#### dest

要写出档案的路径。定义在子任务中的路径，缺省情形下会继承父任务定义的 dest 路径。属性值可以是字串，或者是如下的物件形式： `{ path: '', options: {} }` 。实际传递给任务的是后者的形式。

#### name

任务名称。通常会自动由组态项目名称获得。除非任务是定义在数组中，而你仍然希望能够在命令行中执行。

#### order

任务的执行顺序。只有在你以物件属性的方式定义子任务时，又希望子任务能够依序执行时才需要。数值仅用来排序，因此不需要是连续值。需要配合 "`series`" 属性才能发挥作用。

#### parallel

要求子任务以并行的方式同时执行。缺省情形下，以物件属性的方式定义的子任务才会并行执行。使用此关键字时，子任务不论是以数组项目或物件属性的方式定义，都将并行执行。

#### plugin

要使用的原生 gulp plugin，可以是模组名称或函数。

#### recipe

任务所要对应的 recipe 模组名称。缺省情形下与任务名称 "`name`" 属性相同。

#### series

要求子任务以序列的方式逐一执行。缺省情形下，以数组项目的方式定义的子任务才会序列执行。使用此关键字时，子任务不论是以数组项目或物件属性的方式定义，都将序列执行。

#### spit

要求任务写出档案。任务允许使用者决定要不要写出档案时才有作用。

#### src

要读入的档案来源的路径或档案匹配表达式。由于缺省情形下会继承父任务的 "`src`" 属性，通常你会在父任务中定义路径，在终端任务中才定义档案匹配表达式。属性值可以是任意合格的档案匹配表达式，或由档案匹配表达式组成的数组，或者如下的物件形式： `{ globs: [], options: {} }` 呈现。实际传递给任务的是后者的形式。

#### task

定义实际执行任务的方式。可以是普通函数的引用、内联函数或对其它任务的参照。子任务如果以数组的形式提供，子任务将以序列的顺序执行，否则子任务将以并行的方式同时执行。

#### visibility

任务的可见性。有效值为 `normal` 、 `hidden` 以及 `disabled` 。

## <a href="" id="cli-options"></a> 命令行选项列表

### --task

查询任务并显示其工作内容说明以及组态配置内容。

``` bash
$ gulp --task <task-name>
```

### --recipe

列举可用的 recipe，包含内建的 recipe、本地的 recipe 以及已安装的 plugin 。

你可以任意使用 "`--recipes`" 、 "`--recipe`" 以及 "`--r`" 。

``` bash
$ gulp --recipes
```

查询指定 recipe，显示其用途说明，以及，如果有定义的话，显示其[组态架构](#configuration-schema)。

``` bash
$ gulp --recipe <recipe-name>
```
