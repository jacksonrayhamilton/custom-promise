'use strict';

var p = require('../');

// Utility to create and manage promises.
var defer = function () {
  var deferred = {};
  deferred.promise = p(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};

module.exports = defer;
