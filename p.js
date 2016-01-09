/*global setTimeout */

/*jshint -W098 */
var p = (function () {
  /*jshint +W098 */

  'use strict';

  function isObject(value) {
    return value && typeof value === 'object';
  }

  function isFunction(value) {
    return typeof value === 'function';
  }

  function resolutionProcedure(promise, x, resolve, reject) {
    if (promise === x) {
      throw new TypeError('then() cannot return same Promise that it resolves');
    }
    if (isObject(x) || isFunction(x)) {
      var then;
      try {
        then = x.then;
      } catch (e) {
        reject(e);
        return;
      }
      if (isFunction(then)) {
        var called = false;
        try {
          then.call(x, function (y) {
            if (called) {
              return;
            }
            called = true;
            resolutionProcedure(promise, y, resolve, reject);
          }, function (r) {
            if (called) {
              return;
            }
            called = true;
            reject(r);
          });
        } catch (e) {
          if (!called) {
            reject(e);
            return;
          }
        }
      } else {
        resolve(x);
      }
    } else {
      resolve(x);
    }
  }

  var FULFILLED = {};
  var REJECTED = {};

  function defer() {
    var state;
    var value;
    var reason;
    var onFulfilleds;
    var onRejecteds;
    var resolves;
    var rejects;
    var promises;
    function empty() {
      onFulfilleds = [];
      onRejecteds = [];
      resolves = [];
      rejects = [];
      promises = [];
    }
    function callOnFulfilleds() {
      onFulfilleds.forEach(function (onFulfilled, index) {
        var promise = promises[index];
        var resolve = resolves[index];
        var reject = rejects[index];
        setTimeout(function () {
          try {
            var x = isFunction(onFulfilled) ? onFulfilled(value) : value;
            resolutionProcedure(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });
      empty();
    }
    function resolve(_value) {
      if (state) {
        return;
      }
      state = FULFILLED;
      value = _value;
      callOnFulfilleds();
    }
    function callOnRejecteds() {
      onRejecteds.forEach(function (onRejected, index) {
        var promise = promises[index];
        var resolve = resolves[index];
        var reject = rejects[index];
        setTimeout(function () {
          try {
            if (isFunction(onRejected)) {
              var x = onRejected(reason);
              resolutionProcedure(promise, x, resolve, reject);
            } else {
              reject(reason);
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      empty();
    }
    function reject(_reason) {
      if (state) {
        return;
      }
      state = REJECTED;
      reason = _reason;
      callOnRejecteds();
    }
    function promiseThen(onFulfilled, onRejected) {
      onFulfilleds.push(onFulfilled);
      onRejecteds.push(onRejected);
      var deferred = defer();
      promises.push(deferred.promise);
      resolves.push(deferred.resolve);
      rejects.push(deferred.reject);
      if (state === FULFILLED) {
        callOnFulfilleds();
      }
      if (state === REJECTED) {
        callOnRejecteds();
      }
      return deferred.promise;
    }
    function promiseCatch(onRejected) {
      return promiseThen(void 0, onRejected);
    }
    empty();
    var promise = {
      then: promiseThen,
      catch: promiseCatch
    };
    var deferred = {
      promise: promise,
      resolve: resolve,
      reject: reject
    };
    return deferred;
  }

  return {
    defer: defer
  };

}());
