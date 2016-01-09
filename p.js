/*jshint loopfunc: true, strict: false */
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
    var onFulfilleds;
    var onRejecteds;
    var promises;
    var resolves;
    var rejects;
    function empty() {
      onFulfilleds = [];
      onRejecteds = [];
      promises = [];
      resolves = [];
      rejects = [];
    }
    empty();
    function iterateCallbacks(callbacks, iteratee) {
      for (var i = 0; i < callbacks.length; i += 1) {
        (function (callback, promise, resolve, reject) {
          task(function () {
            iteratee(callback, promise, resolve, reject);
          });
        }(callbacks[i], promises[i], resolves[i], rejects[i]));
      }
      empty();
    }
    function callOnFulfilleds() {
      iterateCallbacks(onFulfilleds, function (onFulfilled, promise, resolve, reject) {
        try {
          var x = isFunction(onFulfilled) ? onFulfilled(valueOrReason) : valueOrReason;
          resolutionProcedure(promise, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }
    function callOnRejecteds() {
      iterateCallbacks(onRejecteds, function (onRejected, promise, resolve, reject) {
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
    return {
      promise: {
        then: function (onFulfilled, onRejected) {
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
    defer: defer
  };

}());
