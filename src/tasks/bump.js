
var defaults = {
    source: 'package.json',
    // target: ['bower.json', 'app/manifest.json'],
    // 注意：這裡若不指定 base 的話，manifest.json 會輸出到 . 而非 app 目錄。
    base: '.',
    options: {
        fields: ['version']
    }
};

var message = {
    type: 'list',
    name: 'bump',
    message: 'What type of version bump would you like to do?',
    choices: ['patch', 'minor', 'major'],
    "default": 'patch'
};

/**
 * 
 * Ingredients:
 * 
 */
function bumpTask(gulp, config, stream, done) {
    // lazy loading required modules.
    var _ = require('lodash');
    var bump = require('gulp-bump');
    var configSync = require('gulp-config-sync');
    var prompt = require('gulp-prompt').prompt;

    var options = _.defaultsDeep({}, config.options, defaults.options);

    // prompt value is in res.bump
    prompt(message, function(res) {
        // note:
        // gulp-bump 可以一次修改多個 .json 檔案，但是並不遵循 single source of truth 原則。
        // gulp-bump 針對每個檔案讀取其 version 資訊，然後各自修改其版本號碼。所以可能造成設定不同步的狀況。
        // 因此，實際使用時，最好只指定 package.json 進行版本修定，然後再利用 gulp-config-sync 之類的 plugin 來進行同步。
        gulp.src(config.source)
            .pipe(bump({ type: res.bump }))
            .pipe(gulp.dest(config.base))
            .pipe(gulp.src(config.target, { base: config.base }))
            .pipe(configSync(options))
            .pipe(gulp.dest(config.base))
            .on('end', done);
    });
}

bumpTask.description = '';
bumpTask.defaults = defaults;
bumpTask.consumes = ['base', 'options', 'source', 'target'];

module.exports = bumpTask;
