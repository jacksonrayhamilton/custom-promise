/*jshint laxcomma: true, plusplus: false, strict: false */
/*global setTimeout */
/*exported p */

var p = (function () {

  var defer = function () {
    // Truthy flag to prevent multiple fulfillments or rejections.
    var fulfilledOrRejected;

    // Fulfilled state is 1, rejected is 2.
    var state;

    // Final value of the promise.
    var valueOrReason;

    // Pending handlers for `then`.
    var callbacks = [];

    // Execute all pending handlers asynchronously.
    var callCallbacks = function () {
      var callback;
      while ((callback = callbacks.shift())) {
        setTimeout(callback);
      }
    };

    // Access the current or eventual value or reason of `promise`.
    var promiseThen = function (onFulfilled, onRejected) {
      var deferred = defer();
      callbacks.push(function () {
        // Call the callback for the state of `promise`.
        var callback = state < 2 ? onFulfilled : onRejected;
        // A fulfillment value should be handled by `resolve`.  The return value
        // of `onFulfilled` or `onRejected` should be handled by `resolve`.  An
        // unhandled rejection reason should be passed to `reject`.
        var resolveOrReject =
            (state < 2 || typeof callback === 'function') ?
            deferred.resolve :
            deferred.reject;
        try {
          resolveOrReject(
            typeof callback === 'function' ? callback(valueOrReason) : valueOrReason
          );
        } catch (e) {
          deferred.reject(e);
        }
      });
      if (state) {
        // If `promise` is already fulfilled, call its callbacks presently.
        callCallbacks();
      }
      return deferred.promise;
    };

    var promise = {
      then: promiseThen
      // @ifdef EXTRA
      // Access the current or eventual reason of `promise`.
      , 'catch': function (onRejected) { // Quotes for old IE
        return promiseThen(0, onRejected);
      }
      // @endif
    };

    // Implements the promise resolution procedure.
    var resolutionProcedure = function (x) {
      if (promise === x) {
        throw TypeError();
      }
      // Truthy flag to prevent multiple fulfillments or rejections.
      var called;
      var then;
      try {
        if (
          ((x && typeof x === 'object') || typeof x === 'function') &&
          typeof (then = x.then) === 'function'
        ) {
          // Try to make `promise` adopt the state of `x`, a thenable.
          then.call(x, function (y) {
            if (called) {
              return;
            }
            // Set "called" flag.
            called = 2;
            resolutionProcedure(y);
          }, function (r) {
            if (called) {
              return;
            }
            // Set rejected state while also setting "called" flag.
            called = state = 2;
            valueOrReason = r;
            callCallbacks();
          });
        } else {
          // Fulfill `promise` with `x`, a non-thenable.
          state = 1;
          valueOrReason = x;
          callCallbacks();
        }
      } catch (e) {
        // Uglify wasn't optimizing the following line for some reason.  It is
        // the same logic as in the onRejected callback above.
        /*jshint nocomma: false, -W030 */
        called ||
          (called = state = 2, valueOrReason = e, callCallbacks());
        /*jshint nocomma: true, +W030 */
      }
    };

    return {
      promise: promise,
      // Fulfill `promise` with `value`.
      resolve: function (value) {
        if (fulfilledOrRejected) {
          return;
        }
        resolutionProcedure(value);
        fulfilledOrRejected = 1;
      },
      // Reject `promise` with `reason`.
      reject: function (reason) {
        if (fulfilledOrRejected) {
          return;
        }
        fulfilledOrRejected = state = 2;
        valueOrReason = reason;
        callCallbacks();
      }
    };
  };

  // @ifdef EXTRA
  // Create a promise fulfilled with `value`.
  var resolve = function (value) {
    var deferred = defer();
    deferred.resolve(value);
    return deferred.promise;
  };

  // @endif
  return {
    defer: defer
    // @ifdef EXTRA
    , resolve: resolve
    // Create a promise rejected with `reason`.
    , reject: function (reason) {
      var deferred = defer();
      deferred.reject(reason);
      return deferred.promise;
    }
    // Create a promise fulfilled with the values of `collection` or rejected by
    // one value of `collection`, where `collection` is an array or object.
    , all: function (collection) {
      var deferred = defer();
      var count = 0;
      var length = 'length' in collection ? collection.length : 0;
      var values = 'length' in collection ? [] : {};
      var iteratee = function (key) {
        resolve(collection[key]).then(function (value) {
          values[key] = value;
          if (++count === length) { // Increment and then compare.
            deferred.resolve(values);
          }
        }, deferred.reject);
      };
      var key = 0;
      if ('length' in collection) {
        while (key < length) {
          iteratee(key++); // Pass current key and then increment.
        }
      } else {
        for (key in collection) {
          if ({}.hasOwnProperty.call(collection, key)) {
            ++length;
            iteratee(key);
          }
        }
      }
      if (!length) {
        deferred.resolve(values);
      }
      return deferred.promise;
    }
    // @endif
  };

}());
