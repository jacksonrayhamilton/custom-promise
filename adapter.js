/*jshint node: true */

'use strict';

var p = require('./build/p.commonjs.js');

module.exports = {
  deferred: function () {
    return p.defer();
  }
};
