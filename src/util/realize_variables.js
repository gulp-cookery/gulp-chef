var _ = require('lodash');

var interpolate = /{{([\s\S]+?)}}/g;

function realizeVariables(original, additional, defaults) {
    
    var values = _.defaultsDeep({}, original, additional, defaults);
    
    return realizeAll({}, values);

    function realizeAll(target, source) {
        _.each(source, function(value, name) {
            target[name] = realize(value);
        });
        return target;
    }
    
    function realize(source) {
        if (typeof source === 'string') {
            return source.replace(interpolate, function(match, p1) {
                return values[p1] || p1; 
            });
        }
        if (typeof source === 'function') {
            debugger;
            console.log('realize by fn');
            return source.call(values);
        }
        if (_.isArray(source)) {
            return realizeAll([], source);
        }
        if (_.isObject(source)) {
            return realizeAll({}, source);
        } 
        return source;
    }
}

module.exports = realizeVariables;