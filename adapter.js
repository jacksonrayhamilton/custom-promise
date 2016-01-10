/*jshint node: true */

'use strict';

var p = require('./build/p.commonjs.js');

module.exports = {
  deferred: p.defer,
  resolved: p.resolve,
  rejected: p.reject
};
