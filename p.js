/*jshint laxcomma: true, plusplus: false, strict: false */
/*global setTimeout */
/*exported p */

var p = (function () {

  var p = function (executor) {
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
      return p(function (resolve, reject) {
        callbacks.push(function () {
          // Call the callback for the state of `promise`.
          var callback = state < 2 ? onFulfilled : onRejected;
          try {
            // A fulfillment value should be resolved.  The return value of
            // `onFulfilled` or `onRejected` should be resolved.  An unhandled
            // rejection reason should be rejected.
            ((state < 2 || typeof callback === 'function') ? resolve : reject)(
              typeof callback === 'function' ? callback(valueOrReason) : valueOrReason
            );
          } catch (e) {
            reject(e);
          }
        });
        if (state) {
          // If `promise` is already fulfilled, call its callbacks presently.
          callCallbacks();
        }
      });
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

    executor(
      // Fulfill `promise` with `value`.
      function (value) {
        if (fulfilledOrRejected) {
          return;
        }
        resolutionProcedure(value);
        fulfilledOrRejected = 1;
      },
      // Reject `promise` with `reason`.
      function (reason) {
        if (fulfilledOrRejected) {
          return;
        }
        fulfilledOrRejected = state = 2;
        valueOrReason = reason;
        callCallbacks();
      }
    );

    return promise;
  };

  // @ifdef EXTRA
  // Create a promise fulfilled with `value`.
  var pResolve = p.resolve = function (value) {
    return p(function (resolve, reject) {
      /*jshint unused: false */
      resolve(value);
    });
  };

  // Create a promise rejected with `reason`.
  p.reject = function (reason) {
    return p(function (resolve, reject) {
      /*jshint unused: true */
      reject(reason);
    });
  };

  // Create a promise fulfilled with the values of `collection` or rejected by
  // one value of `collection`, where `collection` is an [array-like] object.
  p.all = function (collection) {
    return p(function (resolve, reject) {
      var count = 0;
      var length = 'length' in collection ? collection.length : 0;
      var values = 'length' in collection ? [] : {};
      var iteratee = function (key) {
        pResolve(collection[key]).then(function (value) {
          values[key] = value;
          if (++count === length) { // Increment and then compare.
            resolve(values);
          }
        }, reject);
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
        resolve(values);
      }
    });
  };
  // @endif

  return p;

}());
