/*jshint browser: true, globalstrict: true */
/*global setImmediate */

'use strict';

var task =
  typeof setImmediate === 'function' ? setImmediate :
  setTimeout;

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
        then.call(x, function resolvePromise(y) {
          if (called) {
            return;
          }
          called = true;
          resolutionProcedure(promise, y, resolve, reject);
        }, function rejectPromise(r) {
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

function p(executor) {
  var instance = {};
  if (!isFunction(executor)) {
    throw new TypeError('Argument 1 must be a function');
  }
  var state;
  var value;
  var reason;
  var fulfilleds;
  var rejecteds;
  var resolvers;
  var rejectors;
  var promises;
  function empty() {
    fulfilleds = [];
    rejecteds = [];
    resolvers = [];
    rejectors = [];
    promises = [];
  }
  empty();
  function resolve(_value) {
    state = 'resolved';
    value = _value;
    fulfilleds.forEach(function (onFulfilled, index) {
      var promise = promises[index];
      var resolver = resolvers[index];
      var rejector = rejectors[index];
      task(function () {
        try {
          var x = isFunction(onFulfilled) ? onFulfilled(value) : value;
          resolutionProcedure(promise, x, resolver, rejector);
        } catch (e) {
          rejector(e);
        }
      });
    });
    empty();
  }
  function reject(_reason) {
    state = 'rejected';
    reason = _reason;
    rejecteds.forEach(function (onRejected, index) {
      var promise = promises[index];
      var resolver = resolvers[index];
      var rejector = rejectors[index];
      task(function () {
        try {
          if (isFunction(onRejected)) {
            var x = onRejected(reason);
            resolutionProcedure(promise, x, resolver, rejector);
          } else {
            rejector(reason);
          }
        } catch (e) {
          rejector(e);
        }
      });
    });
    empty();
  }
  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
  instance.then = function (onFulfilled, onRejected) {
    fulfilleds.push(onFulfilled);
    rejecteds.push(onRejected);
    var thenPromise = p(function (resolve, reject) {
      resolvers.push(resolve);
      rejectors.push(reject);
    });
    promises.push(thenPromise);
    if (state === 'resolved') {
      resolve(value);
    }
    if (state === 'rejected') {
      reject(reason);
    }
    return thenPromise;
  };
  instance.catch = function (onRejected) {
    return instance.then(undefined, onRejected);
  };
  return instance;
}
