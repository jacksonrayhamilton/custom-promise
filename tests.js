/* eslint-env mocha, node */

'use strict';

var assert = require('better-assert');
var isEqual = require('lodash/lang/isEqual');
var p = require('./');
var promisesAplusTests = require('promises-aplus-tests');

var defer = function () {
  var deferred = {};
  deferred.promise = p(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};

describe('Promises/A+ Tests', function () {

  var adapter = {
    deferred: defer,
    resolved: p.resolve,
    rejected: p.reject
  };

  promisesAplusTests.mocha(adapter);

});

describe('p.all', function () {

  describe('resolution', function () {

    var first, second;

    beforeEach(function () {
      first = defer();
      second = defer();

      // Out-of-order so we can test the order too.
      second.resolve(2);
      first.resolve(1);
    });

    it('should accept an array of values and return an array of results', function (done) {
      p.all([
        first.promise,
        second.promise,
        3 // Test non-promises too.
      ]).then(function (results) {
        assert(isEqual(results, [1, 2, 3]));
        done();
      }).catch(done);
    });

    it('should accept a map of values and return a map of results', function (done) {
      p.all({
        first: first.promise,
        second: second.promise,
        third: 3
      }).then(function (results) {
        assert(isEqual(results, {first: 1, second: 2, third: 3}));
        done();
      }).catch(done);
    });

  });

  describe('emptiness', function () {
    it('should resolve an empty array', function (done) {
      p.all([]).then(function (results) {
        assert(isEqual(results, []));
        done();
      }).catch(done);
    });

    it('should resolve an empty object', function (done) {
      p.all({}).then(function (results) {
        assert(isEqual(results, {}));
        done();
      }).catch(done);
    });
  });

  it('should reject if any promise is rejected', function (done) {
    var first = defer();
    var second = defer();

    var expectedReason = {};
    first.reject(expectedReason);

    p.all([
      first.promise,
      second.promise
    ]).then(function () {
      assert(false);
    }, function (reason) {
      assert(reason === expectedReason);
      done();
    }).catch(done);
  });

});
