'use strict';

module.exports = function (done) {
  var Server = require('karma').Server;

  new Server({
    configFile: process.cwd() + '/karma.conf.js',
    singleRun: true
  }, function () {
    done();
    process.nextTick(function () {
      process.exit();
    });
  }).start();
};
