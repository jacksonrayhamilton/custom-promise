/*jshint strict: false */
/*global setTimeout */
/*exported p */

var p = (function () {

  var task = setTimeout;

  function isObject(value) {
    return value && typeof value === 'object';
  }

  function isArray(value) {
    return {}.toString.call(value) === '[object Array]';
  }

  function isFunction(value) {
    return typeof value === 'function';
  }

  var FULFILLED = 1;
  var REJECTED = 2;

  function defer() {
    var resolvedOrRejected;
    var state;
    var valueOrReason;
    var callbacks = [];
    function callCallbacks() {
      var callback;
      while ((callback = callbacks.shift())) {
        task(callback);
      }
    }
    function rejectInner(reason) {
      state = REJECTED;
      valueOrReason = reason;
      callCallbacks();
    }
    function reject(reason) {
      if (resolvedOrRejected) {
        return;
      }
      rejectInner(reason);
      resolvedOrRejected = 1;
    }
    function resolveInner(value) {
      if (promise === value) {
        throw TypeError();
      }
      var called;
      try {
        var then;
        if ((isObject(value) || isFunction(value)) && isFunction(then = value.then)) {
          then.call(value, function (value) {
            if (called) {
              return;
            }
            called = 1;
            resolveInner(value);
          }, function (reason) {
            if (called) {
              return;
            }
            called = 1;
            rejectInner(reason);
          });
        } else {
          state = FULFILLED;
          valueOrReason = value;
          callCallbacks();
        }
      } catch (e) {
        if (called) {
          return;
        }
        called = 1;
        rejectInner(e);
      }
    }
    function resolve(value) {
      if (resolvedOrRejected) {
        return;
      }
      resolveInner(value);
      resolvedOrRejected = 1;
    }
    function promiseThen(onFulfilled, onRejected) {
      var deferred = defer();
      var resolve = deferred.resolve;
      var reject = deferred.reject;
      callbacks.push(function () {
        var callback = state < 2 ? onFulfilled : onRejected;
        var resolveOrReject = (state < 2 || isFunction(callback)) ? resolve : reject;
        try {
          resolveOrReject(isFunction(callback) ? callback(valueOrReason) : valueOrReason);
        } catch (e) {
          reject(e);
        }
      });
      if (state) {
        callCallbacks();
      }
      return deferred.promise;
    }
    function promiseCatch(onRejected) {
      return promiseThen(0, onRejected);
    }
    var promise = {
      then: promiseThen,
      'catch': promiseCatch // Quotes for old IE
    };
    return {
      promise: promise,
      resolve: resolve,
      reject: reject
    };
  }

  function resolve(value) {
    var deferred = defer();
    deferred.resolve(value);
    return deferred.promise;
  }

  function reject(reason) {
    var deferred = defer();
    deferred.reject(reason);
    return deferred.promise;
  }

  function all(collection) {
    var array = isArray(collection);
    var deferred = defer();
    var resolvedValues = array ? [] : {};
    var resolvedCount = 0;
    var length = array ? collection.length : 0;
    function iteratee(key) {
      resolve(collection[key]).then(function (value) {
        resolvedValues[key] = value;
        resolvedCount += 1;
        if (resolvedCount === length) {
          deferred.resolve(resolvedValues);
        }
      }, deferred.reject);
    }
    if (array) {
      for (var i = 0; i < length; i += 1) {
        iteratee(i);
      }
    } else {
      for (var key in collection) {
        if ({}.hasOwnProperty.call(collection, key)) {
          length += 1;
          iteratee(key);
        }
      }
    }
    if (length === 0) {
      deferred.resolve(resolvedValues);
    }
    return deferred.promise;
  }

  return {
    defer: defer,
    resolve: resolve,
    reject: reject,
    all: all
  };

}());
