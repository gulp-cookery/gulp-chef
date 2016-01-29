# gulp-chef

支援 Gulp 4.0，允許巢狀配置任務及組態。以優雅、直覺的方式，重複使用 gulp 任務。

注意：此專案目前仍處於早期開發階段，因此可能還存有錯誤。請協助回報問題並分享您的使用經驗，謝謝！

## 入門

### 將 gulp cli 4.0 安裝為公用程式 (全域)

``` bash
npm install -g "gulpjs/gulp-cli#4.0"
```

### 將 gulp 4.0 安裝為專案的 devDependencies

``` bash
npm install --save-dev "gulpjs/gulp#4.0"
```

更詳細的安裝及 Gulp 4.0 入門請參閱 <<[Gulp 4.0 前瞻](http://segmentfault.com/a/1190000002528547)>> 這篇文章。

### 將 gulp-chef 安裝為專案的 devDependencies

``` bash
$ npm install --save-dev gulp-chef
```

### 在專案根目錄建立 gulpfile.js 檔案

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

### 執行 Gulp
``` bash
$ gulp
```

## 參考範例

* [example-minimal-configuration](https://github.com/gulp-cookery/example-minimal-configuration)

示範只將 gulp-chef 作為任務的黏合工具，所有的任務都是沒有組態配置、單純的 JavaScript 函數。

* [example-recipes-demo](https://github.com/gulp-cookery/example-recipes-demo)

根據 [gulp-cheatsheet](https://github.com/osscafe/gulp-cheatsheet) 的範例，展示 gulp-chef 的能耐。通常不建議以這裡採用的方式配置任務及組態。

* [example-todomvc-angularjs-browserify](https://github.com/gulp-cookery/example-todomvc-angularjs-browserify)

根據現成完整可運作的範例程式  [angularjs-gulp-example](https://github.com/jhades/angularjs-gulp-example)，示範如何將普通的 gulpfile.js 改用 gulp-chef 來撰寫。同時不要錯過了來自範例作者的好文章： "[A complete toolchain for AngularJs - Gulp, Browserify, Sass](http://blog.jhades.org/what-every-angular-project-likely-needs-and-a-gulp-build-to-provide-it/)"。

* [example-webapp-seed](https://github.com/gulp-cookery/example-webapp-seed)

一個簡單的 webapp 種子專案。


## 用語說明

### Gulp Task

一個 gulp task 只是普通的 JavaScript 函數，函數可以回傳 Promise, Observable, Stream, 子行程，或者是在完成任務時呼叫 `done()` 回呼函數。從 Gulp 4.0 開始，函數被呼叫時，其執行環境 (context)，也就是 `this` 值，是 `undefined`。

``` javascript
function gulpTask(done) {
    assert(this === null);
    // do things ...
    done();
}
```

必須使用 `gulp.task()` 函數註冊之後，函數才會成為 gulp task。

``` javascript
gulp.task(gulpTask);
```

然後才能在命列列下執行。

``` bash
$ gulp gulpTask
```

### Configurable Task

一個可組態配置的 gulp 任務在 gulp-chef 中稱為 configurable task，其函數參數配置與普通 gulp task 相同。但是被 gulp-chef 呼叫時，gulp-chef 將傳遞一個 `{ gulp, config, upstream }` 物件做為其執行環境 (context)。

``` javascript
// 注意: configurable task 不能直接撰寫，必須透過配置組態的方式來產生。
function configurableTask(done) {
    done();
}
```

你不能直接撰寫 configurable task，而是必須透過定義組態配置，並呼叫 `chef()` 函數來產生。

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

在這個範例中，gulp-chef 為你建立了一個名為 "`scripts`" 的 configurable task。注意 `chef()` 函數回傳一個 gulp registry 物件，你可以透過回傳的 gulp registry 物件，以 `meals.get('scripts')` 的方式取得該 configurable task。但是通常你會呼叫 `gulp.registry()` 來註冊所有包含在 registry 之中的任務。

``` javascript
gulp.registry(meals);
```

一旦你呼叫了 `gulp.registry()` 之後，你就可以在命令列下執行那些已註冊的任務。

``` bash
$ gulp scripts
```

當 configurable task 被呼叫時，將連同其一起配置的組態，經由其執行環境傳入，大致上是以如下的方式呼叫：

``` javascript
scripts.call({
    gulp: gulp,
    config: {
        src: 'src/**/*.js',
        dest: 'dist/'
    }
}, done);
```

另外注意到在這個例子中，在組態中的 "`scripts`" 項目，實際上對應到一個 recipe 或 plugin 的模組名稱。如果是 recipe 的話，該 recipe 模組檔案必須位於專案的 "`gulp`" 目錄下。如果對應的是 plugin 的話，該 plugin 必須先安裝到專案中。更多細節請參考『[撰寫 recipe]((#Writing_Recipes))』及『[使用 plugin](#Using_Plugins)』的說明。

### Configurable Recipe

一個支援組態配置，可供 gulp 重複使用的任務，在 gulp-chef 中稱為  configurable recipe <sub>[註]</sub>。這是你真正撰寫，並且重複使用的函數。事實上，前面提到的 "[configurable task](#Configurable_Task)"，就是透過名稱對應的方式，在組態配置中對應到真正的 configurable recipe，然後加以包裝、註冊為 gulp 任務。

``` javascript
function scripts(done) {
    // 注意：在 configurable recipe 中，你可以直接由 context 取得 gulp 實體。
    var gulp = this.gulp;
    // 注意：在 configurable recipe 中，你可以直接由 context 取得 config 組態。
    var config = this.config;

    // 用力 ...

    done();
}
```

註：在 gulp-chef 中，recipe 意指可重複使用的任務。就像一份『食譜』可以用來做無數的菜餚一樣。

## 撰寫組態配置

組態配置只是普通的 JSON 物件。組態中的每個項目、項目的子項目，要嘛是屬性 (property)，要不然就是子任務。

### 巢狀任務

任務可以巢狀配置。子任務依照組態的語法結構 (lexically)，或稱靜態語彙結構 (statically)，以層疊結構 (cascading) 的形式繼承 (inherit) 其父任務的組態。更棒的是，一些預先定義的屬性，譬如 "`src`", "`dest`" 等路徑性質的屬性，路徑會自動幫你連接好。

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

這個例子建立了__三個__ configurable tasks 任務：`build`, `scripts` 以及 `styles`。

### 並行任務

在上面的例子中，當你執行 `build` 任務時，它的子任務 `scripts` 和 `styles` 會以並行 (parallel) 的方式同時執行。並且由於繼承的關係，它們將獲得如下的組態配置：

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

### 序列任務

如果你希望任務以序列 (series) 的順序執行，你可以使用 "`series`" __流程控制器 (flow controller)__，並且在子任務的組態配置中，加上 "`order`" 屬性：

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

記住，你必須使用 "`series`" 流程控制器，子任務才會以序列的順序執行，僅僅只是加上 "`order`" 屬性並不會達到預期的效果。

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

在這個例子中，`scripts` 和 `styles` 會以並行的方式同時執行。

其實有更簡單的方式，可以使子任務以序列的順序執行：使用陣列。

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

不過，看起來似乎有點可笑？別急，請繼續往下看。

### 參照任務

你可以使用名稱來參照其他任務。向前、向後參照皆可。

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

在這個例子中，`build` 任務有三個子任務，分別參照到 `clean`, `scripts` 以及 `styles` 任務。參照任務並不會產生並註冊新的任務，所以，在這個例子中，你無法直接執行 `build` 任務的子任務，但是你可以透過執行 `build` 任務執行它們。

前面提到過，子任務依照組態的語法結構 (lexically)，或稱靜態語彙結構 (statically)，以層疊結構 (cascading) 的形式繼承 (inherit) 其父任務的組態。既然『被參照的任務』不是定義在『參照任務』之下，『被參照的任務』自然不會繼承『參照任務』及其父任務的靜態組態配置。不過，有另一種組態是執行時期動態產生的，動態組態會在執行時期注入到『被參照的任務』。更多細節請參考『[動態組態](#Dynamic_Configuration_Template_Variable_Realizing)』的說明。

在這個例子中，由於使用陣列來指定參照 `clean`, `scripts` 及 `styles` 的任務，所以是以序列的順序執行。你可以使用 "`parallel`" 流程控制器改變這個預設行為。

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

或者，其實你可以將子任務以物件屬性的方式，放在一個共同父任務之下，這樣它們就會預設以並行的方式執行。

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

你可以另外使用 "`task`" 關鍵字來引用『被參照的任務』，這樣『參照任務』本身就可以同時擁有其他屬性。

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

### 純函數 / 內聯函數

任務也可以以普通函數的方式定義並且直接引用，或以內聯匿名函數的形式引用。

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

注意在這個例子中，在組態配置中並未定義 `clean` 項目，所以`clean` 並不會被註冊為 gulp task。

另外一個需要注意的地方是，即使只是純函數，gulp-chef 呼叫時，總是會以 `{ gulp, config, upstream }` 做為執行環境來呼叫。

你一樣可以使用 "`task`" 關鍵字來引用函數，這樣任務本身就可以同時擁有其他屬性。

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

注意到與上個例子相反地，在這裡組態配置中定義了 `clean` 項目，因此 gulp-chef 會產生並註冊 `clean` 任務，所以可以由命令列執行`clean` 任務。

### 隱藏任務

有時候，某些任務永遠不需要單獨在命令列下執行。隱藏任務可以讓任務不要註冊，同時不可被其它任務引用。隱藏一個任務不會影響到它的子任務，子任務仍然會繼承它的組態配置並且註冊為 gulp 任務。隱藏任務仍然是具有功能的，但是只能透過它的父任務執行。

要隱藏一個任務，可以在項目的組態中加入具有 "`hidden`" 值的 "`visibility`" 屬性。

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

在這個例子中，`concat` 任務已經被隱藏了，然而它的子任務 `coffee` 和 `js` 依然可見。

為了簡化組態配置，你也可以使用在任務名稱前面附加上一個 "`.`" 字元的方式來隱藏任務，就像 UNIX 系統的 [dot-files](https://en.wikipedia.org/wiki/Dot-file) 一樣。

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

這將產出與上一個例子完全相同的結果。

### 停用任務

有時候，當你在調整 gulpfile.js 時，你可能需要暫時移除某些任務，找出發生問題的根源。這時候你可以停用任務。停用任務時，連同其全部的子任務都將被停用，就如同未曾定義過一樣。

要停用一個任務，可以在項目的組態中加入具有 "`disabled`" 值的 "`visibility`" 屬性。

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

在這個例子中，`coffee` 任務已經被停用了。

為了簡化組態配置，你也可以使用在任務名稱前面附加上一個 "`#`" 字元的方式來停用任務，就像 UNIX 系統的 bash 指令檔的註解一樣。

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

這將產出與上一個例子完全相同的結果。

### 處理命名衝突問題

在使用 gulp-chef 時，建議你為所有的任務，分別取用唯一、容易區別的名稱。

然而，如果你有非常多的任務，那麼將有很高的機率，有一個以上的任務必須使用相同的 recipe 或 plugin。

在預設情況下，任務名稱必須與 recipe 名稱相同，這樣 gulp-chef 才有辦法找到對應的 recipe。那麼，當發生名稱衝突時，gulp-chef 是怎麼處理的呢？gulp-chef 會自動為發生衝突的的任務，在前方附加父任務的名稱，像這樣："`make:scripts:concat`"。

事實上，你也可以將這個附加名稱的行為變成預設行為：在呼叫 `chef()` 函數時，在 `settings` 參數傳入值為 `true` 的 "`exposeWithPrefix`" 屬性即可。 "`exposeWithPrefix`" 屬性的預設值為 "`auto`"。

``` javascript
var ingredients = { ... };
var settings = { exposeWithPrefix: true };
var meals = chef(ingredients, settings);
```

不是你的菜？沒關係，你也可以使用其他辦法。

#### 引入新的父任務並隱藏名稱衝突的任務

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

#### 使用 `recipe` 關鍵字

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

注意：為了盡量避免發生名稱衝突的可能性，並且簡化任務樹，某些特定種類的任務預設是隱藏的。

Note: to minimize the chance to get into name collision and to simplify task tree, some tasks are hidden by default. 主要是『__串流處理器 (stream processor)__』及『__流程控制器 (flow controller)__』。請參考 [撰寫串流處理器](#Writing_Stream_Processor) and [撰寫流程控制器](#Writing_Flow_Controller) 的說明。

### 使用 Gulp Plugins

Sometimes your task is merely calling a plain gulp plugin. In this case, you don't even bother to write a recipe, you can use "`plugin`" keyword to reference the plugin.

``` javascript
{
    concat: {
        plugin: 'gulp-concat',
        options: 'bundle.js'
    }
}
```

The plugin property accepts "`string`" and "`function`" value. When string provided, it tries to "`require()`" the module. The "`plugin`" keyword expects an optional "`options`" configuration value, and pass to the plugin function if provided.

You can apply the "`plugin`" keyword to any gulp plugin that takes 0 or 1 parameter and returns a stream or a promise. Plugins must be installed using `npm install`.

Don't get this confused with [plugins for gulp-chef](#Using_Plugins), that stand for "Cascading Configurable Recipe for Gulp", or "gulp-ccr" for sort.

### Passing Configuration Values

As you may noted: properties in a configuration entry can be either task properties and sub tasks. How do you distinguish each one? The general rule is: except the  [keyword](#List_of_Reserved_Task_Properties_(Keywords))s "`config`", "`description`", "`dest`", "`name`", "`order`", "`parallel`", "`plugin`", "`recipe`", "`series`", "`spit`", "`src`", "`task`", and "`visibility`", all other properties are recognized as sub tasks.

So, how do you passing configuration values to your recipe function? The reserved "`config`" keyword is exactly reserved for this purpose.

``` javascript
{
    scripts: {
        config: {
            file: 'bundle.js'
        }
    }
}
```

And in recipe, take the "`file`" value via the "`config`" property (explained in [Writing Recipes](#Writing_Recipes)).

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
    scripts: {
        $file: 'bundle.js'
    }
}
```

Now the property "`$file`" will be recognized as a configuration value, and you can use "`$file`"  and "`file`" interchangeable in your recipe, though  "`file`" is recommended to allow using the "`config`" keyword.

#### Recipe / Plugin Reserved Configuration Properties

Recipes and plugins can [define](#Configuration_Schema) their own configuration properties using [JSON Schema](http://json-schema.org/). In this case, you can write configuration values directly inside the configuration entry without the "`config`" keyword. For example, the "gulp-ccr-browserify" plugin defines "`bundles`", and "`options`" properties, you can put them directly inside the configuration entry.

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

For convenience sake, when a configuration entry uses any of "`task`", "`series`",  "`parallel`",  and "`plugin`" keywords, it is considered there is no ambiguous between sub tasks and properties, and all non-reserved properties will be recognized as the task's properties.

### Dynamic Configuration / Template Variable Realizing

Some stream processors (e.g., "gulp-ccr-eachdir") programmatically modify and/or generate new configuration values. The new configuration values are injected to recipe's configuration at runtime. And templates with `{{var}}` syntax are realized (or interpolated) with resolved variables.

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

Here the "`each-dir`" plugin iterates sub folders of "`modules`" folder that was denoted by the "`dir`" property, and generates a new "`dir`" property, passing to each sub tasks. Sub tasks can read this value in their "`config`" property, and user can use the "`{{dir}}`" syntax to reference the value in configuration.

### Conditional Configurations

Gulp-chef supports conditional configurations via runtime environment modes. This functionality is based on [json-regulator](https://github.com/amobiz/json-regulator?utm_referer="gulp-chef"), check it out for more information.

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

However, you can't use [keywords](#List_of_Reserved_Task_Properties_(Keywords)) reserved for task properties, of course.

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

## Using Plugins

Before you write your own recipes, take a look and find out what others already done, maybe there is a perfect one for you. You can search [github.com](https://github.com/search?utf8=%E2%9C%93&q=gulp-ccr) and [npmjs.com](https://www.npmjs.com/search?q=gulp-ccr) using keyword: "`gulp recipe`", or the recommended: "`gulp-ccr`".  The term "`gulp-ccr`" stand for "Cascading Configurable Recipe for Gulp".

Once you found one, say, `gulp-ccr-browserify`, install it in your project's devDependencies:

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

## Writing Recipes

There are 3 kinds of recipes: "__task__", "__stream processor__", and "__flow controller__".

Most of the time, you want to write task recipes. Task recipes are the actual task that do things, whereas `stream processor`s and `flow controller`s manipulate other tasks.

For more information about `stream processor` and `flow controller`, or you are willing to share your recipes, you can write them as plugins. Check out [Writing Plugins](#Writing_Plugins) for how.

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
var meals = chef({
    "my-recipe": {}
});
```

That's it. And then you can run it by executing `gulp my-recipe` in CLI.

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

To simplify the processing of configuration, gulp-chef encourages using "[JSON Schema](http://json-schema.org/)" to validate and transform configuration. Gulp-chef use "[json-normalizer](https://github.com/amobiz/json-normalizer?utm_referer="gulp-chef")" to provide extend JSON schema functionality and to normalize configuration. You can define your configuration schema to support property alias, type conversion, and default value, etc. Check out "[json-normalizer](https://github.com/amobiz/json-normalizer?utm_referer="gulp-chef")" for how to extend your schema.

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

Also note the "`sourcemaps`" options has alias "`sourcemap`", user can use both property name interchangeable, whereas the plugin needs only to deal with "`sourcemaps`".

#### Extended Data Types

Gulp-chef provides two extended data type for JSON schema: "`glob`" and "`path`".

##### glob

A "`glob`" property can accepts a path, an array of paths, a glob, an array of globs, and optionally along with options.

The following all are valid glob values:

``` javascript
// a path string
'src'
// an array of path string
['src', 'lib']
// a glob
'**/*.js'
// an array of globs
['**/*.{js,ts}', '!test*']
// object form
{ glob: ['**/*.js', '**/*.ts', '!test*'] }
```

All above values will be normalized to their "object form":

``` javascript
// a path string
{ globs: ['src'] }
// an array of path string
{ globs: ['src', 'lib'] }
// a glob
{ globs: ['src/**/*.js'] }
// an array of globs
{ globs: ['**/*.{js,ts}', '!test*'] }
// object form (note that 'glob' was normalized to 'globs')
{ globs: ['**/*.js', '**/*.ts', '!test*'] }
```

Note that "`glob`" is alias of "`globs`" property, and will be normalized as is, and all globs values will be converted to array.

In its object form, a glob property can take options.

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

In this example, the "browserify" plugin has a "`bundles`" property that has an nested "`entries`" property of glob type. The "`entries`" property will inherit "`src`" property, and has the value: `{ globs: "src/main.js" }`.

If you don't want this behavior, you can specify "`override`" option to override it.

``` javascript
{
    src: 'src',
    browserify: {
        bundles: {
            entry: {
                glob: 'main.js',
                override: true
            }
        }
    }
}
```

Now the "`entries`" property will have the value: `{ globs: "main.js", options: { override: true } }`.

In your plugin, always remember to pass "`options`" properties (to whatever API you use) and write code like this to allow user specify options:

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

Assume that the "`file`" property is of type "path", it will inherit "`dest`" property and have the value: "`{ path: 'dist/bundle.js' }`".

If you don't want this behavior, you can specify "`override`" option to override it.

``` javascript
{
    dest: 'dist/',
    scripts: {
        file: {
            path: 'bundle.js',
            override: true
        }
    }
}
```

Now the "`file`" property will have the value: "`{ path: 'bundle.js', options: { override: true } }`".

In your plugin, always remember to pass "`options`" properties (to whatever API you use) and write code like this to allow user specify options:

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;

    return gulp.src(config.src.globs, config.src.options)
        .pipe(...)
        .pipe(gulp.dest(config.dest.path, config.dest.options));
}
```
### Writing Stream Processor

A stream processor manipulates its sub tasks' input and/or output streams.

A stream processor may generate streams itself, or from it's sub tasks. A stream processor can pass stream between sub tasks; or merge, or queue streams from sub tasks, any thing you can imaging.

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
        config: {
            // inject configuration values for sub task
        }
    };
    stream = tasks[0].call(context);
    // ...
    return stream;
};
```

Note that parent can inject dynamic configuration to sub tasks. Only new value can be injected: the injected value won't overwrite sub task's existing configuration value.

When passing stream to the sub task, a stream processor must setup a context with "`upstream`" property for the sub task.

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;
    var tasks = this.tasks;
    var context, stream, i;

    context = {
        gulp: gulp,
        config: {
        }
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

### Writing Flow Controller

A flow controller takes care of when to execute, and execution order of its sub tasks and don't care their input and/or output streams.

There is little limitation on flow controller. The only rule is a flow controller must ensure its sub tasks ended properly, say, calling the "`done()`" callback, returning a stream or a promise, etc. Check out [gulp-ccr-parallel](https://github.com/gulp-cookery/gulp-ccr-parallel), [gulp-ccr-series](https://github.com/gulp-cookery/gulp-ccr-series), and [gulp-ccr-watch](https://github.com/gulp-cookery/gulp-ccr-watch) for example.

### Testing Plugin

It is recommended you start writing your plugin as a local recipe, and transform to a plugin when you think it is done. Most recipe testings are data-driven, if this is your case, maybe you want give [mocha-cases](https://github.com/amobiz/mocha-cases) a shot.

### List of Reserved Task Properties (Keywords)

These keywords are reserved for task properties, you can't use them as task names or property names.

#### config

Configuration values of the task.

#### description

Description of the task.

#### dest

The path where files should be written. Path should be resolved to a single directory. Path defined in sub tasks inherits parent's path. The property value can be any valid path string, or of the form `{ path: '', options: {} }`, and will be passed to task with the later form.

#### name

Name of the task. Only required when defining task in an array and you want to run it from CLI.

#### order

Execution order of the task. Only required when you are defining tasks in object and want them be executed in series. Order values are used for sorting, so don't have to be contiguous.

#### parallel

Instruct sub tasks to run in parallel. Sub tasks can be defined in an array or object. Note sub tasks defined in an object are executed in parallel by default.

#### plugin

A plugin module name to use.

#### recipe

Recipe module name to use. Defaults to the same value of `name`.

#### series

Instruct sub tasks to run in series. Sub tasks can be defined in an array or object. Note sub tasks defined in an array are executed in series by default.

#### spit

Instruct task to write file(s) out if was optional.

#### src

The path or glob that files should be loaded. Normally you define paths in parent task and files in leaf tasks. Files defined in sub tasks inherits parent's path. The property value can be any valid glob, or array of globs, or of the form `{ globs: [], options: {} }`, and will be passed to task with the later form.

#### task

Define a plain function, inline function, or references to other tasks. If provided as an array, child tasks are forced to run in series, otherwise child tasks are running in parallel.

#### visibility

Visibility of the task. Valid values are `normal`, `hidden`, and `disabled`.


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

Look up a recipe and display its description and configuration schema if available.

``` bash
$ gulp --recipe <recipe-name>
```
