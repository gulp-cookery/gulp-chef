var gulp = require('gulp');

var merge = require('merge-stream');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');

function js() {
    return gulp.src('src/modules/**/*.js');
}

function css() {
    return gulp.src('src/modules/**/*.css');
}

function _merge() {
    return merge(js(), css());
}

function _concat() {
    return gulp.src('src/modules/**/*.js')
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist'));
}

function _uglify() {
    return _concat()
        .pipe(uglify())
        .pipe(rename('main.min.js'))
        .pipe(gulp.dest('dist'));
}

gulp.task('default', function() {
    return _uglify();
});