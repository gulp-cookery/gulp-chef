'use strict';

var Server = require('karma').Server;

module.exports = function (done) {
  new Server({
    configFile: process.cwd() + '/karma.conf.js',
    singleRun: true
  }, done).start();
};
