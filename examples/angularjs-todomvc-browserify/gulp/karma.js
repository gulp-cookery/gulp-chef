'use strict';

module.exports = function (done) {
  var Server = require('karma').Server;

  new Server({
    configFile: process.cwd() + '/karma.conf.js',
    singleRun: true
  }, done).start();
};
