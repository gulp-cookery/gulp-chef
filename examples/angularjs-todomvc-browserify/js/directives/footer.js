'use strict';

var angular = require('angular');

angular.module('todomvc')
  .directive('tdFooter', function () {
    return {
      restrict: 'E',
      templateUrl: '/partials/footer.html'
    };
  });
