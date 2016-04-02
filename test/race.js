/* eslint-env mocha, node */

'use strict';

var assert = require('assert');
var once = require('lodash/once');

var defer = require('./defer');
var p = require('../');

describe('p.race', function () {

  describe('resolution', function () {

    var first, second;

    beforeEach(function () {
      first = defer();
      second = defer();
    });

    it('should accept an array of values and return the first result', function (done) {
      p.race([
        first.promise,
        second.promise
      ]).then(function (result) {
        assert.strictEqual(result, 2);
        done();
      }).catch(done);

      second.resolve(2);
      first.resolve(1);
    });

    it('should accept a map of values and return the first result', function (done) {
      p.race({
        first: first.promise,
        second: second.promise
      }).then(function (result) {
        assert.strictEqual(result, 2);
        done();
      }).catch(done);

      second.resolve(2);
      first.resolve(1);
    });

  });

  describe('emptiness', function () {
    it('should never resolve an empty array', function (done) {
      done = once(done);
      p.race([]).then(function () {
        assert(false);
      }).catch(done);
      setTimeout(done, 50);
    });

    it('should never resolve an empty object', function (done) {
      done = once(done);
      p.race({}).then(function () {
        assert(false);
      }).catch(done);
      setTimeout(done, 50);
    });
  });

  it('should reject if any promise is rejected', function (done) {
    var first = defer();
    var second = defer();

    var expectedReason = {};
    first.reject(expectedReason);

    p.race([
      first.promise,
      second.promise
    ]).then(function () {
      assert(false);
    }, function (reason) {
      assert.strictEqual(reason, expectedReason);
      done();
    }).catch(done);
  });

});
