# gulp-chef

支援 Gulp 4.0，允許巢狀配置任務及組態。以優雅、直覺的方式，重複使用 gulp 任務。

寫程式的時候你謹守 DRY 原則，那編寫 gulpfile.js 的時候，為什麼不呢？

注意：此專案目前仍處於早期開發階段，因此可能還存有錯誤。請協助回報問題並分享您的使用經驗，謝謝！

[![加入在 https://gitter.im/gulp-cookery/gulp-chef 上的討論](https://badges.gitter.im/gulp-cookery/gulp-chef.svg)](https://gitter.im/gulp-cookery/gulp-chef?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## 功能

* 支援 Gulp 4.0，
* 自動載入本地通用任務 (recipe)，
* 支援透過 npm 安裝 plugin，
* 支援巢狀任務並且允許子任務繼承組態配置，
* 支援向前、向後參照任務，
* 透過組態配置即可處理串流：譬如 merge, queue, 或者 concat，
* 透過組態配置即可控制子任務的執行： parallel 或者 series，
* 支援條件式組態配置，
* 支援命令列指令，查詢可用的 recpies 及使用方式，以及
* 支援命令列指令，查詢可用的任務說明及其組態配置。

## 問與答

### 問： gulp-chef 違反了 gulp 的『編碼優於組態配置 (preferring code over configuration)』哲學嗎？

__答__： 沒有， 你還是像平常一樣寫程式， 並且將可變動部份以組態配置的形式萃取出來。

Gulp-chef 透過簡化以下的工作來提昇使用彈性：

* [分割任務到不同的檔案](https://github.com/gulpjs/gulp/blob/master/docs/recipes/split-tasks-across-multiple-files.md)，以及
* [讓任務可分享並立即可用](https://github.com/gulpjs/gulp/tree/master/docs/recipes)。

### 問： 有其它類似的替代方案嗎？

__答__： 有，像 [gulp-cozy](https://github.com/lmammino/gulp-cozy), [gulp-load-subtasks](https://github.com/skorlir/gulp-load-subtasks), [gulp-starter](https://github.com/vigetlabs/gulp-starter), [elixir](https://github.com/laravel/elixir)， 還有[更多其他方案](https://github.com/search?utf8=%E2%9C%93&q=gulp+recipes&type=Repositories&ref=searchresults)。

### 問： 那麼，跟其它方案比起來，gulp-chef 的優勢何在？

__答__：

* Gulp-chef 不是侵入式的。它不強迫也不限定你使用它的 API 來撰寫通用任務 (recipe)。
* Gulp-chef 強大且易用。它提供了最佳實務作法，如：合併串流、序列串流等。這表示，你可以讓任務『[只做一件事並做好 (do one thing and do it well)](https://en.wikipedia.org/wiki/Unix_philosophy)』，然後使用組態配置來組合任務。
* Gulp-chef 本身以及共享任務 (plugin) 都是標準的 node 模組。你可以透過 npm 安裝並管理依賴關係，不再需要手動複製工具程式庫或任務程式碼，不再需要擔心忘記更新某個專案的任務，或者擔心專案之間的任務版本因各自修改而導致不一致的狀況。
* Gulp-chef 提供極大的彈性，讓你依喜好方式決定如何使用它： 『[最精簡 (minimal)](https://github.com/gulp-cookery/example-minimal-configuration)』 或 『[最全面 (maximal)](https://github.com/gulp-cookery/example-recipes-demo)』，隨你選擇。

## 入門

### 將 gulp cli 4.0 安裝為公用程式 (全域安裝)

Gulp-chef 目前僅支援 gulp 4.0。如果你還沒開始使用 gulp 4.0，你需要先將全域安裝的舊 gulp 版本替換為新的 gulp-cli。

``` bash
npm uninstall -g gulp
```

``` bash
npm install -g "gulpjs/gulp-cli#4.0"
```

不用擔心，新的 gulp-cli 同時支援 gulp 4.0 與 gulp 3.x。所以你可以在既有的專案中繼續使用 gulp 3.x。

### 將 gulp 4.0 安裝為專案的 devDependencies

``` bash
npm install --save-dev "gulpjs/gulp#4.0"
```

更詳細的安裝及 Gulp 4.0 入門請參閱 <<[Gulp 4.0 前瞻](http://segmentfault.com/a/1190000002528547)>> 這篇文章。

### 將 gulp-chef 安裝為專案的 devDependencies

``` bash
$ npm install --save-dev gulp-chef
```

### 根據你的專案的需要，安裝相關的 plugin 為專案的 devDependencies

``` bash
npm install --save-dev gulp-ccr-browserify gulp-ccr-postcss browserify-shim stringify stylelint postcss-import postcss-cssnext lost cssnano
```

### 在專案根目錄建立 gulpfile.js 檔案

``` javascript
var gulp = require('gulp');
var chef = require('gulp-chef');

var ingredients = {
    src: 'src/',
    dest: 'dist/',
    clean: {},
    make: {
        postcss: {
            src: 'styles.css',
            processors: {
                stylelint: {},
                import: {},
                cssnext: {
                    features: {
                        autoprefixer: {
                            browser: 'last 2 versions'
                        }
                    }
                },
                lost: {},
                production: {
                    cssnano: {}
                }
            }
        },
        browserify: {
            bundle: {
                entry: 'main.js',
                file: 'scripts.js',
                transform: ['stringify', 'browserify-shim'],
                production: {
                    uglify: true
                }
            }
        },
        assets: {
            src: [
                'index.html',
                'favicon.ico',
                'opensearch.xml'
            ],
            recipe: 'copy'
        }
    },
    build: ['clean', 'make'],
    default: 'build'
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

一個簡單的 web app 種子專案。同時也可以當做是一個示範使用本地 recipe 的專案。


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

然後才能在命令列下執行。

``` bash
$ gulp gulpTask
```

### <a href="#" id="configurable-task"></a> Configurable Task

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

另外注意到在這個例子中，在組態中的 "`scripts`" 項目，實際上對應到一個 recipe 或 plugin 的模組名稱。如果是 recipe 的話，該 recipe 模組檔案必須位於專案的 "`gulp`" 目錄下。如果對應的是 plugin 的話，該 plugin 必須先安裝到專案中。更多細節請參考『[撰寫 recipe](#writing-recipes)』及『[使用 plugin](#using-plugins)』的說明。

### Configurable Recipe

一個支援組態配置，可供 gulp 重複使用的任務，在 gulp-chef 中稱為  configurable recipe <sub>[註]</sub>，其函數參數配置也與普通 gulp task 相同，在被 gulp-chef 呼叫時，gulp-chef 也將傳遞一個 `{ gulp, config, upstream }` 物件做為其執行環境 (context)。這是你真正撰寫，並且重複使用的函數。事實上，前面提到的 "[configurable task](#configurable-task)"，就是透過名稱對應的方式，在組態配置中對應到真正的 configurable recipe，然後加以包裝、註冊為 gulp 任務。

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

註：在 gulp-chef 中，recipe 意指可重複使用的任務。就像一份『食譜』可以用來做出無數的菜餚一樣。

## 撰寫組態配置

組態配置只是普通的 JSON 物件。組態中的每個項目、項目的子項目，要嘛是屬性 (property)，要不然就是子任務。

### 巢狀任務

任務可以巢狀配置。子任務依照組態的語法結構 (lexically)，或稱靜態語彙結構 (statically)，以層疊結構 (cascading) 的形式繼承 (inherit) 其父任務的組態。更棒的是，一些預先定義的屬性，譬如 "`src`", "`dest`" 等路徑性質的屬性，gulp-chef 會自動幫你連接好路徑。

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

前面提到過，子任務依照組態的語法結構 (lexically)，或稱靜態語彙結構 (statically)，以層疊結構 (cascading) 的形式繼承 (inherit) 其父任務的組態。既然『被參照的任務』不是定義在『參照任務』之下，『被參照的任務』自然不會繼承『參照任務』及其父任務的靜態組態配置。不過，有另一種組態是執行時期動態產生的，動態組態會在執行時期注入到『被參照的任務』。更多細節請參考『[動態組態](#dynamic-configuration)』的說明。

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

事實上，你也可以將這個附加名稱的行為變成預設行為：在呼叫 `chef()` 函數時，在 `settings` 參數傳入值為 `true` 的 "`exposeWithPrefix`" 屬性即可。 "`exposeWithPrefix`" 屬性的預設值為 `"auto"`。

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

注意：為了盡量避免發生名稱衝突的可能性，並且簡化任務樹，某些特定種類的任務預設是隱藏的。主要是『__串流處理器 (stream processor)__』及『__流程控制器 (flow controller)__』。請參考 [撰寫串流處理器](#writing-stream-processor) and [撰寫流程控制器](#writing-flow-controller) 的說明。

### 使用 Gulp Plugins

有時候，你所撰寫的任務所做的，只不過是轉呼叫一個 plugin。如果只是這樣的話，事實上你完全可以不用費心寫一個 recipe，你可以直接在組態配置中使用 "`plugin`" 關鍵字做為屬性來引用 plugin。

``` javascript
{
    concat: {
        plugin: 'gulp-concat',
        options: 'bundle.js'
    }
}
```

這個 "`plugin`" 屬性可以接受 `string` 和 `function` 類型的值。當指定的值不是 `function` 而是 `string` 類型時，gulp-chef 將以此字串做為模組名稱，嘗試去 "`require()`" 該模組。使用 "`plugin`" 屬性時，另外還可以指定 "`options`" 屬性，該屬性的值將直接做為唯一參數，用來呼叫 plugin 函數。

任何 gulp plugin，只要它只接受 0 或 1 個參數，並且回傳一個 Stream 或 Promise 物件，就可以使用 `plugin`" 關鍵字來加以引用。前提當然是 plugin 已經使用 `npm install` 指令先安裝好了。

千萬不要將 gulp plugin 與 [gulp-chef 專用的 plugin](#using-plugins) 搞混了。gulp-chef 專用的 plugin 稱為 "Cascading Configurable Recipe for Gulp" 或簡稱 "gulp-ccr"，意思是『可層疊組態配置、可重複使用的 Gulp 任務』。

### 傳遞組態值

如同你到目前為止所看到的，在組態配置中的項目，要嘛是任務的屬性，要不然就是子任務。你要如何區別兩者？基本的規則是，除了 "`config`", "`description`", "`dest`", "`name`", "`order`", "`parallel`", "`plugin`", "`recipe`", "`series`", "`spit`", "`src`", "`task`" 以及 "`visibility`" 這些[關鍵字](#keywords)之外，其餘的項目都將被視為子任務。

那麼，你要如何傳遞組態值給你的 recipe 函數呢？其實，"`config`" 關鍵字就是特地為了這個目的而保留的。

``` javascript
{
    myPlugin: {
        config: {
            file: 'bundle.js'
        }
    }
}
```

這裡 "`config`" 屬性連同其 "`file`" 屬性，將一起被傳遞給 recipe 函數，而 recipe 函數則透過執行環境依序取得 "`config`" 屬性及 "`file`" 屬性 (在『[撰寫 recipe](#writing-recipes)』中詳細說明)。

``` javascript
function myPlugin(done) {
    var file = this.config.file;
    done();
}

module.exports = myPlugin;
```

只為了傳遞一個屬性，就必須特地寫一個 "`config`" 項目來傳遞它，如果你覺得這樣做太超過了，你也可以直接在任意屬性名稱前面附加一個 "`$`" 字元，這樣它們就會被視為是組態屬性，而不再會被當作是子任務。

``` javascript
{
    myPlugin: {
        $file: 'bundle.js'
    }
}
```

這樣 "`$file`" 項目就會被當作是組態屬性，而你在組態配置及 recipe 中，可以透過 "`file`" 名稱來存取它。 (注意，名稱不是 "`$file`"，這是為了允許使用者可以交換使用 "`$`" 字元和 "`config`" 項目來傳遞組態屬性。)

#### Recipe / Plugin 專屬組態屬性

Recipe 以及 plugin 可以使用 [JSON Schema](http://json-schema.org/) 來定義它們的組態屬性及架構。如果它們確實定義了組態架構，那麼你就可以在組態配置項目中，直接列舉專屬的屬性，而不需要透過 "`$`" 字元和 "`config`" 關鍵字。

舉例，在 "[gulp-ccr-browserify](https://github.com/gulp-cookery/gulp-ccr-browserify)" plugin 中，它定義了 "`bundles`" 及 "`options`" 屬性，因此你可以在組態項目中直接使用這兩個屬性。

原本需要這樣寫：

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

現在可以省略寫成這樣：

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

#### 自動識別屬性

為了方便起見，當組態項目中包含有 "`task`", "`series`",  "`parallel`" 或 "`plugin`" 關鍵字的時候，這時候除了保留屬性之外，其餘的屬性都將自動認定為組態屬性，而不是子任務。

### <a href="#" id="dynamic-configuration"></a>  動態組態屬性 / 模板引值

有些『串流處理器』 (譬如 "[gulp-ccr-each-dir](https://github.com/gulp-cookery/gulp-ccr-each-dir)")，會以程序化或動態的方式產生新的組態屬性。這些新產生的屬性，將在執行時期，插入到子任務的的組態中。除了 recipe 及 plugin 可以透過 "`config`" 屬性取得這些值之外，子任務也可以透過使用模板的方式，以 "`{{var}}`" 這樣的語法，直接在組態中引用這些值。

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

這個例子裡，"[each-dir](https://github.com/gulp-cookery/gulp-ccr-each-dir)" plugin 會根據 "`dir`" 屬性指定的內容，也就是 "`modules`" 目錄，找出其下的所有子目錄，然後產生新的 "`dir`" 屬性，透過這個屬性將子目錄資訊傳遞給每個子任務 (這裡只有 "concat" 任務)。子任務可以透過 "`config`" 屬性讀取這個值。使用者也可以使用 "`{{dir}}`" 這樣的語法，在組態配置中引用這個值。

### 條件式組態配置

Gulp-chef 支援條件式組態配置。可以透過設定執行時期環境的模式來啟用不同的條件式組態配置。這個功能的實作是基於 [json-regulator](https://github.com/amobiz/json-regulator?utm_referer="gulp-chef") 這個模組，可以參考該模組的說明以便獲得更多的相關資訊。

預設提供了 `development`, `production` 及 `staging` 三個模式。你可以在組態配置中，將相關的組態內容，分別寫在對應的 `development` 或 `dev`, `production` 或 `prod` ，或 `staging`  項目之下。

譬如，如果將組態配置寫成這樣：

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

當啟用 `development` 模式時，組態配置將被轉換為：

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

而啟用 `production` 模式時，組態配置將被轉換為：

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

超強的！

#### 以特定的執行時期環境模式啟動 Gulp

##### 經由命令列參數

``` bash
$ gulp --development build
```

也可以使用簡寫:

``` bash
$ gulp --dev build
```

##### 經由環境變數

在 Linux/Unix 下：

``` bash
$ NODE_ENV=development gulp build
```

同樣地，若使用簡寫:

``` bash
$ NODE_ENV=dev gulp build
```

#### 自訂執行時期環境模式

Gulp-chef 允許你自訂執行時期環境模式。如果你崇尚極簡主義，你甚至可以分別使用 `d`, `p` 及 `s` 代表 `development`, `production` 及 `staging` 模式。只是要記得，組態配置必須與執行時期環境模式配套才行。

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

注意到在 `settings.modes` 之下的 `default` 屬性。這個屬性不會定義新的模式，它是用來指定預設的模式。如果沒有指定 `settings.modes.default` ，那麼，預設模式會成為列在 `settings.modes` 之下的第一個模式。建議最好不要省略。

除了改變模式的代號，你甚至可以設計自己的模式，並且還能一次提供多個代號。

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

但是要注意的是，不要使用到保留給任務使用的[關鍵字](#keywords)。

## 內建的 Recipe

#### [clean](https://github.com/gulp-cookery/gulp-ccr-clean)

清除 `dest` 屬性指定的目錄。

#### [copy](https://github.com/gulp-cookery/gulp-ccr-copy)

複製由 `src` 屬性指定的檔案，到由 `dest` 屬性指定的目錄，可以選擇是否移除或改變檔案的相對路徑。

#### [merge](https://github.com/gulp-cookery/gulp-ccr-merge)

這是一個串流處理器。回傳一個新的串流，該串流只有在所有的子任務的串流都停止時才會停止。

更多資訊請參考 [merge-stream](https://www.npmjs.com/package/merge-stream) 。

#### [queue](https://github.com/gulp-cookery/gulp-ccr-queue)

這是一個串流處理器。可以匯集子任務所回傳的串流，並回傳一個新的串流，該串流會將子任務回傳的串流，依照子任務的順序排列在一起。

更多資訊請參考 [streamqueue](https://www.npmjs.com/package/streamqueue) 。

#### [pipe](https://github.com/gulp-cookery/gulp-ccr-pipe)

這是一個串流處理器。提供與 [`stream.Readable.pipe()`](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options) 相同的功能。方便在子任務之間遞送 (pipe) 串流。

#### [parallel](https://github.com/gulp-cookery/gulp-ccr-parallel)

這是一個流程控制器。會以並行 (parallel) 的方式執行子任務，子任務之間不會互相等待。

#### [series](https://github.com/gulp-cookery/gulp-ccr-series)

這是一個流程控制器。會以序列 (series) 的方式執行子任務，前一個子任務結束之後才會執行下一個子任務。

#### [watch](https://github.com/gulp-cookery/gulp-ccr-watch)

這是一個流程控制器。負責監看指定的子任務、以及其所有子任務的來源檔案，當有任何檔案異動時，執行對應的指定任務。

## <a href="#" id="using-plugins"></a>  使用 Plugin

在你撰寫自己的 recipe 之前，先看一下別人已經做了哪些東西，也許有現成的可以拿來用。你可以使用" `gulp recipe`"，或者，更建議使用 "`gulp-ccr`"，在 [github.com](https://github.com/search?utf8=%E2%9C%93&q=gulp-ccr) 和 [npmjs.com](https://www.npmjs.com/search?q=gulp-ccr)  上搜尋。這個 "`gulp-ccr`" 是  "Cascading Configurable Recipe for Gulp" 的簡寫，意思是『可層疊組態配置、可重複使用的 Gulp 任務』。

一旦你找到了，譬如，[`gulp-ccr-browserify`](https://github.com/gulp-cookery/gulp-ccr-browserify) ，將它安裝為專案的 devDependencies：

``` bash
$ npm install --save-dev gulp-ccr-browserify
```

Gulp-chef 會為你移除附加在前面的 "`gulp-ccr-`" 名稱，所以你在使用 plugin 的時候，請移除 "`gulp-ccr-`" 部份。

``` javascript
{
    browserify: {
        description: 'Using the gulp-ccr-browserify plugin'
    }
}
```

## <a href="#" id="writing-recipes"></a>  撰寫 Recipe

斯斯，不是，recipe 有三種： __任務型 (task)__、__串流處理器 (stream processor)__ 以及 __流程控制器 (flow controller)__。

大多數時候，你想要寫的是任務型 recipe。任務型 recipe 負責做苦工，而串流處理器及流程控制器則負責操弄其它 recipe。

更多關於串流處理器及流程控制器的說明，或者你樂於分享你的 recipe，你可以寫成 plugin，請參考 [撰寫 Plugin](#writing-plugins) 的說明。

如果你撰寫的 recipe 只打算給特定專案使用，你可以將它們放在專案根目錄下的特定子目錄下：

類型      |目錄
---------|------------------
任務型    |gulp, gulp/tasks
串流處理器 |gulp/streams
流程控制器 |gulp/flows

如果你的 recipe 不需要組態配置，你可以像平常寫 gulp task 一樣的方式撰寫 recipe。知道這代表什麼意思嗎？這代表你以前寫的 gulp task 都可以直接拿來當作 recipe 用。你只需要將它們個別存放到專屬的模組檔案，然後放到專案根目錄下的 "gulp" 目錄下即可。

使用 recipe 的時候，在組態配置中，使用一個屬性名稱與 recipe 模組名稱一模一樣的項目來引用該 recipe。

譬如，假設你有一個 "`my-recipe.js`" recipe 放在 `<your-project>/gulp` 目錄下。可以這樣撰寫組態配置來引用它：

``` javascript
var gulp = require('gulp');
var chef = require('gulp-chef');
var meals = chef({
    "my-recipe": {}
});
gulp.registry(meals);
```

就是這麼簡單。之後你就可以在命令列下，以 `gulp my-recipe` 指令執行它。

然而，提供組態配置的能力，才能最大化 recipe 的重複使用價值。

要讓 recipe 可以處理組態內容，可以在 recipe 函數中，透過執行環境，也就是 `this` 變數，取得組態。

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

上面的 "`scripts`" recipe，在使用的時候可以像這樣配置：

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

Gulp-chef 的 recipe 不需要自行處理條件式組態配置。組態配置在傳遞給 recipe 之前，已經先根據執行環境模式處理完畢。

## <a href="#" id="writing-plugins"></a>  撰寫 Plugin

Gulp-chef 的 plugin，只是普通的 Node.js 模組，再加上一些必要的資訊。

### Plugin 的類型

在前面 [撰寫 Recipe](#writing-recipes) 的部份提到過，recipe 有三種：__任務型 (task)__、__串流處理器 (stream processor)__ 以及 __流程控制器 (flow controller)__。Gulp-chef 需要知道 plugin 的類型，才能安插必要的輔助功能。由於 plugin 必須使用 `npm install` 安裝，gulp-chef 無法像本地的 recipe 一樣，由目錄決定 recipe 的類型，因此 plugin 必須自行提供類型資訊。

``` javascript
function myPlugin(done) {
    done();
}

module.exports = myPlugin;
module.exports.type = 'flow';
```

有效的類型為： "`flow`"、"`stream`" 以及 "`task`"。

### <a href="#" id="configuration-schema"></a>  組態架構 (Configuration Schema)

為了簡化組態配置的處理過程，gulp-chef 鼓勵使用 [JSON Schema](http://json-schema.org/) 來驗證和轉換組態配置。Gulp-chef 使用 [json-normalizer](https://github.com/amobiz/json-normalizer?utm_referer="gulp-chef") 來為 JSON Schema 提供擴充功能，並且協助將組態內容一般化 (或稱正規化)，以提供最大的組態配置彈性。你可以為你的 plugin 定義組態架構，以提供屬性別名、類型轉換、預設值等功能。同時，組態架構的定義內容還可以顯示在命令列中，使用者可以使用指令 `gulp --recipe <recipe-name>` 查詢，不必另外查閱文件，就可以了解如何撰寫組態配置。請參考 [json-normalizer](https://github.com/amobiz/json-normalizer?utm_referer="gulp-chef") 的說明，了解如何定義組態架構，甚至加以擴充。

以下是一個簡單的 plugin，示範如何定義組態架構：

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

首先，注意到 "`file`" 被標示為『必須』，plugin 可以利用組態驗證工具自動進行檢查，因此在程式中就不須要再自行判斷。

另外注意到 "`sourcemaps`" 選項允許 "`sourcemap`" 別名，因此使用者可以在組態配置中隨意使用 "`sourcemaps`" 或 "`sourcemap`"，但是同時在 plugin 中，卻只需要處理 "`sourcemaps`"  即可。

#### 擴充資料型別

Gulp-chef 提供兩個擴充的 JSON Schema 資料型別： "`glob`" 及 "`path`"。

##### glob

一個屬性如果是 "`glob`" 型別，它可以接受一個路徑、一個路徑匹配表達式 (glob)，或者是一個由路徑或路徑匹配表達式組成的陣列。另外還可以額外附帶選項資料。

以下都是正確的 "`glob`" 數值：

``` javascript
// 一個路徑字串
'src'
// 一個由路徑字串組成的陣列
['src', 'lib']
// 一個路徑匹配表達式
'**/*.js'
// 一個由路徑或路徑匹配表達式組成的陣列
['**/*.{js,ts}', '!test*']
// 非正規化的『物件表達形式』(注意 "glob" 屬性)
{ glob: '**/*.js' }
```

上面所有的數值，都會被正規化為所謂的『物件表達形式』：

``` javascript
// 一個路徑字串
{ globs: ['src'] }
// 一個由路徑字串組成的陣列
{ globs: ['src', 'lib'] }
// 一個路徑匹配表達式
{ globs: ['**/*.js'] }
// 一個由路徑或路徑匹配表達式組成的陣列
{ globs: ['**/*.{js,ts}', '!test*'] }
// 正規化之後的『物件表達形式』(注意 "glob" 屬性已經正規化為 "globs")
{ globs: ['**/*.js'] }
```

注意到 "`glob`" 是 "`globs`" 屬性的別名，在正規化之後，被更正為 "`globs`"。同時，"`glob`" 型別的 "`globs`" 屬性的型態為陣列，因此，所有的值都將自動被轉換為陣列。

當以『物件表達形式』呈現時，還可以使用 "`options`" 屬性額外附帶選項資料。

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

更多選項資料，請參考 [node-glob](https://github.com/isaacs/node-glob#options) 的說明。

在任務中，任何具有 "`glob`" 型別的組態屬性，都會繼承其父任務的 "`src`" 屬性。這意謂著，當父任務定義了 "`src`" 屬性時，gulp-chef 會為子任務的 "`glob`" 型別的組態屬性，自動連接好父任務的 "`src`" 屬性的路徑。

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

在這個例子中，"[browserify](https://github.com/gulp-cookery/gulp-ccr-browserify)" plugin 具有一個 "`bundles`" 屬性，"`bundles`" 屬性下又有一個 "`entries`" 屬性，而該屬性為 "`glob`" 型別。這個 "`entries`" 屬性將繼承外部的 "`src`" 屬性，因而變成： `{ globs: "src/main.js" }` 。

如果這不是你要的，你可以指定 "`join`" 選項來覆蓋這個行為。

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

現在 "`entries`" 屬性的值將成為： `{ globs: "main.js" }` 。

選項 "`join`" 也可以接受字串，用來指定要從哪一個屬性繼承路徑，該屬性必須是 "`glob`" 或 "`path`" 型別。

在 plugin 中，也可以透過[組態架構](#configuration-schema)來定義預設要繼承的屬性。請記住，除非有好的理由，請永遠記得同時將 "`options`" 傳遞給呼叫的 API，以便允許使用者指定選項。像這樣：

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;

    return gulp.src(config.src.globs, config.src.options)
        .pipe(...);
}
```

##### path

一個屬性如果是 "`path`" 型別，它可以接受一個路徑字串。另外還可以額外附帶選項資料。

以下都是正確的 "`path`" 數值：

``` javascript
// 一個路徑字串
'dist'
// 一個路徑字串
'src/lib/'
// 『物件表達形式』
{ path: 'maps/' }
```

上面所有的數值，都會被正規化為所謂的『物件表達形式』：

``` javascript
// 一個路徑字串
{ path: 'dist' }
// 一個路徑字串
{ path: 'src/lib/' }
// 『物件表達形式』
{ path: 'maps/' }
```

當以『物件表達形式』呈現時，還可以使用 "`options`" 屬性額外附帶選項資料。

``` javascript
{
    path: 'dist/',
    options: {
        cwd: './',
        overwrite: true
    }
}
```

更多選項資料，請參考 [gulp.dest()](https://github.com/gulpjs/gulp/blob/4.0/docs/API.md#options-1) 的說明。

在任務中，任何具有 "`path`" 型別的組態屬性，都會繼承其父任務的 "`dest`" 屬性。這意謂著，當父任務定義了 "`dest`" 屬性時，gulp-chef 會為子任務的 "`path`" 型別的組態屬性，自動連接好父任務的 "`dest`" 屬性的路徑。

``` javascript
{
    dest: 'dist/',
    scripts: {
        file: 'bundle.js'
    }
}
```

假設這裡的 "`file`" 屬性是 "`path`" 型別，它將會繼承外部的 "`dest`" 屬性，而成為： "`{ path: 'dist/bundle.js' }`"。

如果這不是你要的，你可以指定 "`join`" 選項來覆蓋這個行為。

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

現在 "`file`" 屬性將成為： "`{ path: 'bundle.js' }`"。

選項 "`join`" 也可以接受字串，用來指定要從哪一個屬性繼承路徑，該屬性必須是 "`path`" 型別。

在 plugin 中，也可以透過[組態架構](#configuration-schema)來定義預設要繼承的屬性。請記住，除非有好的理由，請永遠記得同時將 "`options`" 傳遞給呼叫的 API，以便允許使用者指定選項。像這樣：

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;

    return gulp.src(config.src.globs, config.src.options)
        .pipe(...)
        .pipe(gulp.dest(config.dest.path, config.dest.options));
}
```
### <a href="#" id="writing-stream-processor"></a>  撰寫串流處理器

串流處理器負責操作它的子任務輸入或輸出串流。

串流處理器可以自己輸出串流，或者由其中的子任務輸出。串流處理器可以在子任務之間遞送串流；或合併；或串接子任務的串流。任何你能想像得到的處理方式。唯一必要的要求就是：串流處理器必須回傳一個串流。

串流處理器由執行環境中取得 "`tasks`" 屬性，子任務即是經由此屬性，以陣列的方式傳入。

當呼叫子任務時，串流處理器必須為子任務建立適當的執行環境。

``` javascript
module.exports = function () {
    var gulp = this.gulp;
    var config = this.config;
    var tasks = this.tasks;
    var context, stream;

    context = {
        gulp: gulp,
        // 傳入獲得的組態配置，以便將上層父任務動態插入的組態屬性傳遞給子任務
        config: config
    };
    // 如果需要的話，可以額外插入新的組態屬性
    context.config.injectedValue = 'hello!';
    stream = tasks[0].call(context);
    // ...
    return stream;
};
```

注意父任務可以動態給子任務插入新的組態屬性。只有新的值可以成功插入，若子任務原本就配置了同名的屬性，則新插入的屬性不會覆蓋原本的屬性。

如果要傳遞串流給子任務，串流處理器必須透過 "`upstream`" 屬性傳遞。

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

如果串流處理器期望子任務回傳一個串流，然而子任務卻沒有，那麼此時串流處理器必須拋出一個錯誤。

注意：官方關於撰寫 gulp plugin 的 [指導方針](https://github.com/gulpjs/gulp/blob/4.0/docs/writing-a-plugin/guidelines.md) 中提到: "__不要在串流中拋出錯誤 (do not throw errors inside a stream)__"。 沒錯，你不應該在串流中拋出錯誤。但是在串流處理器中，如果不是位於處理串流的程式流程中，而是在處理流程之外，那麼，拋出錯誤是沒有問題的。

你可以使用 [gulp-ccr-stream-helper](https://github.com/gulp-cookery/gulp-ccr-stream-helper) 來協助呼叫子任務，並且檢查其是否正確回傳一個串流。

你可以從 [gulp-ccr-merge](https://github.com/gulp-cookery/gulp-ccr-merge) 以及 [gulp-ccr-queue](https://github.com/gulp-cookery/gulp-ccr-queue) 專案，參考串流處理器的實作。

### <a href="#" id="writing-flow-controller"></a>  撰寫流程控制器

流程控制器負責控制子任務的執行時機，順序等，而且並不關心子任務的輸出、入串流。

流程控制器沒有什麼特別的限制，唯一的規則是，流程控制器必須正確處理子任務的結束事件。譬如，子任務可以呼叫 "`done()`" 回呼函數；回傳一個串流或 Promise，等等。

你可以從  [gulp-ccr-parallel](https://github.com/gulp-cookery/gulp-ccr-parallel) 、 [gulp-ccr-series](https://github.com/gulp-cookery/gulp-ccr-series) 以及 [gulp-ccr-watch](https://github.com/gulp-cookery/gulp-ccr-watch) 專案，參考流程控制器的實作。

### 測試 Plugin

建議你可以先寫供專案使用的本地 recipe，完成之後，再轉換為 plugin。大多數的 recipe 測試都是資料導向的，如果你的 recipe 也是這樣，也許你可以考慮使用我的另一個專案： [mocha-cases](https://github.com/amobiz/mocha-cases) 。

## <a href="#" id="keywords"></a> 任務專用屬性列表 (關鍵字)

以下的關鍵字保留給任務屬性使用，你不能使用這些關鍵字做為你的任務或屬性名稱。

#### config

要傳遞給任務的組態配置。

#### description

描述任務的工作內容。

#### dest

要寫出檔案的路徑。定義在子任務中的路徑，預設會繼承父任務的定義的 dest 路徑。屬性值可以是字串，或者是如下的物件形式： `{ path: '', options: {} }` 。實際傳遞給任務的是後者的形式。

#### name

任務名稱。通常會自動由組態項目名稱獲得。除非任務是定義在陣列中，而你仍然希望能夠在命令列中執行。

#### order

任務的執行順序。只有在你以物件屬性的方式定義子任務時，又希望子任務能夠依序執行時才需要。數值僅用來排序，因此不需要是連續值。需要配合 "`series`" 屬性才能發揮作用。

#### parallel

要求子任務以並行的方式同時執行。預設情形下，以物件屬性的方式定義的子任務才會並行執行。使用此關鍵字時，子任務不論是以陣列項目或物件屬性的方式定義，都將並行執行。

#### plugin

要使用的原生 gulp plugin，可以是模組名稱或函數。

#### recipe

任務所要對應的 recipe 模組名稱。預設與任務名稱 "`name`" 屬性相同。

#### series

要求子任務以序列的方式逐一執行。預設情形下，以陣列項目的方式定義的子任務才會序列執行。使用此關鍵字時，子任務不論是以陣列項目或物件屬性的方式定義，都將序列執行。

#### spit

要求任務寫出檔案。任務允許使用者決定要不要寫出檔案時才有作用。

#### src

要讀入的檔案來源的路徑或檔案匹配表達式。由於預設會繼承父任務的 "`src`" 屬性，通常你會在父任務中定義路徑，在終端任務中才定義檔案匹配表達式。屬性值可以是任意合格的檔案匹配表達式，或由檔案匹配表達式組成的陣列，或者如下的物件形式： `{ globs: [], options: {} }` 呈現。實際傳遞給任務的是後者的形式。

#### task

定義實際執行任務的方式。可以是普通函數的引用、內聯函數或對其它任務的參照。子任務如果以陣列的形式提供，子任務將以序列的順序執行，否則子任務將以並行的方式同時執行。

#### visibility

任務的可見性。有效值為 `normal` 、 `hidden` 以及 `disabled` 。


## <a href="#" id="settings"></a> 設定選項

設定選項可以改變 gulp-chef 的預設行為，以及用來定義自訂條件式組態配置的執行時期環境模式。

設定選項是經由 `chef()` 方法的第二個參數傳遞：

``` javascript
var config = {
};
var settings = {
};
var meals = chef(config, settings);
```

### settings.exposeWithPrefix

開關自動附加任務名稱功能。預設值為 `"auto"`，當發生名稱衝突時，gulp-chef 會自動為發生衝突的的任務，在前方附加父任務的名稱，像這樣："`make:scripts:concat`"。你可以設定為 `true` 強制開啟。設定為 `false` 強制關閉，此時若遇到名稱衝突時，會拋出錯誤。

### settings.lookups

設定本地通用任務模組 (recipe) 的查找目錄。預設值為：

``` javascript
{
    lookups: {
        flows: 'flows',
        streams: 'streams',
        tasks: 'tasks'
    }
}
```

#### settings.lookups.flows

設定本地流程控制器的查找目錄。預設值為 `"flows"` 。

#### settings.lookups.streams

設定本地串流處理器的查找目錄。預設值為 `"streams"` 。

#### settings.lookups.tasks

設定本地通用任務的查找目錄。預設值為 `"tasks"` 。

### settings.plugins

傳遞給 "[gulp-load-plugins](https://github.com/jackfranklin/gulp-load-plugins)" 的選項。
Gulp-chef 使用 "gulp-load-plugins" 來載入共享任務模組，或稱為 "gulp-ccr" 模組。
預設情形下，不是以 `"gulp-ccr"` 名稱開頭的共享任務模組將不會被載入。你可以透過更改 "`plugins`" 選項來載入這些模組。

預設選項為：

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

#### settings.plugins.DEBUG

當設定為 `true` 時，"gulp-load-plugins" 將輸出 log 訊息到 console。

#### settings.plugins.camelize

若設定為 `true`，使用 `"-"` 連接的名稱將被改為駝峰形式。

#### settings.plugins.config

由何處查找共享任務模組的資訊。預設為專案的 package.json。

#### settings.plugins.pattern

共享任務模組的路徑匹配表達式 (glob)。預設為 `"gulp-ccr-*"`。

#### settings.plugins.scope

要查找哪些相依範圍。預設為：

``` javascript
['dependencies', 'devDependencies', 'peerDependencies'].
```

#### settings.plugins.replaceString

要移除的模組附加名稱。預設為： `/^gulp[-.]ccr[-.]/g` 。

#### settings.plugins.lazy

是否延遲載入模組。預設為 `true`。

#### settings.plugins.rename

指定改名。必須為 hash 物件。鍵為原始名稱，值為改名名稱。

#### settings.plugins.renameFn

改名函數。

### settings.modes

定義自訂條件式組態配置的執行時期環境模式。

除了 `default` 屬性是用來指定預設模式之外，其餘的屬性名稱定義新的模式，而值必須是陣列，陣列的項目是可用於組態配置及命令列的識別字代號。注意不要使用到保留給任務使用的[關鍵字](#keywords)。預設為：

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


## <a href="" id="cli-options"></a> 命令列選項列表

### --task

查詢任務並顯示其工作內容說明以及組態配置內容。

``` bash
$ gulp --task <task-name>
```

### --recipe

列舉可用的 recipe，包含內建的 recipe、本地的 recipe 以及已安裝的 plugin 。

你可以任意使用 "`--recipes`" 、 "`--recipe`" 以及 "`--r`" 。

``` bash
$ gulp --recipes
```

查詢指定 recipe，顯示其用途說明，以及，如果有定義的話，顯示其[組態架構](#configuration-schema)。

``` bash
$ gulp --recipe <recipe-name>
```

## 專案建制與貢獻

``` bash
$ git clone https://github.com/gulp-cookery/gulp-chef.git
$ cd gulp-chef
$ npm install
```

## 問題提報

[Issues](https://github.com/gulp-cookery/gulp-chef/issues)

## 測試

測試是以 [mocha](https://mochajs.org/) 撰寫，請在命令列下執行下列指令：

``` bash
$ npm test
```

## 授權

[MIT](http://opensource.org/licenses/MIT)

## 作者

[Amobiz](https://github.com/amobiz)
