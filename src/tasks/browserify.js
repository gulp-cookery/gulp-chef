/* browserify task
   ---------------
   Bundle javascripty things with browserify!
*/

var defaults = {
    options: {
    }
};

function handleErrors(ex) {
    debugger;
    console.log('browserify error:' + ex);
}

function browserifyTask(config) {

    // lazy loading required modules.
    var _ = require('lodash');
    var browserify = require('browserify');
    var browserSync = require('browser-sync');
    var gulp = require('gulp');
    var merge = require('merge-stream');
    var source = require('vinyl-source-stream');
    var watchify = require('watchify');

    var options, bundles;
    
    options = _.defaults({}, config.options, defaults.options);

    bundles = config.bundles || config.bundle;
    if (!_.isArray(bundles)) {
        bundles = [bundles];
    }
    // Start bundling with Browserify for each bundle config specified
    return merge(_.map(bundles, browserifyThis));

    function browserifyThis(bundleConfig) {

        bundleConfig = _.defaults({}, bundleConfig, options);

        if (config.debug) {
            // Add watchify args and debug (sourcemaps) option
            _.extend(bundleConfig, watchify.args, { debug: true });
            // A watchify require/external bug that prevents proper recompiling,
            // so (for now) we'll ignore these options during development. Running
            // `gulp browserify` directly will properly require and externalize.
            bundleConfig = _.omit(bundleConfig, ['external', 'require']);
        }

        var b = browserify(bundleConfig);

        if (config.debug) {
            // Wrap with watchify and rebundle on changes
            b = watchify(b);
            // Rebundle on update
            b.on('update', bundle);
            // bundleLogger.watch(bundleConfig.file);
        } else {
            // Sort out shared dependencies.
            // b.require exposes modules externally
            if (bundleConfig.require) {
                b.require(bundleConfig.require);
            }
            // b.external excludes modules from the bundle, and expects
            // they'll be available externally
            if (bundleConfig.external) {
                b.external(bundleConfig.external);
            }
        }

        var bundle = function() {
            // Log when bundling starts
            // bundleLogger.start(bundleConfig.file);

            return b
                .bundle()
                // Report compile errors
                .on('error', handleErrors)
                // Use vinyl-source-stream to make the
                // stream gulp compatible. Specify the
                // desired output filename here.
                .pipe(source(bundleConfig.file))
                // Specify the output destination
                .pipe(gulp.dest(bundleConfig.dest || config.dest))
                .pipe(browserSync.reload({
                    stream: true
                }));
        };

        return bundle();
    }
}

browserifyTask.description = 'Bundle JavaScript things with Browserify.';
browserifyTask.consumes = ['bundle', 'bundles', 'options'];

module.exports = browserifyTask;
