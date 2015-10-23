var gulp = require('gulp');

//var createGulpTasks = require('gulp-config-task-runner');
var createGulpTasks = require('./src');

var config = {
	src: 'src',
	dest: 'dist'
};

// (stylus, autoprefix, minify 是內建支援的 task)
// (src, base, cwd, eachdir, dest, flatten, file 是保留字，用來決定 task 如何輸入輸出, 優先性：file > dest)
// (options 是保留字，做為傳遞給 task 的選項結構)
// (join, merge, 是 stream 處理選項，不會輸出為 task)
var ideaTaskConfigs = {
	// TODO: globs with options
	'glob-samples': {
		'single-glob': {
			// same as:
			//   gulp.src('**/*.css')
			src: '**/*.css',
			// The path (output folder) to write files to.
			dest: 'css'
		},
		'multiple-globs': {
			// same as:
			//   gulp.src(['bootstrap/css/**/*.{css,less}','views/**/*.{css,stylus}'])
			src: ['bootstrap/css/**/*.{css,less}', 'views/**/*.{css,stylus}'],
			dest: 'css'
		},
		'with-options': {
			// same as:
			//   gulp.src(['app/*.css', 'views/**/*.stylus'], { base: '.', read: false })
			src: {
				globs /* or glob */ : ['app/*.css', 'views/**/*.stylus'],
				base: '.',
				read: false
			},
			//
			dest: {
				path: 'css',
				cwd: 'src'
			}
		}
	},
	// 維持目錄結構，但以 css 目錄為輸出目錄；
	// 所有的檔案個別獨立輸入輸出處理，輸出時維持匹配的目錄結構與檔名；
	// stylus 與 css 兩個子 task 分別依檔案類型 (.stylus, .css) 進行個別處理；
	// 由於未指定 stylus 與 css 的合併行為，兩個 stream 將各自獨立並行處理，
	// 但最終以 merge-stream 合併，輸出為單一 stream，做為 styles 的輸出 stream。
	// (merge-stream 不會合併含入的 stream 的內容，
	// 僅僅只是為了方便處理非同步的多個 stream：
	// 當所有的 stream 都 end 時，輸出的 stream 才會觸發 end event。)
	'styles:1': {
		dest: 'css',
		parallel: {
			stylus: {
				src: '**/*.stylus',
				// 注意：stylus 繼承了 styles 的 dest 屬性，
				// 即使當 stylus 獨立被執行時，仍然擁有該 dest 屬性。
				options: {}
			},
			css: {
				'.autoprefix': {
					src: '**/*.css'
				}
			}
		}
	},
	// 維持目錄結構，但以 css 目錄為輸出目錄；
	// 所有的檔案個別獨立輸入輸出處理，最後透過 minify 壓縮後輸出，並維持目錄結構與檔名；
	// stylus 與 css 兩個子 task 分別依檔案類型 (.stylus, .css) 進行個別處理；
	// 由於未指定 stylus 與 css 的合併行為，兩個 stream 將各自獨立並行處理，
	// 但最終以 merge-stream 合併，輸出為單一 stream，做為 styles 的輸出 stream。
	'styles:2': {
		dest: 'css', // 統一輸出到 css 目錄
		'.minify!': { // 在名稱前端加上 . 的 task 將被隱藏，名稱不會輸出 (不會成為 gulp task)，但仍然可透過父 task 間接執行；
			// 在名稱前端加上 # 的 task，連同其全部的子 task，將直接被忽略，不會輸出為 task (即如同註解效果，暫時移除該 task)；
			// 在名稱尾端加上 ? 的 task 只在 development mode 下執行 (直接 by pass，不影響 sub task 的執行，sub task 仍然會繼承相關 config)；
			// 在名稱尾端加上 ! 的 task 只在 production mode 下執行 (直接 by pass，不影響 sub task 的執行，sub task 仍然會繼承相關 config)。
			stylus: {
				src: '**/*.stylus',
				options: {}
			},
			css: {
				'.autoprefix': {
					src: '**/*.css'
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
	'styles:3': {
		flatten: true, // 打散目錄結構
		dest: 'css', // 統一輸出到 css 目錄
		'.minify!': {
			stylus: {
				src: '**/*.stylus',
				options: {}
			},
			css: {
				'.autoprefix': {
					src: '**/*.css'
				}
			}
		}
	},
	'styles:4': {
		dest: 'css', // 輸出到 css 目錄
		'.minify!': {
			// 合併所有的檔案，輸出到單一檔案，檔名為 css/main.min.css
			file: 'main.min.css',
			join: {
				// 合併所有的檔案，輸出到單一檔案，檔名為 css/main.css
				file: 'main.css',
				stylus: {
					src: '**/*.stylus',
					options: {}
				},
				css: {
					'.autoprefix': {
						src: '**/*.css'
					}
				}
			}
		}
	},
	'styles:5': {
		eachdir: {
			src: 'views',
			dest: 'css', // 輸出到 css 目錄
			// 針對每個目錄，合併目錄下所有的檔案，輸出到單一檔案，
			// 檔名為 css/{目錄名稱}.min.css
			// '#dir in views'
			'.minify!': {
				file: '{{dir}}.min.js',
				join: {
					// 合併所有的檔案，輸出到單一檔案，檔名為 css/{目錄名稱}.css
					file: '{{dir}}.js',
					stylus: {
						src: '**/*.stylus', // src/views/{{dir}}/**/*.stylus
						options: {}
					},
					css: {
						'.autoprefix': {
							src: '**/*.css'
						}
					}
				}
			}
		}
	},
	// 合併相關的檔案，輸出到個別的指定檔案
	'styles:6': {
		dest: 'css', // 輸出到 css 目錄
		'.minify!': [{
			file: 'common.min.css',
			join: {
				file: 'common.css',
				stylus: {
					src: 'common/*.stylus',
					options: {}
				},
				css: {
					'.autoprefix': {
						src: 'common/*.css'
					}
				}
			}
		}, {
			file: 'main.min.css',
			join: {
				file: 'main.css',
				stylus: {
					src: 'app/*.stylus',
					options: {}
				},
				css: {
					'.autoprefix': {
						src: 'app/*.css'
					}
				}
			}
		}, {
			file: 'options.min.css',
			join: {
				file: 'options.css',
				stylus: {
					src: 'options/**/*.stylus',
					options: {}
				},
				css: {
					'.autoprefix': {
						src: 'options/**/*.css'
					}
				}
			}
		}]
	},
	incremental: {
		scripts: {

		},
		styles: {

		},
		markups: {

		},
		images: {

		}
	},
	serve: {

	},
	modules: {
		src: 'modules',
		dest: 'lib',
		eachdir: {
			task: {
				scripts: {

				},
				styles: {

				},
				markups: {

				},
				images: {

				}
			}
		}
	},
	build: [
		['clean'],
		['scripts', ['stylus', 'css'], 'markups', 'images']
	],
	watch: ['scripts', 'styles', 'markups', 'images']
};

var taskConfigs = {
	//images: {
	//	src: '**/*.{png,jpg,gif}',
	//	flatten: true
	//},
	//styles: {
	//	stylus: {
	//		src: '**/*.stylus'
	//	},
	//	css: {
	//		src: '**/*.css'
	//	}
	//},
	//scripts: {
	//	browserify: {
	//		options: {
	//			transform: [],
	//			shim: {}
	//		},
	//		bundles: [{
	//			entries: 'index',
	//			require: '',
	//			external: '',
	//			file: '1',
	//			//dest: ''
	//		}, {
	//			entries: 'options',
	//			file: '2'
	//		}]
	//	},
	//	bookmarklet: {
	//		src: '**/*.js',
	//	}
	//},
	//'_concat': {
	//	concat: {
	//		src: '../test/_fixtures/modules/**/*.js',
	//		file: 'main.js'
	//	}
	//},
	//'_eachdir': {
	//	src: '../test/_fixtures/modules',
	//	eachdir: {
	//		copy: {
	//			src: '{{dir}}/**/*.js',
	//			dest: '{{dir}}',
	//			flatten: true
	//		}
	//	}
	//},
	browserify: {
		src: 'test/_fixtures/app/modules',
		dest: 'dist',
		bundles: [{
			entries: ['directives/index.js'],
			file: 'directives.js',
		}, {
			entries: ['services/index.js'],
			file: 'services.js',
		}]
	},
	//foreach: {
	//	each: {
	//		values: [{
	//			dir: 'directives'
	//		}, {
	//			dir: 'services'
	//		}, {
	//			dir: 'views'
	//		}],
	//		process: {
	//			task: function(config) {
	//				var EmptyStream = require('./src/util/empty_stream');
	//				console.log(config.dir);
	//				return new EmptyStream();
	//			}
	//		}
	//	}
	//},
	//// Bundle modules with concat for each folder.
	//'modules:concat': {
	//	src: '../test/_fixtures/modules',
	//	'uglify!': {
	//		file: 'main.min.js',
	//		'.concat': {
	//			src: '**/*.js',
	//			file: 'main.js',
	//		}
	//	}
	//},
	//'modules:pipe': {
	//	src: '../test/_fixtures/modules',
	//	pipe: {
	//		'.concat': {
	//			src: '**/*.js',
	//			file: 'main.js',
	//		},
	//		'.uglify': {
	//			file: {
	//				extname: '.min.js'
	//			}
	//		}
	//	}
	//},
	//'modules:uglify': {
	//	src: '../test/_fixtures/modules',
	//	'.uglify': {
	//		src: '**/*.js',
	//		file: {
	//			extname: '.min.js'
	//		}
	//	}
	//},
	//// Bundle modules with Browserify for each folder.
	//modules: {
	//	src: '../test/_fixtures/modules',
	//	eachdir: {
	//		'.browserify': {
	//			bundle: {
	//				entries: '{{dir}}/index.js',
	//				file: '{{dir}}.js',
	//			}
	//		}
	//	}
	//},
	//markups: {
	//	src: '../test/_fixtures/modules/**/*.html',
	//	flatten: true
	//},
	// module2: {
	//     src: '../test/_fixtures/modules',
	//     directives: {
	//         '.browserify': {
	//             bundle: {
	//                 entries: 'directives/index.js',
	//                 file: 'directives.js',
	//             }
	//         }
	//     },
	//     services: {
	//         '.browserify': {
	//             bundle: {
	//                 entries: 'services/index.js',
	//                 file: 'services.js',
	//             }
	//         }
	//     },
	//     views: {
	//         '.browserify': {
	//             bundle: {
	//                 entries: 'views/index.js',
	//                 file: 'views.js',
	//             }
	//         }
	//     }
	// },
	// manifest: {
	// },
	// locales: {
	// },
	// watch: {
	// },
	// serve: {
	// },
	// test: {
	//     task: function() {
	//         var mocha = require('gulp-mocha');
	//         return gulp.src(['test/specs/util/**/*_test.js'], { read: false })
	//             .pipe(mocha({
	//                 reporter: 'spec'
	//             }));
	//     }
	// },
	// through: {
	//     task: function() {
	//         var EmptyStream  = require('./src/util/empty_stream');
	//         return new EmptyStream();
	//     }
	// },
	// bump: {
	// },
	// clean: {
	// },
	// lint: {
	// },
	// build: {
	//     depends: ['clean'],
	//     task: ['scripts', 'styles', 'markups', 'images']
	// },
	// build2: {
	//     depends: ['clean'],
	//     task: function() {
	//         gulp.start('scripts', 'styles', 'markups', 'images');
	//     }
	// },
	// watch: {
	//     task: ['scripts', 'styles', 'markups', 'images']
	// },
	// deploy: {
	// },
	// 'default': {
	//     depends: ['build']
	// }
};

createGulpTasks(gulp, taskConfigs, config);

gulp.task('test', function() {
	var mocha = require('gulp-mocha');
	return gulp.src(['test/specs/**/*_test.js'], {
			read: false
		})
		.pipe(mocha({
			reporter: 'spec',
			timeout: Infinity
		}));
});
