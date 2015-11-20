'use strict';

var gulp = require('gulp');

//var createGulpTasks = require('gulp-config-task-runner');
var createGulpTasks = require('.');

var config = {
	src: 'src',
	dest: 'dist'
};

// (stylus, autoprefix, minify 是內建支援的 recipe task)
// (src, base, cwd, eachdir, dest, flatten, file 是保留字，用來決定 task 如何輸入輸出, 優先性：file > dest)
// (options 是保留字，做為傳遞給 task 的選項結構)
// (join, merge, 是 stream 處理選項，不會輸出為 task)
var SampleConfigs = {
	"globs": {
		"single-glob": {
			// same as:
			//   gulp.src('**/*.css')
			"src": "**/*.css",
			// The path (output folder) to write files to.
			"dest": "css"
		},
		"multiple-globs": {
			// same as:
			//   gulp.src(['bootstrap/css/**/*.{css,less}','views/**/*.{css,stylus}'])
			"src": ["bootstrap/css/**/*.{css,less}", "views/**/*.{css,stylus}"],
			"dest": "css"
		},
		'with-flat-options': {
			// same as:
			//   gulp.src(['app/*.css', 'views/**/*.stylus'], { base: '.', read: false })
			"src": {
				"globs" /* or glob */ : ["app/*.css", "views/**/*.stylus"],
				"base": ".",
				"read": false
			},
			//
			"dest": {
				"path": "css",
				"cwd": "src"
			}
		},
		"with-dedicated-options": {
			// same as:
			//   gulp.src(['app/*.css', 'views/**/*.stylus'], { base: '.', read: false })
			"src": {
				"globs": ["app/*.css", "views/**/*.stylus"],
				"options": {
					"base": ".",
					"read": false
				}
			},
			"dest": {
				"path": "css",
				"options": {
					"cwd": "src"
				}
			}
		}
	},
	// flow tasks
	"flows": {
		"parallel-in-object": {
			"parallel": {
				"task-1": {},
				"task-2": {},
				"inline": function (gulp, config, stream, done) {}
			}
		},
		"parallel-in-array": {
			"parallel": ["ref-task-1", "ref-task-2", function (gulp, config, stream, done) {}]
		},
		"series-in-object": {
			// Note that while many implementations preserve the order of object properties, the ECMAScript Language Specification explicitly states that:
			// The mechanics and order of enumerating the properties is not specified.
			// So if you rely on the order in which your series of functions are executed, and want this to work on all platforms, consider using an array.
			// Or, you can add an "order" property to sub-task.
			// https://github.com/caolan/async#seriestasks-callback
			"series": {
				"task-1": {
					"order": 0	// just used to sort
				},
				"task-2": {
					"order": 1
				},
				"named-inline": {
					"order": 2,
					"task": function (gulp, config, stream, done) {}
				},
				"inline": function (gulp, config, stream, done) {}
			}
		},
		"series-in-array": {
			"series": ["ref-task-1", "ref-task-2", function (gulp, config, stream, done) {}]
		},
		// not recommended
		"series-in-object-array": {
			"series": [{
				"ref-task-1": {}
			}, {
				"ref-task-2": {}
			}, {
				"inline": function (gulp, config, stream, done) {
				}
			}]
		}
	},
	"streams": {
		// 維持目錄結構，但以 css 目錄為輸出目錄；
		// 所有的檔案個別獨立輸入輸出處理，輸出時維持匹配的目錄結構與檔名；
		// stylus 與 css 兩個子 task 分別依檔案類型 (.stylus, .css) 進行個別處理；
		// 由於未指定 stylus 與 css 的合併行為，兩個 stream 將各自獨立並行處理，
		// 但最終以 merge-stream 合併，輸出為單一 stream，做為 styles 的輸出 stream。
		// (merge-stream 不會合併含入的 stream 的內容，
		// 僅僅只是為了方便處理非同步的多個 stream：
		// 當所有的 stream 都 end 時，輸出的 stream 才會觸發 end event。)
		"styles:1": {
			// 不論 recipe 本身是否接受 src, dest 屬性，任何 task 都可以定義這兩個屬性，
			// 此時，這兩個屬性可供子 task 繼承，或者進行路徑合併 (路徑限定)。
			"dest": "dist",
			"parallel": {
				"stylus": {
					"src": "**/*.stylus",
					// 注意：stylus 繼承了 styles:1 的 dest 屬性，並且定義了自己的 dest 屬性，
					// 在預設行為下，這將進行路徑合併動作，以此例而言，stylus 最終得到的是 'dist/css' 路徑。
					// 特別注意，即使當 stylus 被獨立執行時，該 dest 屬性仍然是 'dist/css'。
					"dest": "css",	// 輸出到 dist/css 目錄
					"options": {}
				},
				"css": {
					"src": "**/*.css",
					"dest": "css",	// 輸出到 dist/css 目錄
					// 在名稱前端加上 . 的 task 將被隱藏，名稱不會輸出 (不會成為 gulp task)，但仍然可透過父 task 間接執行；
					// 在名稱前端加上 # 的 task，連同其全部的子 task，將直接被忽略，不會輸出為 task (即如同註解效果，暫時移除該 task)；
					// 在名稱尾端加上 ? 的 task 只在 development mode 下執行 (直接 by pass，不影響 sub task 的執行，sub task 仍然會繼承相關 config)；
					// 在名稱尾端加上 ! 的 task 只在 production mode 下執行 (直接 by pass，不影響 sub task 的執行，sub task 仍然會繼承相關 config)。
					".autoprefix": {
					}
				}
			}
		},
		// 上例中，sub-task (stylus, css) 是定義在 parallel flow task 內部，因此 stylus 與 css task 將同步執行。
		// 實際上，這是 stream task 的預設行為，因此，可以省略 parallel，直接簡寫為以下形式：
		"styles:1-2": {
			"dest": "dist/css",
			"stylus": {
				"src": "**/*.stylus"
			},
			"css": {
				"src": "**/*.css",
				".autoprefix": {}
			}
		},
		// 輸出單一檔案到 css 目錄；
		// 所有的檔案個別獨立輸入輸出處理，最後透過 concat 串接後，以 file 屬性指定的檔名輸出；
		// stylus 與 css 兩個子 task 分別依檔案類型 (.stylus, .css) 進行個別處理。
		// 由於指定 stylus 與 css 的合併行為 concat，
		// 兩個 stream 將各自獨立並行處理，但最終經由 concat 串接，輸出為單一 stream，做為 styles:2 的輸出 stream。
		"styles:2": {
			"dest": "dist", // 統一輸出到 dist 目錄
			".concat": {
				"file": "styles.css",
				"stylus": {
					"src": "**/*.stylus"
				},
				"css": {
					"src": "**/*.css",
					".autoprefix": {
					}
				}
			}
		},
		// 打散目錄結構，統一輸出到 css 目錄；
		// 所有的檔案個別獨立輸入輸出處理，最後透過 minify 壓縮後輸出，輸出時，打散目錄結構但保留檔名；
		// stylus 與 css 兩個子 task 分別依檔案類型 (.stylus, .css) 進行個別處理；
		// 由於未指定 stylus 與 css 的合併行為，兩個 stream 將各自獨立並行處理，
		// 但最終以 merge-stream 合併，輸出為單一 stream，做為 styles 的輸出 stream。
		// (跟上一個項目的區別，僅在於有無 flatten: true)
		"styles:3": {
			"flatten": true, // 打散目錄結構
			"dest": "css", // 統一輸出到 css 目錄
			".minify!": {
				"stylus": {
					"src": "**/*.stylus",
					"options": {}
				},
				"css": {
					"src": "**/*.css",
					".autoprefix": {
					}
				}
			}
		},
		'styles:4': {
			"dest": "css", // 輸出到 css 目錄
			".minify!": {
				// 合併所有的檔案，輸出到單一檔案，檔名為 css/main.min.css
				"file": "main.min.css",
				"join": {
					// 合併所有的檔案，輸出到單一檔案，檔名為 css/main.css
					"file": "main.css",
					"stylus": {
						"src": "**/*.stylus",
						"options": {}
					},
					"css": {
						"src": "**/*.css",
						".autoprefix": {
						}
					}
				}
			}
		},
		'styles:5': {
			"eachdir": {
				"src": "views",
				"dest": "css", // 輸出到 css 目錄
				// 針對每個目錄，合併目錄下所有的檔案，輸出到單一檔案，
				// 檔名為 css/{目錄名稱}.min.css
				// '#dir in views'
				".minify!": {
					"file": "{{dir}}.min.js",
					"join": {
						// 合併所有的檔案，輸出到單一檔案，檔名為 css/{目錄名稱}.css
						"file": "{{dir}}.js",
						"stylus": {
							"src": "**/*.stylus", // src/views/{{dir}}/**/*.stylus
							"options": {}
						},
						"css": {
							"src": "**/*.css",
							".autoprefix": {
							}
						}
					}
				}
			}
		},
		// 合併相關的檔案，輸出到個別的指定檔案
		"styles:6": {
			"dest": "css", // 輸出到 css 目錄
			".minify!": [{
				"file": "common.min.css",
				"join": {
					"file": "common.css",
					"stylus": {
						"src": "common/*.stylus",
						"options": {}
					},
					"css": {
						"src": "common/*.css",
						".autoprefix": {
						}
					}
				}
			}, {
				"file": "main.min.css",
				"join": {
					"file": "main.css",
					"stylus": {
						"src": "app/*.stylus",
						"options": {}
					},
					"css": {
						".autoprefix": {
							"src": "app/*.css"
						}
					}
				}
			}, {
				"file": "options.min.css",
				"join": {
					"file": "options.css",
					"stylus": {
						"src": "options/**/*.stylus",
						"options": {}
					},
					"css": {
						".autoprefix": {
							"src": "options/**/*.css"
						}
					}
				}
			}]
		}
	},
	"runtime": {
		"commonConfigs": {},
		"production": {
			"productionConfigs": {},
			"options": {
				"productionOptions": {}
			}
		},
		"development": {
			"developmentConfigs": {},
			"options": {
				"developmentOptions": {}
			}
		},
		"options": {
			"commonOptions": {},
			"production": {
				"productionOptions": {}
			},
			"development": {
				"developmentOptions": {}
			}
		}
	},
	"incremental": {
		"scripts": {

		},
		"styles": {

		},
		"markups": {

		},
		"images": {

		}
	},
	"serve": {

	},
	"modules": {
		"src": "modules",
		"dest": "lib",
		"eachdir": {
			"task": {
				"scripts": {

				},
				"styles": {

				},
				"markups": {

				},
				"images": {

				}
			}
		}
	},
	"build": [
		["clean"],
		["scripts", ["stylus", "css"], "markups", "images"]
	],
	"watch": ["scripts", "styles", "markups", "images"]
};

var taskConfigs = {
	"dest": "dist",
	"images": {
		"src": "**/*.{png,jpg,gif}",
		"flatten": true
	},
	"styles": {
		"stylus": {
			"src": "**/*.stylus"
		},
		"css": {
			"src": "**/*.css"
		}
	},
	"scripts": {
		"browserify": {
			"options": {
				"transform": [],
				"shim": {}
			},
			"bundles": [{
				"entries": "index",
				"require": "",
				"external": "",
				"file": "1",
				//dest: ""
			}, {
				"entries": "options",
				"file": "2"
			}]
		},
		"bookmarklet": {
			"src": "**/*.js",
			"dest": "dist"
		}
	},
	"_concat": {
		"concat": {
			"src": "../test/_fixtures/modules/**/*.js",
			"file": "main.js"
		}
	},
	"_eachdir": {
		"src": "../test/_fixtures/modules",
		"eachdir": {
			"copy": {
				"src": "{{dir}}/**/*.js",
				"dest": "{{dir}}",
				"flatten": true
			}
		}
	},
	"browserify": {
		"src": "test/_fixtures/app/modules",
		"dest": "dist",
		"bundles": [{
			"entries": ["directives/index.js"],
			"file": "directives.js",
		}, {
			"entries": ["services/index.js"],
			"file": "services.js",
		}]
	},
	// Bundle modules with concat for each folder.
	"modules:concat": {
		"src": "../test/_fixtures/modules",
		"uglify!": {
			"file": "main.min.js",
			".concat": {
				"src": "**/*.js",
				"file": "main.js",
			}
		}
	},
	"modules:pipe": {
		"src": "../test/_fixtures/modules",
		"pipe": {
			".concat": {
				"src": "**/*.js",
				"file": "main.js",
			},
			".uglify": {
				"file": {
					"extname": ".min.js"
				}
			}
		}
	},
	"modules:uglify": {
		"src": "../test/_fixtures/modules",
		".uglify": {
			"src": "**/*.js",
			"file": {
				"extname": ".min.js"
			}
		}
	},
	// Bundle modules with Browserify for each folder.
	"modules": {
		"src": "../test/_fixtures/modules",
		"eachdir": {
			".browserify": {
				"bundle": {
					"entries": "{{dir}}/index.js",
					"file": "{{dir}}.js",
				}
			}
		}
	},
	"markups": {
		"src": "../test/_fixtures/modules/**/*.html",
		'flatten': true
	},
	 "module2": {
	     "src": "../test/_fixtures/modules",
	     "directives": {
	         ".browserify": {
	             "bundle": {
	                 "entries": "directives/index.js",
	                 "file": "directives.js",
	             }
	         }
	     },
	     "services": {
	         ".browserify": {
	             "bundle": {
	                 "entries": "services/index.js",
	                 "file": "services.js",
	             }
	         }
	     },
	     "views": {
	         ".browserify": {
	             "bundle": {
	                 "entries": "views/index.js",
	                 "file": "views.js",
	             }
	         }
	     }
	 },
	 "foreach": {
		 "each": {
			 "values": [{
				 "dir": "directives"
			 }, {
				 "dir": "services"
			 }, {
				 "dir": "views"
			 }],
			 "process": {
				 "task": function (gulp, config, stream, done) {
					 var emptyStream = require("./src/helpers/streams").empty();
					 console.log(config.dir);
					 return emptyStream;
				 }
		     }
	     }
	 },
	 "manifest": {
	 },
	 "locales": {
	 },
	 "serve": {
	 },
	 "bump": {
		 "target": ["bower.json"]
	 },
	 "clean": {
	 },
	 "lint": {
	 },
	 "deploy": {
	 },
	 "through": {
	     "task": function () {
	         var EmptyStream  = require("./src/helpers/empty_stream");
	         return new EmptyStream();
	     }
	 },
	 "build": {
	     "depends": ["clean"],
	     "task": ["scripts", "styles", "markups", "images"]
	 },
	 "build2": {
	     "depends": ["clean"],
	     "task": function () {
	         gulp.start("scripts", "styles", "markups", "images");
	     }
	 },
	 "watch": {
	     "task": ["scripts", "styles", "markups", "images"]
	 },
	 "test": {
		 "task": function () {
			 var mocha = require("gulp-mocha");
			 return gulp.src(["test/specs/**/*_test.js"], { read: false })
				 .pipe(mocha({
					 reporter: "spec",
					 timeout: Infinity
				 }));
		 }
	 },
	 "default": {
	     "task": ["build"]
	 }
};

var recipes = createGulpTasks(taskConfigs, config);
gulp.registry(recipes);

gulp.task('test', function () {
	var mocha = require('gulp-mocha');
	return gulp.src(['test/specs/**/*_test.js'], {
			read: false
		})
		.pipe(mocha({
			reporter: 'spec',
			timeout: Infinity
		}));
});


