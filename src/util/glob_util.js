var fs = require('fs');
var path = require('path');
var _ = require('lodash');

function globJoins(paths, globs, force) {
    try {
        if (force || fs.statSync(paths).isDirectory()) {
            if (_.isArray(globs)) {
                return _.map(globs, function(glob) {
                    return _join(paths, glob);
                });
            }
            return _join(paths, globs);
        }
    }
    catch (ex) {
        // directory not exist;
    }
    // globs override path
    return globs;
    
    function _join(paths, glob) {
        var negative;
        
        if (glob[0] === '!') {
            negative = '!';
            glob = glob.substr(1);
        }
        else {
            negative = '';
        }
        return negative + path.join(paths, glob);
    }
}

module.exports = globJoins;