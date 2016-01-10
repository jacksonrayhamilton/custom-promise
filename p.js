/*jshint strict: false */
/*global setTimeout */

/*jshint -W098 */
var p = (function () {
  /*jshint +W098 */

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

  function resolutionProcedure(promise, x, resolve, reject) {
    if (promise === x) {
      throw TypeError();
    }
    if (isObject(x) || isFunction(x)) {
      var called = 0;
      try {
        var then = x.then;
        if (isFunction(then)) {
          then.call(x, function (y) {
            if (called) {
              return;
            }
            called = 1;
            resolutionProcedure(promise, y, resolve, reject);
          }, function (r) {
            if (called) {
              return;
            }
            called = 1;
            reject(r);
          });
        } else {
          resolve(x);
        }
      } catch (e) {
        if (!called) {
          reject(e);
        }
      }
    } else {
      resolve(x);
    }
  }

  var FULFILLED = 1;
  var REJECTED = 2;

  function defer() {
    var state;
    var valueOrReason;
    var queue = [];
    function emptyQueue(offset, iteratee) {
      function taskIteratee(callback, promise, resolve, reject) {
        task(function () {
          iteratee(callback, promise, resolve, reject);
        });
      }
      var item;
      while ((item = queue.shift())) {
        taskIteratee(item[offset], item[2], item[3], item[4]);
      }
    }
    function callOnFulfilleds() {
      emptyQueue(0, function (onFulfilled, promise, resolve, reject) {
        try {
          var x = isFunction(onFulfilled) ? onFulfilled(valueOrReason) : valueOrReason;
          resolutionProcedure(promise, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }
    function callOnRejecteds() {
      emptyQueue(1, function (onRejected, promise, resolve, reject) {
        try {
          if (isFunction(onRejected)) {
            var x = onRejected(valueOrReason);
            resolutionProcedure(promise, x, resolve, reject);
          } else {
            reject(valueOrReason);
          }
        } catch (e) {
          reject(e);
        }
      });
    }
    function promiseThen(onFulfilled, onRejected) {
      var deferred = defer();
      queue.push([
        onFulfilled,
        onRejected,
        deferred.promise,
        deferred.resolve,
        deferred.reject
      ]);
      if (state === FULFILLED) {
        callOnFulfilleds();
      }
      if (state === REJECTED) {
        callOnRejecteds();
      }
      return deferred.promise;
    }
    function promiseCatch(onRejected) {
      return promiseThen(0, onRejected);
    }
    return {
      promise: {
        then: promiseThen,
        'catch': promiseCatch // Quotes for old IE
      },
      resolve: function (value) {
        if (state) {
          return;
        }
        state = FULFILLED;
        valueOrReason = value;
        callOnFulfilleds();
      },
      reject: function (reason) {
        if (state) {
          return;
        }
        state = REJECTED;
        valueOrReason = reason;
        callOnRejecteds();
      }
    };
  }

  function resolve(value) {
    var deferred = defer();
    resolutionProcedure(deferred.promise, value, deferred.resolve, deferred.reject);
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
