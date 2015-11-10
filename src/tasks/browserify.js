'use strict';

/**

browserify task
---------------
Bundle JavaScript things with Browserify!

References:

Fast browserify builds with watchify
https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md

Browserify + Globs
https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-with-globs.md

Gulp + Browserify: The Everything Post
http://viget.com/extend/gulp-browserify-starter-faq

Speedy Browserifying with Multiple Bundles
https://lincolnloop.com/blog/speedy-browserifying-multiple-bundles/

gulp-starter/gulp/tasks/browserify.js
https://github.com/greypants/gulp-starter/blob/master/gulp/tasks/browserify.js

browserify-handbook
https://github.com/substack/browserify-handbook

partitioning
https://github.com/substack/browserify-handbook#partitioning

gulp + browserify, the gulp-y way
https://medium.com/@sogko/gulp-browserify-the-gulp-y-way-bb359b3f9623

*/

/**
 * config: {
 *   // NOTE: options will be injected to each bundles. Put common configuration here.
 *   options: {
 *     require: '',
 *     plugin: [
 *       [tsify, { noImplicitAny: true }],
 *       errorify
 *     ],
 *     transform: [],
 *
 *     // using browserify methods
 *     external: [],
 *
 *     exclude: []
 *     ignore: []
 *
 *     // using browserify-shim
 *     shim: {
 *     }
 *   },
 *   bundles: [{
 *     entries: ['app.js'],
 *     external: '',
 *     require: '',
 *     file: 'app.bundle.js'
 *   }, {
 *     entries: ['console.js'],
 *     file: 'console.bundle.js'
 *   }, {
 *     entries: ['common.js'],
 *     file: 'common.js'
 *   }]
 * }
 *
 * NOTE:
 *   Browserify constructor supports the following options:
 *
 *   entries: string|[string]
 *   noparse|noParse: boolean
 *   basedir: string
 *   browserField: boolean
 *   builtins: boolean|[string]
 *   debug: boolean
 *   detectGlobals: boolean
 *   extensions: []
 *   insertGlobals: boolean
 *      commondir: boolean
 *   insertGlobalVars: boolean
 *   bundleExternal: boolean
 *
 *   ignoreTransform: []
 *   transform: [string|{}|[]]
 *      basedir: string
 *      global: boolean
 *   require: []
 *      file: string
 *      entry: boolean
 *      external
 *      transform
 *      basedir: string
 *      expose: boolean
 *   plugin: [string|{}|[]]
 *      basedir: string
 *
 * Reference:
 *
 * node-browserify/index.js
 * https://github.com/substack/node-browserify/blob/master/index.js
 *
 * browserify-handbook - configuring transforms
 * https://github.com/substack/browserify-handbook#configuring-transforms
 *
 * pull: Make sure entry paths are always full paths #1248
 * https://github.com/substack/node-browserify/pull/1248
 *
 * issues: 8.1.1 fails to resolve modules from "browser" field #1072
 * https://github.com/substack/node-browserify/issues/1072#issuecomment-70323972
 *
 * issues: browser field in package.json no longer works #1250
 * https://github.com/substack/node-browserify/issues/1250
 * https://github.com/substack/node-browserify/issues/1250#issuecomment-99970224
 *
 * Ingredients:
 *
 * browser-sync
 * https://github.com/BrowserSync/browser-sync
 *
 * node-browserify
 * https://github.com/substack/node-browserify
 *
 * globby
 * https://github.com/sindresorhus/globby
 *
 * gulp-sourcemaps
 * https://github.com/floridoo/gulp-sourcemaps
 *
 * gulp-uglify
 * https://github.com/terinjokes/gulp-uglify
 *
 * vinyl-source-stream
 * https://github.com/hughsk/vinyl-source-stream
 *
 * vinyl-buffer
 * https://github.com/hughsk/vinyl-buffer
 *
 * watchify
 * https://github.com/substack/watchify
 *
 */
function browserifyTask(gulp, config, stream) {
	// lazy loading required modules.
	var browserify = require('browserify'),
		browserSync = require('browser-sync'),
		buffer = require('vinyl-buffer'),
		globby = require('globby'),
		Globs = require('../util/glob_util'),
		Configuration = require('../core/configuration'),
		log = require('gulp-util').log,
		merge = require('merge-stream'),
		notify = require('gulp-notify'),
		sourcemaps = require('gulp-sourcemaps'),
		uglify = require('gulp-uglify'),
		vinylify = require('vinyl-source-stream'),
		watchify = require('watchify'),
		_ = require('lodash');

	var bundles = config.bundles || config.bundle;
	if (_.isArray(bundles)) {
		// Start bundling with Browserify for each bundle config specified
		return merge(_.map(bundles, browserifyThis));
	}
	return browserifyThis(bundles);

	function browserifyThis(bundleConfig) {

		var options = realizeOptions(bundleConfig, config);

		if (options.debug) {
			// Add watchify args
			_.defaults(options, watchify.args);
			// A watchify require/external bug that prevents proper recompiling,
			// so (for now) we'll ignore these options during development. Running
			// `gulp browserify` directly will properly require and externalize.
			options = _.omit(options, ['external', 'require']);
		}

		// Transform must be registered after plugin.
		// (tsify use transform internally, so make sure it registered first.)
		var transform;
		if (options.plugin && options.transform) {
			transform = options.transform;
			delete options.transform;
		}

		var _browserify = browserify(options)
			.on('log', log);

		if (transform) {
			_browserify.transform(transform);
		}

		if (options.debug) {
			// Wrap with watchify and rebundle on changes
			_browserify = watchify(_browserify);
			// Rebundle on update
			_browserify.on('update', bundle);
			// bundleLogger.watch(bundleConfig.file);
		} else {
			// NOTE: options.require is processed properly in constructor of browserify.
			//   No need further process here.
			//
			// Sort out shared dependencies.
			// browserify.require exposes modules externally
			// if (bundleConfig.require) {
			//     _browserify.require(bundleConfig.require);
			// }

			// browserify.external excludes modules from the bundle,
			// and expects they'll be available externally
			if (options.external) {
				_browserify.external(options.external);
			}
		}

		return bundle();

		function bundle() {
			// Log when bundling starts
			// bundleLogger.start(bundleConfig.file);

			var stream = _browserify
				.bundle()
				// Report compile errors
				.on('error', handleErrors)
				// Use vinyl-source-stream to make the stream gulp compatible.
				// Specify the desired output filename here.
				.pipe(vinylify(options.file))
				// optional, remove if you don't need to buffer file contents
				.pipe(buffer());

			if (options.sourcemap) {
				// Loads map from browserify file
				stream = stream.pipe(sourcemaps.init({
					loadMaps: true
				}));
			}

			if (!config.debug) {
				//stream = stream.pipe(uglify());
			}

			if (options.sourcemap) {
				// Prepares sourcemaps, either internal or external.
				stream = stream.pipe(sourcemaps.write(options.sourcemap === 'external' ? '.' : undefined));
			}

			// Specify the output destination
			return stream
				.pipe(gulp.dest((options.dest || config.dest).path, (options.dest || config.dest).options))
				.pipe(browserSync.reload({
					stream: true
				}));
		}

		function realizeOptions(bundleConfig, commonConfig) {
			var src, entries, options;

			src = resolveSrc(bundleConfig, commonConfig);
			entries = resolveEntries(src, bundleConfig.entries);
			options = _.defaults({
				entries: entries
			}, bundleConfig, commonConfig);

			// add sourcemap option
			if (options.sourcemap) {
				// browserify use 'debug' option for sourcemaps,
				// but sometimes we want sourcemaps even in production mode.
				options.debug = true;
			}

			return options;
		}

		function resolveSrc(bundleConfig, commonConfig) {
			var src = Configuration.resolveSrc(bundleConfig, commonConfig);
			return src && src.globs || '';
		}

		function resolveEntries(src, entries) {
			entries = _flatten(entries);
			entries = _join(entries);
			entries = _resolve(entries);
			return entries;

			// flatten entry property.
			function _flatten(entries) {
				return entries.map(function(entry) {
					return entry.file || entry;
				});
			}

			// join paths.
			function _join(entries) {
				return Globs.join(src, entries);
			}

			// resolve globs to files.
			function _resolve(entries) {
				return entries.reduce(function(result, entry) {
					if (Globs.isGlob(entry)) {
						return result.concat(globby.sync(entry));
					}
					return result.concat(entry);
				}, []);
			}
		}

		function handleErrors() {
			var args = Array.prototype.slice.call(arguments);

			// Send error to notification center with gulp-notify
			notify.onError({
				title: "Browserify Error",
				message: "<%= error %>"
			}).apply(this, args);

			this.emit('end');
		}
	}
}

browserifyTask.schema = {
	"title": "browserify",
	"description": "Bundle JavaScript things with Browserify.",
	"definitions": {
		"options": {
			"properties": {
				"extensions": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["extension"]
				},
				"require": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["requires"]
				},
				"external": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["externals"]
				},
				"plugin": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["plugins"]
				},
				"transform": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["transforms"]
				},
				"exclude": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["excludes"]
				},
				"ignore": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["ignores"]
				},
				"shim": {
					"description": "which library to shim?",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["shims", "browserify-shim", "browserify-shims"]
				},
				"sourcemap": {
					"description": "generate sourcemap file or not?",
					"enum": [
						"inline", "external", false
					],
					"alias": ["sourcemaps"],
					"default": false
				}
			}
		}
	},
	"properties": {
		"options": {
			"description": "common options for all bundles",
			"extends": { "$ref": "#/definitions/options" },
			"type": "object"
		},
		"bundles": {
			"description": "",
			"alias": ["bundle"],
			"type": "array",
			"items": {
				"type": "object"
			},
			"extends": [
				{ "$ref": "#/definitions/io" },
				{ "$ref": "#/definitions/options" }
			],
			"properties": {
				"file": {
					"description": "",
					"type": "string"
				},
				"entries": {
					"description": "",
					"type": "array",
					"items": {
						"type": "string"
					},
					"alias": ["entry"]
				},
				"options": {
					"extends": { "$ref": "#/definitions/options" }
				}
			},
			"required": ["file", "entries"]
		}
	},
	"required": ["bundles"]
};

module.exports = browserifyTask;
