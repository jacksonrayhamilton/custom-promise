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

  function defer() {
    // Flag to prevent multiple fulfillments or rejections.
    var fulfilledOrRejected;

    // Fulfilled state is 1, rejected is 2.
    var state;

    // Final value of the promise.
    var valueOrReason;

    // Pending handlers for `then`.
    var callbacks = [];

    // Execute all pending handlers asynchronously.
    function callCallbacks() {
      var callback;
      while ((callback = callbacks.shift())) {
        task(callback);
      }
    }

    // Access the current or eventual value or reason of `promise`.
    function promiseThen(onFulfilled, onRejected) {
      var deferred = defer();
      // Detach these methods to guarantee a reference to them even after
      // `deferred` is returned and potentially tampered-with.
      var resolve = deferred.resolve;
      var reject = deferred.reject;
      callbacks.push(function () {
        // Call the callback for the state of `promise`.
        var callback = state < 2 ? onFulfilled : onRejected;
        // A fulfillment value should be handled by `resolve`.  The return value
        // of `onFulfilled` or `onRejected` should be handled by `resolve`.  An
        // unhandled rejection reason should be passed to `reject`.
        var resolveOrReject = (state < 2 || isFunction(callback)) ? resolve : reject;
        try {
          resolveOrReject(isFunction(callback) ? callback(valueOrReason) : valueOrReason);
        } catch (e) {
          reject(e);
        }
      });
      if (state) {
        // If `promise` is already fulfilled, call its callbacks presently.
        callCallbacks();
      }
      return deferred.promise;
    }

    // Access the current or eventual reason of `promise`.
    function promiseCatch(onRejected) {
      return promiseThen(0, onRejected);
    }

    var promise = {
      then: promiseThen,
      'catch': promiseCatch // Quotes for old IE
    };

    // Reject, unguarded.
    function rejectInner(reason) {
      state = 2;
      valueOrReason = reason;
      callCallbacks();
    }

    // Reject `promise` with `reason`.
    function reject(reason) {
      if (fulfilledOrRejected) {
        return;
      }
      rejectInner(reason);
      fulfilledOrRejected = 1;
    }

    // Resolve, unguarded.  Implements the promise resolution procedure.
    function resolveInner(x) {
      if (promise === x) {
        throw TypeError();
      }
      var called;
      try {
        var then;
        if ((isObject(x) || isFunction(x)) && isFunction(then = x.then)) {
          // Try to make `promise` adopt the state of `x`, a thenable.
          then.call(x, function (y) {
            if (called) {
              return;
            }
            called = 1;
            resolveInner(y);
          }, function (r) {
            if (called) {
              return;
            }
            called = 1;
            rejectInner(r);
          });
        } else {
          // Fulfill `promise` with `x`, a non-thenable.
          state = 1;
          valueOrReason = x;
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

    // Fulfill `promise` with `value`.
    function resolve(value) {
      if (fulfilledOrRejected) {
        return;
      }
      resolveInner(value);
      fulfilledOrRejected = 1;
    }

    return {
      promise: promise,
      resolve: resolve,
      reject: reject
    };
  }

  // Create a promise fulfilled with `value`.
  function resolve(value) {
    var deferred = defer();
    deferred.resolve(value);
    return deferred.promise;
  }

  // Create a promise rejected with `reason`.
  function reject(reason) {
    var deferred = defer();
    deferred.reject(reason);
    return deferred.promise;
  }

  // Create a promise fulfilled with the values of `collection` or rejected by
  // one value of `collection`, where `collection` is an array or object.
  function all(collection) {
    var array = isArray(collection);
    var deferred = defer();
    var values = array ? [] : {};
    var count = 0;
    var length = array ? collection.length : 0;
    function iteratee(key) {
      resolve(collection[key]).then(function (value) {
        values[key] = value;
        count += 1;
        if (count === length) {
          deferred.resolve(values);
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
      deferred.resolve(values);
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
