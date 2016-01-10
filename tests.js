/*jshint mocha: true, node: true */

'use strict';

var assert = require('better-assert');
var isEqual = require('lodash/lang/isEqual');
var p = require('./build/p.commonjs.js');

describe('p.all', function () {

  describe('resolution', function () {

    var first, second;

    beforeEach(function () {
      first = p.defer();
      second = p.defer();

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
    var first = p.defer();
    var second = p.defer();

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
