/*jshint node: true */

'use strict';

var promise = require('./build/p.commonjs.js');

module.exports = {
  deferred: function () {
    var deferred = {};
    var p = promise(function (resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    deferred.promise = p;
    return deferred;
  }
};
