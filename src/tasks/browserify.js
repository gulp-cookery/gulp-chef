/* browserify task
   ---------------
   Bundle javascripty things with browserify!
   
   references:
   
   gulp + browserify, the gulp-y way
   https://medium.com/@sogko/gulp-browserify-the-gulp-y-way-bb359b3f9623

   gulp-starter/gulp/tasks/browserify.js   
   https://github.com/greypants/gulp-starter/blob/master/gulp/tasks/browserify.js
*/

var defaults = {
    options: {
    }
};

function browserifyTask(config) {
    var gulp = this;

    // lazy loading required modules.
    var _ = require('lodash');
    var Browserify = require('browserify');
    var browserSync = require('browser-sync');
    var merge = require('merge-stream');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');
    var watchify = require('watchify');
    var log = require('gulp-util').log;

    var options, bundles;
    
    options = _.defaultsDeep({}, config.options, defaults.options);

    bundles = config.bundles || config.bundle;
    if (_.isArray(bundles)) {
        // Start bundling with Browserify for each bundle config specified
        return merge(_.map(bundles, browserifyThis));
    }
    return browserifyThis(bundles);

    function browserifyThis(bundleConfig) {
        
        bundleConfig = _.defaultsDeep({}, bundleConfig, options, config);

        if (bundleConfig.debug) {
            // Add watchify args and debug (sourcemaps) option
            _.defaultsDeep(bundleConfig, watchify.args, { debug: true });
            // A watchify require/external bug that prevents proper recompiling,
            // so (for now) we'll ignore these options during development. Running
            // `gulp browserify` directly will properly require and externalize.
            bundleConfig = _.omit(bundleConfig, ['external', 'require']);
        }

        var browserify = new Browserify(bundleConfig);

        if (bundleConfig.debug) {
            // Wrap with watchify and rebundle on changes
            browserify = watchify(browserify);
            // Rebundle on update
            browserify.on('update', bundle);
            // bundleLogger.watch(bundleConfig.file);
        } 
        else {
            // Sort out shared dependencies.
            // b.require exposes modules externally
            if (bundleConfig.require) {
                browserify.require(bundleConfig.require);
            }
            // b.external excludes modules from the bundle, and expects
            // they'll be available externally
            if (bundleConfig.external) {
                browserify.external(bundleConfig.external);
            }
        }

        function bundle() {
            // Log when bundling starts
            // bundleLogger.start(bundleConfig.file);
    
            return browserify
                .bundle()
                // Report compile errors
                .on('error', handleErrors)
                .on('log', log)
                // Use vinyl-source-stream to make the
                // stream gulp compatible. Specify the
                // desired output filename here.
                .pipe(source(bundleConfig.file))
                .pipe(buffer())
                // Specify the output destination
                .pipe(gulp.dest(bundleConfig.dest))
                .pipe(browserSync.reload({
                    stream: true
                }));
        }
        
        return bundle();
    }

    function handleErrors() {
        var notify = require('gulp-notify');
        
        var args = Array.prototype.slice.call(arguments);
        log(JSON.stringify(args));

        // Send error to notification center with gulp-notify
        notify.onError({
            title: "Compile Error",
            message: "<%= error %>"
        }).apply(this, args);
          
        this.emit('end');
    }
}

browserifyTask.description = 'Bundle JavaScript things with Browserify.';
browserifyTask.consumes = ['bundle', 'bundles', 'dest', 'options'];

    function browserifyTask(c) {
        var gulp = this;
        
        var browserify = require('browserify');
        var source = require('vinyl-source-stream');
    
        // set up the browserify instance on a task basis
        var b = browserify({
            entries: c.bundle.entries,
            debug: false
        });
        
        return b.bundle()
            .on('error', function() {
                this.emit('end'); 
                console.log(JSON.stringify(arguments)); 
             })
            .pipe(source(c.bundle.file))
            .pipe(gulp.dest(c.dest));
    }


module.exports = browserifyTask;
