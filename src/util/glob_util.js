var FileSystem = require('fs');
var Path = require('path');
var globby = require('globby');

// glob support in src:
function folders(globs, options) {
    var base;
    
    options = options || {};
    base = options.base || '';
    return globby.sync(globs, options)
        .filter(function(file) {
            return FileSystem.statSync(Path.join(base, file)).isDirectory();
        });
}

function join(path, globs, force) {
    try {
        if (force || FileSystem.statSync(path).isDirectory()) {
            if (Array.isArray(globs)) {
                return globs.map(_join);
            }
            return _join(globs);
        }
    }
    catch (ex) {
        // the directory path not exist;
    }
    // globs override path
    return globs;
    
    function _join(glob) {
        var negative;
        
        if (glob[0] === '!') {
            negative = '!';
            glob = glob.substr(1);
        }
        else {
            negative = '';
        }
        return negative + Path.join(path, glob);
    }
}

var regexGlobPattern = /[!^{}|*?+@]/;
function test(pattern) {
    return regexGlobPattern.test(pattern);
}

exports.folders = folders;
exports.join = join;
exports.test = test;
