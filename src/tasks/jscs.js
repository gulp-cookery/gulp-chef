var gulp = require('gulp');
var jscs = require('jscs');
var _ = require('lodash');

var defaults = {
    options: {
        esnext: true,
        reporter: 'console'
    }
};

function jscsTask(config) {
    var options = _.extend({}, config.options, defaults.options);
    return gulp.src(config.src)
        .pipe(cached())
        .pipe(jscs(options))
        .pipe(remember());
}

jscsTask.description = '';

module.exports = jscsTask;
