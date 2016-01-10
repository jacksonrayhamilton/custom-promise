/*jshint strict: false */
/*global setTimeout */

/*jshint -W098 */
var p = (function () {
  /*jshint +W098 */

  var task = setTimeout;

  function isFunction(value) {
    return typeof value === 'function';
  }

  function resolutionProcedure(promise, x, resolve, reject) {
    if (promise === x) {
      throw TypeError();
    }
    if ((x && typeof x === 'object') || isFunction(x)) {
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
    var pending = [];
    function iteratePending(offset, iteratee) {
      /*jshint loopfunc: true */
      var p;
      while ((p = pending.shift())) {
        (function (callback, promise, resolve, reject) {
          task(function () {
            iteratee(callback, promise, resolve, reject);
          });
        }(p[offset], p[2], p[3], p[4]));
      }
    }
    function callOnFulfilleds() {
      iteratePending(0, function (onFulfilled, promise, resolve, reject) {
        try {
          var x = isFunction(onFulfilled) ? onFulfilled(valueOrReason) : valueOrReason;
          resolutionProcedure(promise, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }
    function callOnRejecteds() {
      iteratePending(1, function (onRejected, promise, resolve, reject) {
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
      pending.push([
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

  return {
    defer: defer,
    resolve: function (value) {
      var deferred = defer();
      deferred.resolve(value);
      return deferred.promise;
    },
    reject: function (reason) {
      var deferred = defer();
      deferred.reject(reason);
      return deferred.promise;
    }
  };

}());
