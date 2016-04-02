/* eslint-env mocha */

'use strict';

var defer = require('./defer');
var p = require('../');
var promisesAplusTests = require('promises-aplus-tests');

describe('Promises/A+ Tests', function () {

  var adapter = {
    deferred: defer,
    resolved: p.resolve,
    rejected: p.reject
  };

  promisesAplusTests.mocha(adapter);

});
