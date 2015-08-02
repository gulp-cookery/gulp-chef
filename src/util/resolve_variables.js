var _ = require('lodash');

var interpolate = /{{([\s\S]+?)}}/g;

function resolveVariables(owner, values) {
    
    _resolveAll(owner);

    function _resolveAll(owner) {
        if (_.isObject(owner) || _.isArray(owner)) {
            _.each(owner, _resolve);
        }
    }
    
    function _resolve(value, name, owner) {
        if (typeof value === 'string') {
            owner[name] = value.replace(interpolate, function(match, p1) {
                return values[p1] || p1; 
            });
        }
        else {
            _resolveAll(owner[name]);
        }
    }
}

module.exports = resolveVariables;