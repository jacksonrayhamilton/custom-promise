(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint-env node */
/* eslint-disable no-sync */

'use strict';


var template = require('lodash/template');
var pTemplate = template("<%= envSettings %>/* eslint-disable callback-return, no-implicit-globals, no-plusplus, no-shadow, strict */\n<%= globalSettings %>/* exported p */\n\n<% if (wrap) { %>var p = (function () {\n\n<% } %>  var p = function <% if (nfe) { %>p <% } %>(executor) {\n\n    // Truthy flag to prevent multiple fulfillments or rejections.\n    var fulfilledOrRejected;\n\n    // Fulfilled state is 1, rejected is 2.\n    var state;\n\n    // Final value of the promise.\n    var valueOrReason;\n\n    // Pending handlers for `then`.\n    var callbacks = [];\n\n    // Execute all pending handlers asynchronously.\n    var callCallbacks = function () {\n      var callback;\n      while ((callback = callbacks.shift())) {\n        <%= task %>(callback);\n      }\n    };\n\n    <% if (includeCatch) { %>// Access the current or eventual value or reason of `promise`.\n    var promiseThen = <%= indentCode(then, 2) %>;\n\n    var promise = {\n      then: promiseThen,\n      // Access the current or eventual reason of `promise`.\n      <%= catchKey %>: function (onRejected) {<%= catchKeyComment %>\n        return promiseThen(0, onRejected);\n      }\n    };<% } else { %>var promise = {\n      // Access the current or eventual value or reason of `promise`.\n      then: <%= indentCode(then, 3) %>\n    };<% } %>\n\n    // Implements the promise resolution procedure.\n    var resolutionProcedure = function (x) {\n      if (promise === x) {\n        throw TypeError(); // eslint-disable-line new-cap\n      }\n      // Truthy flag to prevent multiple fulfillments or rejections.\n      var called;\n      var then;\n      try {\n        if (\n          ((x && typeof x === 'object') || typeof x === 'function') &&\n          typeof (then = x.then) === 'function'\n        ) {\n          // Try to make `promise` adopt the state of `x`, a thenable.\n          then.call(x, function (y) {\n            if (called) {\n              return;\n            }\n            // Set \"called\" flag.\n            called = 2;\n            resolutionProcedure(y);\n          }, function (r) {\n            if (called) {\n              return;\n            }\n            // Set rejected state while also setting \"called\" flag.\n            called = state = 2;\n            valueOrReason = r;\n            callCallbacks();\n          });\n        } else {\n          // Fulfill `promise` with `x`, a non-thenable.\n          state = 1;\n          valueOrReason = x;\n          callCallbacks();\n        }\n      } catch (e) {\n        // Uglify wasn't optimizing the following line for some reason.  It is\n        // the same logic as in the onRejected callback above.\n        // eslint-disable-next-line no-unused-expressions\n        called ||\n          (called = state = 2, valueOrReason = e, callCallbacks());\n      }\n    };\n\n    executor(\n      // Fulfill `promise` with `value`.\n      function (value) {\n        if (fulfilledOrRejected) {\n          return;\n        }\n        resolutionProcedure(value);\n        fulfilledOrRejected = 1;\n      },\n      // Reject `promise` with `reason`.\n      function (reason) {\n        if (fulfilledOrRejected) {\n          return;\n        }\n        fulfilledOrRejected = state = 2;\n        valueOrReason = reason;\n        callCallbacks();\n      }\n    );\n\n    return promise;\n\n  };<% if (includeResolve) { %>\n\n  // Create a promise fulfilled with `value`.\n  <% if (referenceResolve) { %>var pResolve = <% } %><% if (exposeResolve) { %>p.resolve = <% } %>function (value) {\n    // eslint-disable-next-line no-unused-vars\n    return p(function (resolve, reject) {\n      resolve(value);\n    });\n  };<% } %><% if (includeReject) { %>\n\n  // Create a promise rejected with `reason`.\n  p.reject = function (reason) {\n    return p(function (resolve, reject) {\n      reject(reason);\n    });\n  };<% } %><% if (includeAll && includeRace) { %>\n\n  // Create an `all` or `race` function.\n  var allRace = <%= allRace %>;<% } %><% if (includeAll) { %>\n\n  // Create a promise fulfilled with the values of `collection` or rejected by\n  // one value of `collection`, where `collection` is an [array-like] object.\n  p.all = <%= all %>;<% } %><% if (includeRace) { %>\n\n  // Create a promise fulfilled with the first value of `collection` to resolve\n  // or rejected by one value of `collection`, where `collection` is an\n  // [array-like] object.\n  p.race = <%= race %>;<% } %><% if (wrap) { %>\n\n  return p;\n\n}());<% } %><% if (node) { %>\n\nmodule.exports = p;<% } %>\n");
var thenTemplate = template("function (onFulfilled, onRejected) {\n  return p(function (resolve, reject) {\n    callbacks.push(function () {\n      // Call the callback for the state of `promise`.\n      var callback = state < 2 ? onFulfilled : onRejected;\n      try {\n        // A fulfillment value should be resolved.  The return value of\n        // `onFulfilled` or `onRejected` should be resolved.  An unhandled\n        // rejection reason should be rejected.\n        ((state < 2 || typeof callback === 'function') ? resolve : reject)(\n          typeof callback === 'function' ? callback(valueOrReason) : valueOrReason\n        );\n      } catch (e) {\n        reject(e);\n      }\n    });\n    if (state) {\n      // If `promise` is already fulfilled, call its callbacks presently.\n      callCallbacks();\n    }\n  });\n}");
var allRaceTemplate = template("<% if (includeBoth) { %>function (all) {\n  return <% } %>function (collection) {\n    return p(function (resolve, reject) {\n      <% if (includeAll) { %>var count = 0;\n      var values = 'length' in collection ? [] : {};\n      <% } %>var length = 'length' in collection ? collection.length : 0;\n      var iteratee = function (key) {\n        pResolve(collection[key]).then(<% if (includeBoth) { %>all ? <% } %><% if (includeAll) { %>function (value) {\n          values[key] = value;\n          if (++count === length) { // Increment and then compare.\n            resolve(values);\n          }\n        }<% } %><% if (includeBoth) { %> : <% } %><% if (includeRace) { %>resolve<% } %>, reject);\n      };\n      var key = 0;\n      if ('length' in collection) {\n        while (key < length) {\n          iteratee(key++); // Pass current key and then increment.\n        }\n      } else {\n        for (key in collection) {\n          if ({}.hasOwnProperty.call(collection, key)) {\n            ++length;\n            iteratee(key);\n          }\n        }\n      }<% if (includeAll) { %>\n      if (<% if (includeBoth) { %>all && <% } %>!length) {\n        resolve(values);\n      }<% } %>\n    });\n  }<% if (includeBoth) { %>;\n}<% } %>");

var getIndentation = function (level) {
  var indentation = '';
  for (var i = 0; i < level; i += 1) {
    indentation += '  ';
  }
  return indentation;
};

// Increase every line of `code` after the first by `levels` of indentation.
var indentCode = function (code, levels) {
  return code.replace(new RegExp('\\n', 'g'), '\n' + getIndentation(levels));
};

// Decrease every line of `code` after the first by `levels` of indentation.
var dedentCode = function (code, levels) {
  return code.replace(new RegExp('\\n' + getIndentation(levels), 'g'), '\n');
};

// Determine flags to set on the program template and return generated code.
var build = function (options) {
  options = options || {};

  var node = Boolean(options.node);

  var task =
      options.task ? options.task
      : node ? 'process.nextTick'
      : 'setTimeout';
  var globals = options.globals || (
      (options.task || node) ? []
      : ['setTimeout']
  );

  var exposeCatch = Boolean(options.catch);
  var exposeResolve = Boolean(options.resolve);
  var exposeReject = Boolean(options.reject);
  var exposeAll = Boolean(options.all);
  var exposeRace = Boolean(options.race);

  var includeCatch = exposeCatch;
  var includeReject = exposeReject;
  var includeAll = exposeAll;
  var includeRace = exposeRace;
  var includeResolve = exposeResolve || includeReject || includeAll || includeRace;

  var referenceResolve = includeReject || includeAll || includeRace;

  var ie = Boolean(options.ie);
  var catchKey = ie ? '\'catch\'' : 'catch';
  var catchKeyComment = ie ? ' // Quotes for old IE' : '';

  var wrap =
      ((includeResolve || includeReject || includeAll || includeRace) && !node) ||
      ie; // IE has named function expression bugs.

  // Use a named function expression to maintain a reference to `p` regardless
  // of global variable tampering.
  var nfe = !wrap && !node;

  var envs = options.envs || [];

  if (node) {
    envs.push('node');
  }

  var envSettings = envs.length > 0 ? '/* eslint-env ' + envs.join(',') + ' */\n' : '';
  var globalSettings = globals.length > 0 ? '/* global ' + globals.join(',') + ' */\n' : '';

  var then = thenTemplate();

  var allRace = allRaceTemplate({
    includeAll: includeAll,
    includeRace: includeRace,
    includeBoth: includeAll && includeRace
  });

  var all;
  var race;
  if (includeAll && includeRace) {
    allRace = indentCode(allRace, 1);
    all = 'allRace(1)';
    race = 'allRace(0)';
  } else {
    all = allRace;
    race = allRace;
  }

  var code = pTemplate({
    indentCode: indentCode,
    envSettings: envSettings,
    globalSettings: globalSettings,
    then: then,
    allRace: allRace,
    all: all,
    race: race,
    task: task,
    exposeCatch: exposeCatch,
    exposeResolve: exposeResolve,
    exposeReject: exposeReject,
    exposeAll: exposeAll,
    exposeRace: exposeRace,
    includeCatch: includeCatch,
    includeResolve: includeResolve,
    includeReject: includeReject,
    includeAll: includeAll,
    includeRace: includeRace,
    referenceResolve: referenceResolve,
    wrap: wrap,
    nfe: nfe,
    ie: ie,
    node: node,
    catchKey: catchKey,
    catchKeyComment: catchKeyComment
  });

  if (!wrap) {
    code = dedentCode(code, 1);
  }

  return code;
};

module.exports = build;

},{"lodash/template":60}],2:[function(require,module,exports){
/* eslint-env worker */
/* eslint-disable camelcase */

'use strict';

var build = require('../build');
var UglifyJS = require('uglify-js');
var zlib = require('zlib');

var running = false;
var canceled = false;

var startBuild = function (options) {

  running = true;

  var stats = {};

  var buildOutput = build(options);
  stats.uncompressed = buildOutput.length;

  var uglifyOutput = UglifyJS.minify(buildOutput, {
    fromString: true,
    mangle: {
      screw_ie8: !options.ie
    },
    output: {
      screw_ie8: !options.ie
    },
    compress: {
      screw_ie8: !options.ie
    }
  }).code;
  stats.uglified = uglifyOutput.length;

  var gzipOutput = zlib.gzipSync(uglifyOutput); // eslint-disable-line no-sync
  stats.uglifiedGzipped = gzipOutput.length;

  // Allow a cancelation event to fire.
  setTimeout(function () {
    if (canceled) {
      canceled = false;
    } else {
      postMessage({
        name: 'complete',
        output: buildOutput,
        stats: stats
      });
    }
    running = false;
  });

};

onmessage = function (event) {
  if (event.data.name === 'build') {
    startBuild(event.data.options);
  } else if (event.data.name === 'cancel') {
    if (running) {
      canceled = true;
    }
  }
};

},{"../build":1,"uglify-js":95,"zlib":7}],3:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":98}],4:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
(function (process,Buffer){
var msg = require('pako/lib/zlib/messages');
var zstream = require('pako/lib/zlib/zstream');
var zlib_deflate = require('pako/lib/zlib/deflate.js');
var zlib_inflate = require('pako/lib/zlib/inflate.js');
var constants = require('pako/lib/zlib/constants');

for (var key in constants) {
  exports[key] = constants[key];
}

// zlib modes
exports.NONE = 0;
exports.DEFLATE = 1;
exports.INFLATE = 2;
exports.GZIP = 3;
exports.GUNZIP = 4;
exports.DEFLATERAW = 5;
exports.INFLATERAW = 6;
exports.UNZIP = 7;

/**
 * Emulate Node's zlib C++ layer for use by the JS layer in index.js
 */
function Zlib(mode) {
  if (mode < exports.DEFLATE || mode > exports.UNZIP)
    throw new TypeError("Bad argument");
    
  this.mode = mode;
  this.init_done = false;
  this.write_in_progress = false;
  this.pending_close = false;
  this.windowBits = 0;
  this.level = 0;
  this.memLevel = 0;
  this.strategy = 0;
  this.dictionary = null;
}

Zlib.prototype.init = function(windowBits, level, memLevel, strategy, dictionary) {
  this.windowBits = windowBits;
  this.level = level;
  this.memLevel = memLevel;
  this.strategy = strategy;
  // dictionary not supported.
  
  if (this.mode === exports.GZIP || this.mode === exports.GUNZIP)
    this.windowBits += 16;
    
  if (this.mode === exports.UNZIP)
    this.windowBits += 32;
    
  if (this.mode === exports.DEFLATERAW || this.mode === exports.INFLATERAW)
    this.windowBits = -this.windowBits;
    
  this.strm = new zstream();
  
  switch (this.mode) {
    case exports.DEFLATE:
    case exports.GZIP:
    case exports.DEFLATERAW:
      var status = zlib_deflate.deflateInit2(
        this.strm,
        this.level,
        exports.Z_DEFLATED,
        this.windowBits,
        this.memLevel,
        this.strategy
      );
      break;
    case exports.INFLATE:
    case exports.GUNZIP:
    case exports.INFLATERAW:
    case exports.UNZIP:
      var status  = zlib_inflate.inflateInit2(
        this.strm,
        this.windowBits
      );
      break;
    default:
      throw new Error("Unknown mode " + this.mode);
  }
  
  if (status !== exports.Z_OK) {
    this._error(status);
    return;
  }
  
  this.write_in_progress = false;
  this.init_done = true;
};

Zlib.prototype.params = function() {
  throw new Error("deflateParams Not supported");
};

Zlib.prototype._writeCheck = function() {
  if (!this.init_done)
    throw new Error("write before init");
    
  if (this.mode === exports.NONE)
    throw new Error("already finalized");
    
  if (this.write_in_progress)
    throw new Error("write already in progress");
    
  if (this.pending_close)
    throw new Error("close is pending");
};

Zlib.prototype.write = function(flush, input, in_off, in_len, out, out_off, out_len) {    
  this._writeCheck();
  this.write_in_progress = true;
  
  var self = this;
  process.nextTick(function() {
    self.write_in_progress = false;
    var res = self._write(flush, input, in_off, in_len, out, out_off, out_len);
    self.callback(res[0], res[1]);
    
    if (self.pending_close)
      self.close();
  });
  
  return this;
};

// set method for Node buffers, used by pako
function bufferSet(data, offset) {
  for (var i = 0; i < data.length; i++) {
    this[offset + i] = data[i];
  }
}

Zlib.prototype.writeSync = function(flush, input, in_off, in_len, out, out_off, out_len) {
  this._writeCheck();
  return this._write(flush, input, in_off, in_len, out, out_off, out_len);
};

Zlib.prototype._write = function(flush, input, in_off, in_len, out, out_off, out_len) {
  this.write_in_progress = true;
  
  if (flush !== exports.Z_NO_FLUSH &&
      flush !== exports.Z_PARTIAL_FLUSH &&
      flush !== exports.Z_SYNC_FLUSH &&
      flush !== exports.Z_FULL_FLUSH &&
      flush !== exports.Z_FINISH &&
      flush !== exports.Z_BLOCK) {
    throw new Error("Invalid flush value");
  }
  
  if (input == null) {
    input = new Buffer(0);
    in_len = 0;
    in_off = 0;
  }
  
  if (out._set)
    out.set = out._set;
  else
    out.set = bufferSet;
  
  var strm = this.strm;
  strm.avail_in = in_len;
  strm.input = input;
  strm.next_in = in_off;
  strm.avail_out = out_len;
  strm.output = out;
  strm.next_out = out_off;
  
  switch (this.mode) {
    case exports.DEFLATE:
    case exports.GZIP:
    case exports.DEFLATERAW:
      var status = zlib_deflate.deflate(strm, flush);
      break;
    case exports.UNZIP:
    case exports.INFLATE:
    case exports.GUNZIP:
    case exports.INFLATERAW:
      var status = zlib_inflate.inflate(strm, flush);
      break;
    default:
      throw new Error("Unknown mode " + this.mode);
  }
  
  if (status !== exports.Z_STREAM_END && status !== exports.Z_OK) {
    this._error(status);
  }
  
  this.write_in_progress = false;
  return [strm.avail_in, strm.avail_out];
};

Zlib.prototype.close = function() {
  if (this.write_in_progress) {
    this.pending_close = true;
    return;
  }
  
  this.pending_close = false;
  
  if (this.mode === exports.DEFLATE || this.mode === exports.GZIP || this.mode === exports.DEFLATERAW) {
    zlib_deflate.deflateEnd(this.strm);
  } else {
    zlib_inflate.inflateEnd(this.strm);
  }
  
  this.mode = exports.NONE;
};

Zlib.prototype.reset = function() {
  switch (this.mode) {
    case exports.DEFLATE:
    case exports.DEFLATERAW:
      var status = zlib_deflate.deflateReset(this.strm);
      break;
    case exports.INFLATE:
    case exports.INFLATERAW:
      var status = zlib_inflate.inflateReset(this.strm);
      break;
  }
  
  if (status !== exports.Z_OK) {
    this._error(status);
  }
};

Zlib.prototype._error = function(status) {
  this.onerror(msg[status] + ': ' + this.strm.msg, status);
  
  this.write_in_progress = false;
  if (this.pending_close)
    this.close();
};

exports.Zlib = Zlib;

}).call(this,require('_process'),require("buffer").Buffer)

},{"_process":77,"buffer":8,"pako/lib/zlib/constants":67,"pako/lib/zlib/deflate.js":69,"pako/lib/zlib/inflate.js":71,"pako/lib/zlib/messages":73,"pako/lib/zlib/zstream":75}],7:[function(require,module,exports){
(function (process,Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Transform = require('_stream_transform');

var binding = require('./binding');
var util = require('util');
var assert = require('assert').ok;

// zlib doesn't provide these, so kludge them in following the same
// const naming scheme zlib uses.
binding.Z_MIN_WINDOWBITS = 8;
binding.Z_MAX_WINDOWBITS = 15;
binding.Z_DEFAULT_WINDOWBITS = 15;

// fewer than 64 bytes per chunk is stupid.
// technically it could work with as few as 8, but even 64 bytes
// is absurdly low.  Usually a MB or more is best.
binding.Z_MIN_CHUNK = 64;
binding.Z_MAX_CHUNK = Infinity;
binding.Z_DEFAULT_CHUNK = (16 * 1024);

binding.Z_MIN_MEMLEVEL = 1;
binding.Z_MAX_MEMLEVEL = 9;
binding.Z_DEFAULT_MEMLEVEL = 8;

binding.Z_MIN_LEVEL = -1;
binding.Z_MAX_LEVEL = 9;
binding.Z_DEFAULT_LEVEL = binding.Z_DEFAULT_COMPRESSION;

// expose all the zlib constants
Object.keys(binding).forEach(function(k) {
  if (k.match(/^Z/)) exports[k] = binding[k];
});

// translation table for return codes.
exports.codes = {
  Z_OK: binding.Z_OK,
  Z_STREAM_END: binding.Z_STREAM_END,
  Z_NEED_DICT: binding.Z_NEED_DICT,
  Z_ERRNO: binding.Z_ERRNO,
  Z_STREAM_ERROR: binding.Z_STREAM_ERROR,
  Z_DATA_ERROR: binding.Z_DATA_ERROR,
  Z_MEM_ERROR: binding.Z_MEM_ERROR,
  Z_BUF_ERROR: binding.Z_BUF_ERROR,
  Z_VERSION_ERROR: binding.Z_VERSION_ERROR
};

Object.keys(exports.codes).forEach(function(k) {
  exports.codes[exports.codes[k]] = k;
});

exports.Deflate = Deflate;
exports.Inflate = Inflate;
exports.Gzip = Gzip;
exports.Gunzip = Gunzip;
exports.DeflateRaw = DeflateRaw;
exports.InflateRaw = InflateRaw;
exports.Unzip = Unzip;

exports.createDeflate = function(o) {
  return new Deflate(o);
};

exports.createInflate = function(o) {
  return new Inflate(o);
};

exports.createDeflateRaw = function(o) {
  return new DeflateRaw(o);
};

exports.createInflateRaw = function(o) {
  return new InflateRaw(o);
};

exports.createGzip = function(o) {
  return new Gzip(o);
};

exports.createGunzip = function(o) {
  return new Gunzip(o);
};

exports.createUnzip = function(o) {
  return new Unzip(o);
};


// Convenience methods.
// compress/decompress a string or buffer in one step.
exports.deflate = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Deflate(opts), buffer, callback);
};

exports.deflateSync = function(buffer, opts) {
  return zlibBufferSync(new Deflate(opts), buffer);
};

exports.gzip = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Gzip(opts), buffer, callback);
};

exports.gzipSync = function(buffer, opts) {
  return zlibBufferSync(new Gzip(opts), buffer);
};

exports.deflateRaw = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new DeflateRaw(opts), buffer, callback);
};

exports.deflateRawSync = function(buffer, opts) {
  return zlibBufferSync(new DeflateRaw(opts), buffer);
};

exports.unzip = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Unzip(opts), buffer, callback);
};

exports.unzipSync = function(buffer, opts) {
  return zlibBufferSync(new Unzip(opts), buffer);
};

exports.inflate = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Inflate(opts), buffer, callback);
};

exports.inflateSync = function(buffer, opts) {
  return zlibBufferSync(new Inflate(opts), buffer);
};

exports.gunzip = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Gunzip(opts), buffer, callback);
};

exports.gunzipSync = function(buffer, opts) {
  return zlibBufferSync(new Gunzip(opts), buffer);
};

exports.inflateRaw = function(buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new InflateRaw(opts), buffer, callback);
};

exports.inflateRawSync = function(buffer, opts) {
  return zlibBufferSync(new InflateRaw(opts), buffer);
};

function zlibBuffer(engine, buffer, callback) {
  var buffers = [];
  var nread = 0;

  engine.on('error', onError);
  engine.on('end', onEnd);

  engine.end(buffer);
  flow();

  function flow() {
    var chunk;
    while (null !== (chunk = engine.read())) {
      buffers.push(chunk);
      nread += chunk.length;
    }
    engine.once('readable', flow);
  }

  function onError(err) {
    engine.removeListener('end', onEnd);
    engine.removeListener('readable', flow);
    callback(err);
  }

  function onEnd() {
    var buf = Buffer.concat(buffers, nread);
    buffers = [];
    callback(null, buf);
    engine.close();
  }
}

function zlibBufferSync(engine, buffer) {
  if (typeof buffer === 'string')
    buffer = new Buffer(buffer);
  if (!Buffer.isBuffer(buffer))
    throw new TypeError('Not a string or buffer');

  var flushFlag = binding.Z_FINISH;

  return engine._processChunk(buffer, flushFlag);
}

// generic zlib
// minimal 2-byte header
function Deflate(opts) {
  if (!(this instanceof Deflate)) return new Deflate(opts);
  Zlib.call(this, opts, binding.DEFLATE);
}

function Inflate(opts) {
  if (!(this instanceof Inflate)) return new Inflate(opts);
  Zlib.call(this, opts, binding.INFLATE);
}



// gzip - bigger header, same deflate compression
function Gzip(opts) {
  if (!(this instanceof Gzip)) return new Gzip(opts);
  Zlib.call(this, opts, binding.GZIP);
}

function Gunzip(opts) {
  if (!(this instanceof Gunzip)) return new Gunzip(opts);
  Zlib.call(this, opts, binding.GUNZIP);
}



// raw - no header
function DeflateRaw(opts) {
  if (!(this instanceof DeflateRaw)) return new DeflateRaw(opts);
  Zlib.call(this, opts, binding.DEFLATERAW);
}

function InflateRaw(opts) {
  if (!(this instanceof InflateRaw)) return new InflateRaw(opts);
  Zlib.call(this, opts, binding.INFLATERAW);
}


// auto-detect header.
function Unzip(opts) {
  if (!(this instanceof Unzip)) return new Unzip(opts);
  Zlib.call(this, opts, binding.UNZIP);
}


// the Zlib class they all inherit from
// This thing manages the queue of requests, and returns
// true or false if there is anything in the queue when
// you call the .write() method.

function Zlib(opts, mode) {
  this._opts = opts = opts || {};
  this._chunkSize = opts.chunkSize || exports.Z_DEFAULT_CHUNK;

  Transform.call(this, opts);

  if (opts.flush) {
    if (opts.flush !== binding.Z_NO_FLUSH &&
        opts.flush !== binding.Z_PARTIAL_FLUSH &&
        opts.flush !== binding.Z_SYNC_FLUSH &&
        opts.flush !== binding.Z_FULL_FLUSH &&
        opts.flush !== binding.Z_FINISH &&
        opts.flush !== binding.Z_BLOCK) {
      throw new Error('Invalid flush flag: ' + opts.flush);
    }
  }
  this._flushFlag = opts.flush || binding.Z_NO_FLUSH;

  if (opts.chunkSize) {
    if (opts.chunkSize < exports.Z_MIN_CHUNK ||
        opts.chunkSize > exports.Z_MAX_CHUNK) {
      throw new Error('Invalid chunk size: ' + opts.chunkSize);
    }
  }

  if (opts.windowBits) {
    if (opts.windowBits < exports.Z_MIN_WINDOWBITS ||
        opts.windowBits > exports.Z_MAX_WINDOWBITS) {
      throw new Error('Invalid windowBits: ' + opts.windowBits);
    }
  }

  if (opts.level) {
    if (opts.level < exports.Z_MIN_LEVEL ||
        opts.level > exports.Z_MAX_LEVEL) {
      throw new Error('Invalid compression level: ' + opts.level);
    }
  }

  if (opts.memLevel) {
    if (opts.memLevel < exports.Z_MIN_MEMLEVEL ||
        opts.memLevel > exports.Z_MAX_MEMLEVEL) {
      throw new Error('Invalid memLevel: ' + opts.memLevel);
    }
  }

  if (opts.strategy) {
    if (opts.strategy != exports.Z_FILTERED &&
        opts.strategy != exports.Z_HUFFMAN_ONLY &&
        opts.strategy != exports.Z_RLE &&
        opts.strategy != exports.Z_FIXED &&
        opts.strategy != exports.Z_DEFAULT_STRATEGY) {
      throw new Error('Invalid strategy: ' + opts.strategy);
    }
  }

  if (opts.dictionary) {
    if (!Buffer.isBuffer(opts.dictionary)) {
      throw new Error('Invalid dictionary: it should be a Buffer instance');
    }
  }

  this._binding = new binding.Zlib(mode);

  var self = this;
  this._hadError = false;
  this._binding.onerror = function(message, errno) {
    // there is no way to cleanly recover.
    // continuing only obscures problems.
    self._binding = null;
    self._hadError = true;

    var error = new Error(message);
    error.errno = errno;
    error.code = exports.codes[errno];
    self.emit('error', error);
  };

  var level = exports.Z_DEFAULT_COMPRESSION;
  if (typeof opts.level === 'number') level = opts.level;

  var strategy = exports.Z_DEFAULT_STRATEGY;
  if (typeof opts.strategy === 'number') strategy = opts.strategy;

  this._binding.init(opts.windowBits || exports.Z_DEFAULT_WINDOWBITS,
                     level,
                     opts.memLevel || exports.Z_DEFAULT_MEMLEVEL,
                     strategy,
                     opts.dictionary);

  this._buffer = new Buffer(this._chunkSize);
  this._offset = 0;
  this._closed = false;
  this._level = level;
  this._strategy = strategy;

  this.once('end', this.close);
}

util.inherits(Zlib, Transform);

Zlib.prototype.params = function(level, strategy, callback) {
  if (level < exports.Z_MIN_LEVEL ||
      level > exports.Z_MAX_LEVEL) {
    throw new RangeError('Invalid compression level: ' + level);
  }
  if (strategy != exports.Z_FILTERED &&
      strategy != exports.Z_HUFFMAN_ONLY &&
      strategy != exports.Z_RLE &&
      strategy != exports.Z_FIXED &&
      strategy != exports.Z_DEFAULT_STRATEGY) {
    throw new TypeError('Invalid strategy: ' + strategy);
  }

  if (this._level !== level || this._strategy !== strategy) {
    var self = this;
    this.flush(binding.Z_SYNC_FLUSH, function() {
      self._binding.params(level, strategy);
      if (!self._hadError) {
        self._level = level;
        self._strategy = strategy;
        if (callback) callback();
      }
    });
  } else {
    process.nextTick(callback);
  }
};

Zlib.prototype.reset = function() {
  return this._binding.reset();
};

// This is the _flush function called by the transform class,
// internally, when the last chunk has been written.
Zlib.prototype._flush = function(callback) {
  this._transform(new Buffer(0), '', callback);
};

Zlib.prototype.flush = function(kind, callback) {
  var ws = this._writableState;

  if (typeof kind === 'function' || (kind === void 0 && !callback)) {
    callback = kind;
    kind = binding.Z_FULL_FLUSH;
  }

  if (ws.ended) {
    if (callback)
      process.nextTick(callback);
  } else if (ws.ending) {
    if (callback)
      this.once('end', callback);
  } else if (ws.needDrain) {
    var self = this;
    this.once('drain', function() {
      self.flush(callback);
    });
  } else {
    this._flushFlag = kind;
    this.write(new Buffer(0), '', callback);
  }
};

Zlib.prototype.close = function(callback) {
  if (callback)
    process.nextTick(callback);

  if (this._closed)
    return;

  this._closed = true;

  this._binding.close();

  var self = this;
  process.nextTick(function() {
    self.emit('close');
  });
};

Zlib.prototype._transform = function(chunk, encoding, cb) {
  var flushFlag;
  var ws = this._writableState;
  var ending = ws.ending || ws.ended;
  var last = ending && (!chunk || ws.length === chunk.length);

  if (!chunk === null && !Buffer.isBuffer(chunk))
    return cb(new Error('invalid input'));

  // If it's the last chunk, or a final flush, we use the Z_FINISH flush flag.
  // If it's explicitly flushing at some other time, then we use
  // Z_FULL_FLUSH. Otherwise, use Z_NO_FLUSH for maximum compression
  // goodness.
  if (last)
    flushFlag = binding.Z_FINISH;
  else {
    flushFlag = this._flushFlag;
    // once we've flushed the last of the queue, stop flushing and
    // go back to the normal behavior.
    if (chunk.length >= ws.length) {
      this._flushFlag = this._opts.flush || binding.Z_NO_FLUSH;
    }
  }

  var self = this;
  this._processChunk(chunk, flushFlag, cb);
};

Zlib.prototype._processChunk = function(chunk, flushFlag, cb) {
  var availInBefore = chunk && chunk.length;
  var availOutBefore = this._chunkSize - this._offset;
  var inOff = 0;

  var self = this;

  var async = typeof cb === 'function';

  if (!async) {
    var buffers = [];
    var nread = 0;

    var error;
    this.on('error', function(er) {
      error = er;
    });

    do {
      var res = this._binding.writeSync(flushFlag,
                                        chunk, // in
                                        inOff, // in_off
                                        availInBefore, // in_len
                                        this._buffer, // out
                                        this._offset, //out_off
                                        availOutBefore); // out_len
    } while (!this._hadError && callback(res[0], res[1]));

    if (this._hadError) {
      throw error;
    }

    var buf = Buffer.concat(buffers, nread);
    this.close();

    return buf;
  }

  var req = this._binding.write(flushFlag,
                                chunk, // in
                                inOff, // in_off
                                availInBefore, // in_len
                                this._buffer, // out
                                this._offset, //out_off
                                availOutBefore); // out_len

  req.buffer = chunk;
  req.callback = callback;

  function callback(availInAfter, availOutAfter) {
    if (self._hadError)
      return;

    var have = availOutBefore - availOutAfter;
    assert(have >= 0, 'have should not go down');

    if (have > 0) {
      var out = self._buffer.slice(self._offset, self._offset + have);
      self._offset += have;
      // serve some output to the consumer.
      if (async) {
        self.push(out);
      } else {
        buffers.push(out);
        nread += out.length;
      }
    }

    // exhausted the output buffer, or used all the input create a new one.
    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
      availOutBefore = self._chunkSize;
      self._offset = 0;
      self._buffer = new Buffer(self._chunkSize);
    }

    if (availOutAfter === 0) {
      // Not actually done.  Need to reprocess.
      // Also, update the availInBefore to the availInAfter value,
      // so that if we have to hit it a third (fourth, etc.) time,
      // it'll have the correct byte counts.
      inOff += (availInBefore - availInAfter);
      availInBefore = availInAfter;

      if (!async)
        return true;

      var newReq = self._binding.write(flushFlag,
                                       chunk,
                                       inOff,
                                       availInBefore,
                                       self._buffer,
                                       self._offset,
                                       self._chunkSize);
      newReq.callback = callback; // this same function
      newReq.buffer = chunk;
      return;
    }

    if (!async)
      return false;

    // finished with the chunk.
    cb();
  }
};

util.inherits(Deflate, Zlib);
util.inherits(Inflate, Zlib);
util.inherits(Gzip, Zlib);
util.inherits(Gunzip, Zlib);
util.inherits(DeflateRaw, Zlib);
util.inherits(InflateRaw, Zlib);
util.inherits(Unzip, Zlib);

}).call(this,require('_process'),require("buffer").Buffer)

},{"./binding":6,"_process":77,"_stream_transform":82,"assert":3,"buffer":8,"util":98}],8:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(array)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":4,"ieee754":11,"isarray":14}],9:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})

},{"../../is-buffer/index.js":13}],10:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],11:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],12:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],13:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],14:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],15:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Reflect = root.Reflect;

module.exports = Reflect;

},{"./_root":41}],16:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"./_root":41}],17:[function(require,module,exports){
/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {...*} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  var length = args.length;
  switch (length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

module.exports = apply;

},{}],18:[function(require,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],19:[function(require,module,exports){
var eq = require('./eq');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used by `_.defaults` to customize its `_.assignIn` use.
 *
 * @private
 * @param {*} objValue The destination value.
 * @param {*} srcValue The source value.
 * @param {string} key The key of the property to assign.
 * @param {Object} object The parent object of `objValue`.
 * @returns {*} Returns the value to assign.
 */
function assignInDefaults(objValue, srcValue, key, object) {
  if (objValue === undefined ||
      (eq(objValue, objectProto[key]) && !hasOwnProperty.call(object, key))) {
    return srcValue;
  }
  return objValue;
}

module.exports = assignInDefaults;

},{"./eq":44}],20:[function(require,module,exports){
var eq = require('./eq');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    object[key] = value;
  }
}

module.exports = assignValue;

},{"./eq":44}],21:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var getPrototypeOf = Object.getPrototypeOf;

/**
 * The base implementation of `_.has` without support for deep paths.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHas(object, key) {
  // Avoid a bug in IE 10-11 where objects with a [[Prototype]] of `null`,
  // that are composed entirely of index properties, return `false` for
  // `hasOwnProperty` checks of them.
  return hasOwnProperty.call(object, key) ||
    (typeof object == 'object' && key in object && getPrototypeOf(object) === null);
}

module.exports = baseHas;

},{}],22:[function(require,module,exports){
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = Object.keys;

/**
 * The base implementation of `_.keys` which doesn't skip the constructor
 * property of prototypes or treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  return nativeKeys(Object(object));
}

module.exports = baseKeys;

},{}],23:[function(require,module,exports){
var Reflect = require('./_Reflect'),
    iteratorToArray = require('./_iteratorToArray');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Built-in value references. */
var enumerate = Reflect ? Reflect.enumerate : undefined,
    propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * The base implementation of `_.keysIn` which doesn't skip the constructor
 * property of prototypes or treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  object = object == null ? object : Object(object);

  var result = [];
  for (var key in object) {
    result.push(key);
  }
  return result;
}

// Fallback for IE < 9 with es6-shim.
if (enumerate && !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf')) {
  baseKeysIn = function(object) {
    return iteratorToArray(enumerate(object));
  };
}

module.exports = baseKeysIn;

},{"./_Reflect":15,"./_iteratorToArray":37}],24:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],25:[function(require,module,exports){
/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

module.exports = baseTimes;

},{}],26:[function(require,module,exports){
var arrayMap = require('./_arrayMap');

/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  return arrayMap(props, function(key) {
    return object[key];
  });
}

module.exports = baseValues;

},{"./_arrayMap":18}],27:[function(require,module,exports){
/**
 * Checks if `value` is a global object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {null|Object} Returns `value` if it's a global object, else `null`.
 */
function checkGlobal(value) {
  return (value && value.Object === Object) ? value : null;
}

module.exports = checkGlobal;

},{}],28:[function(require,module,exports){
var assignValue = require('./_assignValue');

/**
 * This function is like `copyObject` except that it accepts a function to
 * customize copied values.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObjectWith(source, props, object, customizer) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : source[key];

    assignValue(object, key, newValue);
  }
  return object;
}

module.exports = copyObjectWith;

},{"./_assignValue":20}],29:[function(require,module,exports){
var isIterateeCall = require('./_isIterateeCall'),
    rest = require('./rest');

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return rest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = typeof customizer == 'function'
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"./_isIterateeCall":35,"./rest":59}],30:[function(require,module,exports){
/** Used to map characters to HTML entities. */
var htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

/**
 * Used by `_.escape` to convert characters to HTML entities.
 *
 * @private
 * @param {string} chr The matched character to escape.
 * @returns {string} Returns the escaped character.
 */
function escapeHtmlChar(chr) {
  return htmlEscapes[chr];
}

module.exports = escapeHtmlChar;

},{}],31:[function(require,module,exports){
/** Used to escape characters for inclusion in compiled string literals. */
var stringEscapes = {
  '\\': '\\',
  "'": "'",
  '\n': 'n',
  '\r': 'r',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

/**
 * Used by `_.template` to escape characters for inclusion in compiled string literals.
 *
 * @private
 * @param {string} chr The matched character to escape.
 * @returns {string} Returns the escaped character.
 */
function escapeStringChar(chr) {
  return '\\' + stringEscapes[chr];
}

module.exports = escapeStringChar;

},{}],32:[function(require,module,exports){
var baseProperty = require('./_baseProperty');

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"./_baseProperty":24}],33:[function(require,module,exports){
var baseTimes = require('./_baseTimes'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isLength = require('./isLength'),
    isString = require('./isString');

/**
 * Creates an array of index keys for `object` values of arrays,
 * `arguments` objects, and strings, otherwise `null` is returned.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array|null} Returns index keys, else `null`.
 */
function indexKeys(object) {
  var length = object ? object.length : undefined;
  if (isLength(length) &&
      (isArray(object) || isString(object) || isArguments(object))) {
    return baseTimes(length, String);
  }
  return null;
}

module.exports = indexKeys;

},{"./_baseTimes":25,"./isArguments":46,"./isArray":47,"./isLength":52,"./isString":55}],34:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],35:[function(require,module,exports){
var eq = require('./eq'),
    isArrayLike = require('./isArrayLike'),
    isIndex = require('./_isIndex'),
    isObject = require('./isObject');

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    return eq(object[index], value);
  }
  return false;
}

module.exports = isIterateeCall;

},{"./_isIndex":34,"./eq":44,"./isArrayLike":48,"./isObject":53}],36:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

module.exports = isPrototype;

},{}],37:[function(require,module,exports){
/**
 * Converts `iterator` to an array.
 *
 * @private
 * @param {Object} iterator The iterator to convert.
 * @returns {Array} Returns the converted array.
 */
function iteratorToArray(iterator) {
  var data,
      result = [];

  while (!(data = iterator.next()).done) {
    result.push(data.value);
  }
  return result;
}

module.exports = iteratorToArray;

},{}],38:[function(require,module,exports){
/** Used to match template delimiters. */
var reEscape = /<%-([\s\S]+?)%>/g;

module.exports = reEscape;

},{}],39:[function(require,module,exports){
/** Used to match template delimiters. */
var reEvaluate = /<%([\s\S]+?)%>/g;

module.exports = reEvaluate;

},{}],40:[function(require,module,exports){
/** Used to match template delimiters. */
var reInterpolate = /<%=([\s\S]+?)%>/g;

module.exports = reInterpolate;

},{}],41:[function(require,module,exports){
(function (global){
var checkGlobal = require('./_checkGlobal');

/** Used to determine if values are of the language type `Object`. */
var objectTypes = {
  'function': true,
  'object': true
};

/** Detect free variable `exports`. */
var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType)
  ? exports
  : undefined;

/** Detect free variable `module`. */
var freeModule = (objectTypes[typeof module] && module && !module.nodeType)
  ? module
  : undefined;

/** Detect free variable `global` from Node.js. */
var freeGlobal = checkGlobal(freeExports && freeModule && typeof global == 'object' && global);

/** Detect free variable `self`. */
var freeSelf = checkGlobal(objectTypes[typeof self] && self);

/** Detect free variable `window`. */
var freeWindow = checkGlobal(objectTypes[typeof window] && window);

/** Detect `this` as the global object. */
var thisGlobal = checkGlobal(objectTypes[typeof this] && this);

/**
 * Used as a reference to the global object.
 *
 * The `this` value is used if it's the global object to avoid Greasemonkey's
 * restricted `window` object, otherwise the `window` object is used.
 */
var root = freeGlobal ||
  ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) ||
    freeSelf || thisGlobal || Function('return this')();

module.exports = root;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./_checkGlobal":27}],42:[function(require,module,exports){
var copyObjectWith = require('./_copyObjectWith'),
    createAssigner = require('./_createAssigner'),
    keysIn = require('./keysIn');

/**
 * This method is like `_.assignIn` except that it accepts `customizer` which
 * is invoked to produce the assigned values. If `customizer` returns `undefined`
 * assignment is handled by the method instead. The `customizer` is invoked
 * with five arguments: (objValue, srcValue, key, object, source).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @alias extendWith
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} sources The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @example
 *
 * function customizer(objValue, srcValue) {
 *   return _.isUndefined(objValue) ? srcValue : objValue;
 * }
 *
 * var defaults = _.partialRight(_.assignInWith, customizer);
 *
 * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
 * // => { 'a': 1, 'b': 2 }
 */
var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
  copyObjectWith(source, keysIn(source), object, customizer);
});

module.exports = assignInWith;

},{"./_copyObjectWith":28,"./_createAssigner":29,"./keysIn":58}],43:[function(require,module,exports){
var apply = require('./_apply'),
    isError = require('./isError'),
    rest = require('./rest');

/**
 * Attempts to invoke `func`, returning either the result or the caught error
 * object. Any additional arguments are provided to `func` when it's invoked.
 *
 * @static
 * @memberOf _
 * @category Util
 * @param {Function} func The function to attempt.
 * @returns {*} Returns the `func` result or error object.
 * @example
 *
 * // Avoid throwing errors for invalid selectors.
 * var elements = _.attempt(function(selector) {
 *   return document.querySelectorAll(selector);
 * }, '>_>');
 *
 * if (_.isError(elements)) {
 *   elements = [];
 * }
 */
var attempt = rest(function(func, args) {
  try {
    return apply(func, undefined, args);
  } catch (e) {
    return isError(e) ? e : new Error(e);
  }
});

module.exports = attempt;

},{"./_apply":17,"./isError":50,"./rest":59}],44:[function(require,module,exports){
/**
 * Performs a [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

module.exports = eq;

},{}],45:[function(require,module,exports){
var escapeHtmlChar = require('./_escapeHtmlChar'),
    toString = require('./toString');

/** Used to match HTML entities and HTML characters. */
var reUnescapedHtml = /[&<>"'`]/g,
    reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

/**
 * Converts the characters "&", "<", ">", '"', "'", and "\`" in `string` to
 * their corresponding HTML entities.
 *
 * **Note:** No other characters are escaped. To escape additional
 * characters use a third-party library like [_he_](https://mths.be/he).
 *
 * Though the ">" character is escaped for symmetry, characters like
 * ">" and "/" don't need escaping in HTML and have no special meaning
 * unless they're part of a tag or unquoted attribute value.
 * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
 * (under "semi-related fun fact") for more details.
 *
 * Backticks are escaped because in IE < 9, they can break out of
 * attribute values or HTML comments. See [#59](https://html5sec.org/#59),
 * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
 * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
 * for more details.
 *
 * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
 * to reduce XSS vectors.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escape('fred, barney, & pebbles');
 * // => 'fred, barney, &amp; pebbles'
 */
function escape(string) {
  string = toString(string);
  return (string && reHasUnescapedHtml.test(string))
    ? string.replace(reUnescapedHtml, escapeHtmlChar)
    : string;
}

module.exports = escape;

},{"./_escapeHtmlChar":30,"./toString":64}],46:[function(require,module,exports){
var isArrayLikeObject = require('./isArrayLikeObject');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 incorrectly makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

module.exports = isArguments;

},{"./isArrayLikeObject":49}],47:[function(require,module,exports){
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @type {Function}
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;

},{}],48:[function(require,module,exports){
var getLength = require('./_getLength'),
    isFunction = require('./isFunction'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value)) && !isFunction(value);
}

module.exports = isArrayLike;

},{"./_getLength":32,"./isFunction":51,"./isLength":52}],49:[function(require,module,exports){
var isArrayLike = require('./isArrayLike'),
    isObjectLike = require('./isObjectLike');

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object, else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

module.exports = isArrayLikeObject;

},{"./isArrayLike":48,"./isObjectLike":54}],50:[function(require,module,exports){
var isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var errorTag = '[object Error]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
 * `SyntaxError`, `TypeError`, or `URIError` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
 * @example
 *
 * _.isError(new Error);
 * // => true
 *
 * _.isError(Error);
 * // => false
 */
function isError(value) {
  if (!isObjectLike(value)) {
    return false;
  }
  return (objectToString.call(value) == errorTag) ||
    (typeof value.message == 'string' && typeof value.name == 'string');
}

module.exports = isError;

},{"./isObjectLike":54}],51:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8 which returns 'object' for typed array and weak map constructors,
  // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

module.exports = isFunction;

},{"./isObject":53}],52:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is loosely based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],53:[function(require,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],54:[function(require,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],55:[function(require,module,exports){
var isArray = require('./isArray'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' ||
    (!isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag);
}

module.exports = isString;

},{"./isArray":47,"./isObjectLike":54}],56:[function(require,module,exports){
var isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

module.exports = isSymbol;

},{"./isObjectLike":54}],57:[function(require,module,exports){
var baseHas = require('./_baseHas'),
    baseKeys = require('./_baseKeys'),
    indexKeys = require('./_indexKeys'),
    isArrayLike = require('./isArrayLike'),
    isIndex = require('./_isIndex'),
    isPrototype = require('./_isPrototype');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  var isProto = isPrototype(object);
  if (!(isProto || isArrayLike(object))) {
    return baseKeys(object);
  }
  var indexes = indexKeys(object),
      skipIndexes = !!indexes,
      result = indexes || [],
      length = result.length;

  for (var key in object) {
    if (baseHas(object, key) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length))) &&
        !(isProto && key == 'constructor')) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keys;

},{"./_baseHas":21,"./_baseKeys":22,"./_indexKeys":33,"./_isIndex":34,"./_isPrototype":36,"./isArrayLike":48}],58:[function(require,module,exports){
var baseKeysIn = require('./_baseKeysIn'),
    indexKeys = require('./_indexKeys'),
    isIndex = require('./_isIndex'),
    isPrototype = require('./_isPrototype');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  var index = -1,
      isProto = isPrototype(object),
      props = baseKeysIn(object),
      propsLength = props.length,
      indexes = indexKeys(object),
      skipIndexes = !!indexes,
      result = indexes || [],
      length = result.length;

  while (++index < propsLength) {
    var key = props[index];
    if (!(skipIndexes && (key == 'length' || isIndex(key, length))) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"./_baseKeysIn":23,"./_indexKeys":33,"./_isIndex":34,"./_isPrototype":36}],59:[function(require,module,exports){
var apply = require('./_apply'),
    toInteger = require('./toInteger');

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://mdn.io/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.rest(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function rest(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : toInteger(start), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, array);
      case 1: return func.call(this, args[0], array);
      case 2: return func.call(this, args[0], args[1], array);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

module.exports = rest;

},{"./_apply":17,"./toInteger":62}],60:[function(require,module,exports){
var assignInDefaults = require('./_assignInDefaults'),
    assignInWith = require('./assignInWith'),
    attempt = require('./attempt'),
    baseValues = require('./_baseValues'),
    escapeStringChar = require('./_escapeStringChar'),
    isError = require('./isError'),
    isIterateeCall = require('./_isIterateeCall'),
    keys = require('./keys'),
    reInterpolate = require('./_reInterpolate'),
    templateSettings = require('./templateSettings'),
    toString = require('./toString');

/** Used to match empty string literals in compiled template source. */
var reEmptyStringLeading = /\b__p \+= '';/g,
    reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
    reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

/** Used to match [ES template delimiters](http://ecma-international.org/ecma-262/6.0/#sec-template-literal-lexical-components). */
var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

/** Used to ensure capturing order of template delimiters. */
var reNoMatch = /($^)/;

/** Used to match unescaped characters in compiled string literals. */
var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

/**
 * Creates a compiled template function that can interpolate data properties
 * in "interpolate" delimiters, HTML-escape interpolated data properties in
 * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
 * properties may be accessed as free variables in the template. If a setting
 * object is given it takes precedence over `_.templateSettings` values.
 *
 * **Note:** In the development build `_.template` utilizes
 * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
 * for easier debugging.
 *
 * For more information on precompiling templates see
 * [lodash's custom builds documentation](https://lodash.com/custom-builds).
 *
 * For more information on Chrome extension sandboxes see
 * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The template string.
 * @param {Object} [options] The options object.
 * @param {RegExp} [options.escape] The HTML "escape" delimiter.
 * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
 * @param {Object} [options.imports] An object to import into the template as free variables.
 * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
 * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.
 * @param {string} [options.variable] The data object variable name.
 * @param- {Object} [guard] Enables use as an iteratee for functions like `_.map`.
 * @returns {Function} Returns the compiled template function.
 * @example
 *
 * // Use the "interpolate" delimiter to create a compiled template.
 * var compiled = _.template('hello <%= user %>!');
 * compiled({ 'user': 'fred' });
 * // => 'hello fred!'
 *
 * // Use the HTML "escape" delimiter to escape data property values.
 * var compiled = _.template('<b><%- value %></b>');
 * compiled({ 'value': '<script>' });
 * // => '<b>&lt;script&gt;</b>'
 *
 * // Use the "evaluate" delimiter to execute JavaScript and generate HTML.
 * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
 * compiled({ 'users': ['fred', 'barney'] });
 * // => '<li>fred</li><li>barney</li>'
 *
 * // Use the internal `print` function in "evaluate" delimiters.
 * var compiled = _.template('<% print("hello " + user); %>!');
 * compiled({ 'user': 'barney' });
 * // => 'hello barney!'
 *
 * // Use the ES delimiter as an alternative to the default "interpolate" delimiter.
 * var compiled = _.template('hello ${ user }!');
 * compiled({ 'user': 'pebbles' });
 * // => 'hello pebbles!'
 *
 * // Use custom template delimiters.
 * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
 * var compiled = _.template('hello {{ user }}!');
 * compiled({ 'user': 'mustache' });
 * // => 'hello mustache!'
 *
 * // Use backslashes to treat delimiters as plain text.
 * var compiled = _.template('<%= "\\<%- value %\\>" %>');
 * compiled({ 'value': 'ignored' });
 * // => '<%- value %>'
 *
 * // Use the `imports` option to import `jQuery` as `jq`.
 * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
 * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
 * compiled({ 'users': ['fred', 'barney'] });
 * // => '<li>fred</li><li>barney</li>'
 *
 * // Use the `sourceURL` option to specify a custom sourceURL for the template.
 * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
 * compiled(data);
 * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
 *
 * // Use the `variable` option to ensure a with-statement isn't used in the compiled template.
 * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
 * compiled.source;
 * // => function(data) {
 * //   var __t, __p = '';
 * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
 * //   return __p;
 * // }
 *
 * // Use the `source` property to inline compiled templates for meaningful
 * // line numbers in error messages and stack traces.
 * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
 *   var JST = {\
 *     "main": ' + _.template(mainText).source + '\
 *   };\
 * ');
 */
function template(string, options, guard) {
  // Based on John Resig's `tmpl` implementation (http://ejohn.org/blog/javascript-micro-templating/)
  // and Laura Doktorova's doT.js (https://github.com/olado/doT).
  var settings = templateSettings.imports._.templateSettings || templateSettings;

  if (guard && isIterateeCall(string, options, guard)) {
    options = undefined;
  }
  string = toString(string);
  options = assignInWith({}, options, settings, assignInDefaults);

  var imports = assignInWith({}, options.imports, settings.imports, assignInDefaults),
      importsKeys = keys(imports),
      importsValues = baseValues(imports, importsKeys);

  var isEscaping,
      isEvaluating,
      index = 0,
      interpolate = options.interpolate || reNoMatch,
      source = "__p += '";

  // Compile the regexp to match each delimiter.
  var reDelimiters = RegExp(
    (options.escape || reNoMatch).source + '|' +
    interpolate.source + '|' +
    (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
    (options.evaluate || reNoMatch).source + '|$'
  , 'g');

  // Use a sourceURL for easier debugging.
  var sourceURL = 'sourceURL' in options ? '//# sourceURL=' + options.sourceURL + '\n' : '';

  string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
    interpolateValue || (interpolateValue = esTemplateValue);

    // Escape characters that can't be included in string literals.
    source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

    // Replace delimiters with snippets.
    if (escapeValue) {
      isEscaping = true;
      source += "' +\n__e(" + escapeValue + ") +\n'";
    }
    if (evaluateValue) {
      isEvaluating = true;
      source += "';\n" + evaluateValue + ";\n__p += '";
    }
    if (interpolateValue) {
      source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
    }
    index = offset + match.length;

    // The JS engine embedded in Adobe products needs `match` returned in
    // order to produce the correct `offset` value.
    return match;
  });

  source += "';\n";

  // If `variable` is not specified wrap a with-statement around the generated
  // code to add the data object to the top of the scope chain.
  var variable = options.variable;
  if (!variable) {
    source = 'with (obj) {\n' + source + '\n}\n';
  }
  // Cleanup code by stripping empty strings.
  source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
    .replace(reEmptyStringMiddle, '$1')
    .replace(reEmptyStringTrailing, '$1;');

  // Frame code as the function body.
  source = 'function(' + (variable || 'obj') + ') {\n' +
    (variable
      ? ''
      : 'obj || (obj = {});\n'
    ) +
    "var __t, __p = ''" +
    (isEscaping
       ? ', __e = _.escape'
       : ''
    ) +
    (isEvaluating
      ? ', __j = Array.prototype.join;\n' +
        "function print() { __p += __j.call(arguments, '') }\n"
      : ';\n'
    ) +
    source +
    'return __p\n}';

  var result = attempt(function() {
    return Function(importsKeys, sourceURL + 'return ' + source)
      .apply(undefined, importsValues);
  });

  // Provide the compiled function's source by its `toString` method or
  // the `source` property as a convenience for inlining compiled templates.
  result.source = source;
  if (isError(result)) {
    throw result;
  }
  return result;
}

module.exports = template;

},{"./_assignInDefaults":19,"./_baseValues":26,"./_escapeStringChar":31,"./_isIterateeCall":35,"./_reInterpolate":40,"./assignInWith":42,"./attempt":43,"./isError":50,"./keys":57,"./templateSettings":61,"./toString":64}],61:[function(require,module,exports){
var escape = require('./escape'),
    reEscape = require('./_reEscape'),
    reEvaluate = require('./_reEvaluate'),
    reInterpolate = require('./_reInterpolate');

/**
 * By default, the template delimiters used by lodash are like those in
 * embedded Ruby (ERB). Change the following template settings to use
 * alternative delimiters.
 *
 * @static
 * @memberOf _
 * @type {Object}
 */
var templateSettings = {

  /**
   * Used to detect `data` property values to be HTML-escaped.
   *
   * @memberOf _.templateSettings
   * @type {RegExp}
   */
  'escape': reEscape,

  /**
   * Used to detect code to be evaluated.
   *
   * @memberOf _.templateSettings
   * @type {RegExp}
   */
  'evaluate': reEvaluate,

  /**
   * Used to detect `data` property values to inject.
   *
   * @memberOf _.templateSettings
   * @type {RegExp}
   */
  'interpolate': reInterpolate,

  /**
   * Used to reference the data object in the template text.
   *
   * @memberOf _.templateSettings
   * @type {string}
   */
  'variable': '',

  /**
   * Used to import variables into the compiled template.
   *
   * @memberOf _.templateSettings
   * @type {Object}
   */
  'imports': {

    /**
     * A reference to the `lodash` function.
     *
     * @memberOf _.templateSettings.imports
     * @type {Function}
     */
    '_': { 'escape': escape }
  }
};

module.exports = templateSettings;

},{"./_reEscape":38,"./_reEvaluate":39,"./_reInterpolate":40,"./escape":45}],62:[function(require,module,exports){
var toNumber = require('./toNumber');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to an integer.
 *
 * **Note:** This function is loosely based on [`ToInteger`](http://www.ecma-international.org/ecma-262/6.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3');
 * // => 3
 */
function toInteger(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  var remainder = value % 1;
  return value === value ? (remainder ? value - remainder : value) : 0;
}

module.exports = toInteger;

},{"./toNumber":63}],63:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObject = require('./isObject');

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3);
 * // => 3
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3');
 * // => 3
 */
function toNumber(value) {
  if (isObject(value)) {
    var other = isFunction(value.valueOf) ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;

},{"./isFunction":51,"./isObject":53}],64:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = toString;

},{"./_Symbol":16,"./isSymbol":56}],65:[function(require,module,exports){
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for (var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for (var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);

},{}],66:[function(require,module,exports){
'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0,
      s2 = ((adler >>> 16) & 0xffff) |0,
      n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


module.exports = adler32;

},{}],67:[function(require,module,exports){
module.exports = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};

},{}],68:[function(require,module,exports){
'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for (var n =0; n < 256; n++) {
    c = n;
    for (var k =0; k < 8; k++) {
      c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable,
      end = pos + len;

  crc = crc ^ (-1);

  for (var i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


module.exports = crc32;

},{}],69:[function(require,module,exports){
'use strict';

var utils   = require('../utils/common');
var trees   = require('./trees');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var msg   = require('./messages');

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}


function flush_block_only (s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  utils.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;

      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */

      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = (m >= _w_size ? m - _w_size : 0);
      } while (--n);

      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);

      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH-1]) & s.hash_mask;

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
    /* Fill the window as much as possible: */
    if (s.lookahead <= 1) {

      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }

      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

    s.strstart += s.lookahead;
    s.lookahead = 0;

    /* Emit a stored block if pending_buf will be full: */
    var max_start = s.block_start + max_block_size;

    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/


    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */
    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }

  s.insert = 0;

  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH-1)) ? s.strstart : MIN_MATCH-1);
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH-1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size-MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH-1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = trees._tr_tally(s, s.strstart - 1- s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length-1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH-1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH-1 ? s.strstart : MIN_MATCH-1;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
var Config = function (good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
};

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new utils.Buf16((2*D_CODES+1) * 2);
  this.bl_tree    = new utils.Buf16((2*BL_CODES+1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new utils.Buf16(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new utils.Buf16(2*L_CODES+1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new utils.Buf16(2*L_CODES+1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
    lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new utils.Buf8(s.w_size * 2);
  s.head = new utils.Buf16(s.hash_size);
  s.prev = new utils.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new utils.Buf8(s.pending_buf_size);

  s.d_buf = s.lit_bufsize >> 1;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
}


function deflate(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
    flush > Z_BLOCK || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
      (!strm.input && strm.avail_in !== 0) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

    if (s.wrap === 2) { // GZIP header
      strm.adler = 0;  //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) { // s->gzhead == Z_NULL
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      }
      else {
        put_byte(s, (s.gzhead.text ? 1 : 0) +
                    (s.gzhead.hcrc ? 2 : 0) +
                    (!s.gzhead.extra ? 0 : 4) +
                    (!s.gzhead.name ? 0 : 8) +
                    (!s.gzhead.comment ? 0 : 16)
                );
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    else // DEFLATE header
    {
      var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
      var level_flags = -1;

      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= (level_flags << 6);
      if (s.strstart !== 0) { header |= PRESET_DICT; }
      header += 31 - (header % 31);

      s.status = BUSY_STATE;
      putShortMSB(s, header);

      /* Save the adler32 of the preset dictionary: */
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */

      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    }
    else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    }
    else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    }
    else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    }
    else {
      s.status = BUSY_STATE;
    }
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH) {
    return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
      (s.strategy === Z_RLE ? deflate_rle(s, flush) :
        configuration_table[s.level].func(s, flush));

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      }
      else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

        trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH) { return Z_OK; }
  if (s.wrap <= 0) { return Z_STREAM_END; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK : Z_STREAM_END;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
    status !== EXTRA_STATE &&
    status !== NAME_STATE &&
    status !== COMMENT_STATE &&
    status !== HCRC_STATE &&
    status !== BUSY_STATE &&
    status !== FINISH_STATE
  ) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
}

/* =========================================================================
 * Copy the source state to the destination state
 */
//function deflateCopy(dest, source) {
//
//}

exports.deflateInit = deflateInit;
exports.deflateInit2 = deflateInit2;
exports.deflateReset = deflateReset;
exports.deflateResetKeep = deflateResetKeep;
exports.deflateSetHeader = deflateSetHeader;
exports.deflate = deflate;
exports.deflateEnd = deflateEnd;
exports.deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateSetDictionary = deflateSetDictionary;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/

},{"../utils/common":65,"./adler32":66,"./crc32":68,"./messages":73,"./trees":74}],70:[function(require,module,exports){
'use strict';

// See state defs from inflate.js
var BAD = 30;       /* got a data error -- remain here until reset */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
module.exports = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  // Use `s_window` instead `window`, avoid conflict with instrumentation tools
  var s_window;               /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break top;
                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = s_window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

},{}],71:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var inflate_fast = require('./inffast');
var inflate_table = require('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function ZSWAP32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
  this.work = new utils.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix, distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    var sym;

    lenfix = new utils.Buf32(512);
    distfix = new utils.Buf32(32);

    /* literal/length table */
    sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, {bits: 9});

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, {bits: 5});

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new utils.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    utils.arraySet(state.window,src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      utils.arraySet(state.window,src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


  if (!strm || !strm.state || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = false;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head) {
            len = state.head.extra_len - state.length;
            if (!state.head.extra) {
              // Use untyped array for more conveniend processing later
              state.head.extra = new Array(state.head.extra_len);
            }
            utils.arraySet(
              state.head.extra,
              input,
              next,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              copy,
              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
              len
            );
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
          }
          if (state.flags & 0x0200) {
            state.check = crc32(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.name_max*/)) {
            state.head.name += String.fromCharCode(len);
          }
        } while (len && copy < have);

        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.comm_max*/)) {
            state.head.comment += String.fromCharCode(len);
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = true;
      }
      strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = ZSWAP32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        utils.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      // We have separate tables & no pointers. 2 commented lines below not needed.
      //state.next = state.codes;
      //state.lencode = state.next;
      // Switch to use dynamic table
      state.lencode = state.lendyn;
      state.lenbits = 7;

      opts = {bits: state.lenbits};
      ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here_bits;
          bits -= here_bits;
          //---//
          state.lens[state.have++] = here_val;
        }
        else {
          if (here_val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here_bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here_val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here_bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here_bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lenbits = 9;

      opts = {bits: state.lenbits};
      ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.lenbits = opts.bits;
      // state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      //state.distcode.copy(state.codes);
      // Switch to use dynamic table
      state.distcode = state.distdyn;
      opts = {bits: state.distbits};
      ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.distbits = opts.bits;
      // state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inflate_fast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        here = state.lencode[hold & ((1 << state.lenbits) -1)];  /*BITS(state.lenbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if (here_bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here_op && (here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.lencode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      state.length = here_val;
      if (here_op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here_op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here_op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here_op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        here = state.distcode[hold & ((1 << state.distbits) -1)];/*BITS(state.distbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if ((here_bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.distcode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      if (here_op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here_val;
      state.extra = (here_op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          // Use '|' insdead of '+' to make sure that result is signed
          hold |= input[next++] << bits;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

        }
        _out = left;
        // NB: crc32 stored as signed 32-bit int, ZSWAP32 returns signed too
        if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
    ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
    return Z_STREAM_ERROR;
  }

  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK;
}


exports.inflateReset = inflateReset;
exports.inflateReset2 = inflateReset2;
exports.inflateResetKeep = inflateResetKeep;
exports.inflateInit = inflateInit;
exports.inflateInit2 = inflateInit2;
exports.inflate = inflate;
exports.inflateEnd = inflateEnd;
exports.inflateGetHeader = inflateGetHeader;
exports.inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSetDictionary = inflateSetDictionary;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/

},{"../utils/common":65,"./adler32":66,"./crc32":68,"./inffast":70,"./inftrees":72}],72:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

var MAXBITS = 15;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES = 0;
var LENS = 1;
var DISTS = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES) {
    base = extra = work;    /* dummy value--not used */
    end = 19;

  } else if (type === LENS) {
    base = lbase;
    base_index -= 257;
    extra = lext;
    extra_index -= 257;
    end = 256;

  } else {                    /* DISTS */
    base = dbase;
    extra = dext;
    end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS && used > ENOUGH_LENS) ||
    (type === DISTS && used > ENOUGH_DISTS)) {
    return 1;
  }

  var i=0;
  /* process all codes and make table entries */
  for (;;) {
    i++;
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base[base_index + work[sym]];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS && used > ENOUGH_LENS) ||
        (type === DISTS && used > ENOUGH_DISTS)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

},{"../utils/common":65}],73:[function(require,module,exports){
'use strict';

module.exports = {
  '2':    'need dictionary',     /* Z_NEED_DICT       2  */
  '1':    'stream end',          /* Z_STREAM_END      1  */
  '0':    '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};

},{}],74:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;

/*============================================================================*/


function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH    = 3;
var MAX_MATCH    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS      = 256;
/* number of literal bytes 0..255 */

var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES       = 30;
/* number of distance codes */

var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */

var MAX_BITS      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES+2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH-MIN_MATCH+1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


var StaticTreeDesc = function (static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
};


var static_l_desc;
var static_d_desc;
var static_bl_desc;


var TreeDesc = function(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
};



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c*2]/*.Code*/, tree[c*2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max]*2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max+1; h < HEAP_SIZE; h++) {
    n = s.heap[h];
    bits = tree[tree[n*2 +1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n*2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n-base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n*2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length-1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits+1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m*2 + 1]/*.Len*/ !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m*2 + 1]/*.Len*/)*tree[m*2]/*.Freq*/;
        tree[m*2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS+1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS; bits++) {
    next_code[bits] = code = (code + bl_count[bits-1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    var len = tree[n*2 + 1]/*.Len*/;
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n*2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES-1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1<<extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length-1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0 ; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1<<extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for (; code < D_CODES; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1<<(extra_dbits[code]-7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n*2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n*2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES+1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES; n++) {
    static_dtree[n*2 + 1]/*.Len*/ = 5;
    static_dtree[n*2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS+1, L_CODES, MAX_BITS);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
  static_bl_desc =new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES; n++) { s.bl_tree[n*2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK*2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n*2;
  var _m2 = m*2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j+1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
    do {
      dist = (s.pending_buf[s.d_buf + lx*2] << 8) | (s.pending_buf[s.d_buf + lx*2 + 1]);
      lc = s.pending_buf[s.l_buf + lx];
      lx++;

      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code+LITERALS+1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");

    } while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n*2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node*2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n*2 + 1]/*.Dad*/ = tree[m*2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code+1)*2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6*2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10*2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138*2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count-3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count-3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count-11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES-1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex]*2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3*(max_blindex+1) + 5+5+4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes-257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes-1,   5);
  send_bits(s, blcodes-4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank]*2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes-1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes-1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && (s.dyn_ltree[n*2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES<<1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len+3+7) >>> 3;
    static_lenb = (s.static_len+3+7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES<<1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES<<1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1, max_blindex+1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc*2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc]+LITERALS+1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize-1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

exports._tr_init  = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block  = _tr_flush_block;
exports._tr_tally = _tr_tally;
exports._tr_align = _tr_align;

},{"../utils/common":65}],75:[function(require,module,exports){
'use strict';


function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;

},{}],76:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn) {
  var args = new Array(arguments.length - 1);
  var i = 0;
  while (i < args.length) {
    args[i++] = arguments[i];
  }
  process.nextTick(function afterTick() {
    fn.apply(null, args);
  });
}

}).call(this,require('_process'))

},{"_process":77}],77:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],78:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":79,"./_stream_writable":81,"core-util-is":9,"inherits":12,"process-nextick-args":76}],79:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events');

/*<replacement>*/
var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = undefined;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

var Duplex;
function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

var Duplex;
function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended) return 0;

  if (state.objectMode) return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length) return state.buffer[0].length;else return state.length;
  }

  if (n <= 0) return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else {
      return state.length;
    }
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading) n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended) state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0) endReadable(this);

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      if (state.pipesCount === 1 && state.pipes[0] === dest && src.listenerCount('data') === 1 && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error) dest.on('error', onerror);else if (isArray(dest._events.error)) dest._events.error.unshift(onerror);else dest._events.error = [onerror, dest._events.error];

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var _i = 0; _i < len; _i++) {
      dests[_i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1) return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && !this._readableState.endEmitted) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0) return null;

  if (length === 0) ret = null;else if (objectMode) ret = list.shift();else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode) ret = list.join('');else if (list.length === 1) ret = list[0];else ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode) ret = '';else ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode) ret += buf.slice(0, cpy);else buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length) list[0] = buf.slice(cpy);else list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'))

},{"./_stream_duplex":78,"_process":77,"buffer":8,"core-util-is":9,"events":10,"inherits":12,"isarray":14,"process-nextick-args":76,"string_decoder/":83,"util":5}],80:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er) {
      done(stream, er);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er) {
  if (er) return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":78,"core-util-is":9,"inherits":12}],81:[function(require,module,exports){
(function (process){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

var Duplex;
function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // create the two objects needed to store the corked requests
  // they are not a linked list, as no new elements are inserted in there
  this.corkedRequestsFree = new CorkedRequest(this);
  this.corkedRequestsFree.next = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
  } catch (_) {}
})();

var Duplex;
function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;

  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) processNextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    state.corkedRequestsFree = holder.next;
    holder.next = null;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}
}).call(this,require('_process'))

},{"./_stream_duplex":78,"_process":77,"buffer":8,"core-util-is":9,"events":10,"inherits":12,"process-nextick-args":76,"util-deprecate":96}],82:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":80}],83:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":8}],84:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  var util = require('./util');

  /**
   * A data structure which is a combination of an array and a set. Adding a new
   * member is O(1), testing for membership is O(1), and finding the index of an
   * element is O(1). Removing elements from the set is not supported. Only
   * strings are supported for membership.
   */
  function ArraySet() {
    this._array = [];
    this._set = {};
  }

  /**
   * Static method for creating ArraySet instances from an existing array.
   */
  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
    var set = new ArraySet();
    for (var i = 0, len = aArray.length; i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  };

  /**
   * Return how many unique items are in this ArraySet. If duplicates have been
   * added, than those do not count towards the size.
   *
   * @returns Number
   */
  ArraySet.prototype.size = function ArraySet_size() {
    return Object.getOwnPropertyNames(this._set).length;
  };

  /**
   * Add the given string to this set.
   *
   * @param String aStr
   */
  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
    var sStr = util.toSetString(aStr);
    var isDuplicate = this._set.hasOwnProperty(sStr);
    var idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      this._set[sStr] = idx;
    }
  };

  /**
   * Is the given string a member of this set?
   *
   * @param String aStr
   */
  ArraySet.prototype.has = function ArraySet_has(aStr) {
    var sStr = util.toSetString(aStr);
    return this._set.hasOwnProperty(sStr);
  };

  /**
   * What is the index of the given string in the array?
   *
   * @param String aStr
   */
  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
    var sStr = util.toSetString(aStr);
    if (this._set.hasOwnProperty(sStr)) {
      return this._set[sStr];
    }
    throw new Error('"' + aStr + '" is not in the set.');
  };

  /**
   * What is the element at the given index?
   *
   * @param Number aIdx
   */
  ArraySet.prototype.at = function ArraySet_at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error('No element indexed by ' + aIdx);
  };

  /**
   * Returns the array representation of this set (which has the proper indices
   * indicated by indexOf). Note that this is a copy of the internal array used
   * for storing the members so that no one can mess with internal state.
   */
  ArraySet.prototype.toArray = function ArraySet_toArray() {
    return this._array.slice();
  };

  exports.ArraySet = ArraySet;
}

},{"./util":93}],85:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
{
  var base64 = require('./base64');

  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
  // length quantities we use in the source map spec, the first bit is the sign,
  // the next four bits are the actual value, and the 6th bit is the
  // continuation bit. The continuation bit tells us whether there are more
  // digits in this value following this digit.
  //
  //   Continuation
  //   |    Sign
  //   |    |
  //   V    V
  //   101011

  var VLQ_BASE_SHIFT = 5;

  // binary: 100000
  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

  // binary: 011111
  var VLQ_BASE_MASK = VLQ_BASE - 1;

  // binary: 100000
  var VLQ_CONTINUATION_BIT = VLQ_BASE;

  /**
   * Converts from a two-complement value to a value where the sign bit is
   * placed in the least significant bit.  For example, as decimals:
   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
   */
  function toVLQSigned(aValue) {
    return aValue < 0
      ? ((-aValue) << 1) + 1
      : (aValue << 1) + 0;
  }

  /**
   * Converts to a two-complement value from a value where the sign bit is
   * placed in the least significant bit.  For example, as decimals:
   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
   */
  function fromVLQSigned(aValue) {
    var isNegative = (aValue & 1) === 1;
    var shifted = aValue >> 1;
    return isNegative
      ? -shifted
      : shifted;
  }

  /**
   * Returns the base 64 VLQ encoded value.
   */
  exports.encode = function base64VLQ_encode(aValue) {
    var encoded = "";
    var digit;

    var vlq = toVLQSigned(aValue);

    do {
      digit = vlq & VLQ_BASE_MASK;
      vlq >>>= VLQ_BASE_SHIFT;
      if (vlq > 0) {
        // There are still more digits in this value, so we must make sure the
        // continuation bit is marked.
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += base64.encode(digit);
    } while (vlq > 0);

    return encoded;
  };

  /**
   * Decodes the next base 64 VLQ value from the given string and returns the
   * value and the rest of the string via the out parameter.
   */
  exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
    var strLen = aStr.length;
    var result = 0;
    var shift = 0;
    var continuation, digit;

    do {
      if (aIndex >= strLen) {
        throw new Error("Expected more digits in base 64 VLQ value.");
      }

      digit = base64.decode(aStr.charCodeAt(aIndex++));
      if (digit === -1) {
        throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
      }

      continuation = !!(digit & VLQ_CONTINUATION_BIT);
      digit &= VLQ_BASE_MASK;
      result = result + (digit << shift);
      shift += VLQ_BASE_SHIFT;
    } while (continuation);

    aOutParam.value = fromVLQSigned(result);
    aOutParam.rest = aIndex;
  };
}

},{"./base64":86}],86:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

  /**
   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
   */
  exports.encode = function (number) {
    if (0 <= number && number < intToCharMap.length) {
      return intToCharMap[number];
    }
    throw new TypeError("Must be between 0 and 63: " + number);
  };

  /**
   * Decode a single base 64 character code digit to an integer. Returns -1 on
   * failure.
   */
  exports.decode = function (charCode) {
    var bigA = 65;     // 'A'
    var bigZ = 90;     // 'Z'

    var littleA = 97;  // 'a'
    var littleZ = 122; // 'z'

    var zero = 48;     // '0'
    var nine = 57;     // '9'

    var plus = 43;     // '+'
    var slash = 47;    // '/'

    var littleOffset = 26;
    var numberOffset = 52;

    // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
    if (bigA <= charCode && charCode <= bigZ) {
      return (charCode - bigA);
    }

    // 26 - 51: abcdefghijklmnopqrstuvwxyz
    if (littleA <= charCode && charCode <= littleZ) {
      return (charCode - littleA + littleOffset);
    }

    // 52 - 61: 0123456789
    if (zero <= charCode && charCode <= nine) {
      return (charCode - zero + numberOffset);
    }

    // 62: +
    if (charCode == plus) {
      return 62;
    }

    // 63: /
    if (charCode == slash) {
      return 63;
    }

    // Invalid base64 digit.
    return -1;
  };
}

},{}],87:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  exports.GREATEST_LOWER_BOUND = 1;
  exports.LEAST_UPPER_BOUND = 2;

  /**
   * Recursive implementation of binary search.
   *
   * @param aLow Indices here and lower do not contain the needle.
   * @param aHigh Indices here and higher do not contain the needle.
   * @param aNeedle The element being searched for.
   * @param aHaystack The non-empty array being searched.
   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
   * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
   *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   */
  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
    // This function terminates when one of the following is true:
    //
    //   1. We find the exact element we are looking for.
    //
    //   2. We did not find the exact element, but we can return the index of
    //      the next-closest element.
    //
    //   3. We did not find the exact element, and there is no next-closest
    //      element than the one we are searching for, so we return -1.
    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
    var cmp = aCompare(aNeedle, aHaystack[mid], true);
    if (cmp === 0) {
      // Found the element we are looking for.
      return mid;
    }
    else if (cmp > 0) {
      // Our needle is greater than aHaystack[mid].
      if (aHigh - mid > 1) {
        // The element is in the upper half.
        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
      }

      // The exact needle element was not found in this haystack. Determine if
      // we are in termination case (3) or (2) and return the appropriate thing.
      if (aBias == exports.LEAST_UPPER_BOUND) {
        return aHigh < aHaystack.length ? aHigh : -1;
      } else {
        return mid;
      }
    }
    else {
      // Our needle is less than aHaystack[mid].
      if (mid - aLow > 1) {
        // The element is in the lower half.
        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
      }

      // we are in termination case (3) or (2) and return the appropriate thing.
      if (aBias == exports.LEAST_UPPER_BOUND) {
        return mid;
      } else {
        return aLow < 0 ? -1 : aLow;
      }
    }
  }

  /**
   * This is an implementation of binary search which will always try and return
   * the index of the closest element if there is no exact hit. This is because
   * mappings between original and generated line/col pairs are single points,
   * and there is an implicit region between each of them, so a miss just means
   * that you aren't on the very start of a region.
   *
   * @param aNeedle The element you are looking for.
   * @param aHaystack The array that is being searched.
   * @param aCompare A function which takes the needle and an element in the
   *     array and returns -1, 0, or 1 depending on whether the needle is less
   *     than, equal to, or greater than the element, respectively.
   * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
   *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
   */
  exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
    if (aHaystack.length === 0) {
      return -1;
    }

    var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                                aCompare, aBias || exports.GREATEST_LOWER_BOUND);
    if (index < 0) {
      return -1;
    }

    // We have found either the exact element, or the next-closest element than
    // the one we are searching for. However, there may be more than one such
    // element. Make sure we always return the smallest of these.
    while (index - 1 >= 0) {
      if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
        break;
      }
      --index;
    }

    return index;
  };
}

},{}],88:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  var util = require('./util');

  /**
   * Determine whether mappingB is after mappingA with respect to generated
   * position.
   */
  function generatedPositionAfter(mappingA, mappingB) {
    // Optimized for most common case
    var lineA = mappingA.generatedLine;
    var lineB = mappingB.generatedLine;
    var columnA = mappingA.generatedColumn;
    var columnB = mappingB.generatedColumn;
    return lineB > lineA || lineB == lineA && columnB >= columnA ||
           util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
  }

  /**
   * A data structure to provide a sorted view of accumulated mappings in a
   * performance conscious manner. It trades a neglibable overhead in general
   * case for a large speedup in case of mappings being added in order.
   */
  function MappingList() {
    this._array = [];
    this._sorted = true;
    // Serves as infimum
    this._last = {generatedLine: -1, generatedColumn: 0};
  }

  /**
   * Iterate through internal items. This method takes the same arguments that
   * `Array.prototype.forEach` takes.
   *
   * NOTE: The order of the mappings is NOT guaranteed.
   */
  MappingList.prototype.unsortedForEach =
    function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };

  /**
   * Add the given source mapping.
   *
   * @param Object aMapping
   */
  MappingList.prototype.add = function MappingList_add(aMapping) {
    if (generatedPositionAfter(this._last, aMapping)) {
      this._last = aMapping;
      this._array.push(aMapping);
    } else {
      this._sorted = false;
      this._array.push(aMapping);
    }
  };

  /**
   * Returns the flat, sorted array of mappings. The mappings are sorted by
   * generated position.
   *
   * WARNING: This method returns internal data without copying, for
   * performance. The return value must NOT be mutated, and should be treated as
   * an immutable borrow. If you want to take ownership, you must make your own
   * copy.
   */
  MappingList.prototype.toArray = function MappingList_toArray() {
    if (!this._sorted) {
      this._array.sort(util.compareByGeneratedPositionsInflated);
      this._sorted = true;
    }
    return this._array;
  };

  exports.MappingList = MappingList;
}

},{"./util":93}],89:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  // It turns out that some (most?) JavaScript engines don't self-host
  // `Array.prototype.sort`. This makes sense because C++ will likely remain
  // faster than JS when doing raw CPU-intensive sorting. However, when using a
  // custom comparator function, calling back and forth between the VM's C++ and
  // JIT'd JS is rather slow *and* loses JIT type information, resulting in
  // worse generated code for the comparator function than would be optimal. In
  // fact, when sorting with a comparator, these costs outweigh the benefits of
  // sorting in C++. By using our own JS-implemented Quick Sort (below), we get
  // a ~3500ms mean speed-up in `bench/bench.html`.

  /**
   * Swap the elements indexed by `x` and `y` in the array `ary`.
   *
   * @param {Array} ary
   *        The array.
   * @param {Number} x
   *        The index of the first item.
   * @param {Number} y
   *        The index of the second item.
   */
  function swap(ary, x, y) {
    var temp = ary[x];
    ary[x] = ary[y];
    ary[y] = temp;
  }

  /**
   * Returns a random integer within the range `low .. high` inclusive.
   *
   * @param {Number} low
   *        The lower bound on the range.
   * @param {Number} high
   *        The upper bound on the range.
   */
  function randomIntInRange(low, high) {
    return Math.round(low + (Math.random() * (high - low)));
  }

  /**
   * The Quick Sort algorithm.
   *
   * @param {Array} ary
   *        An array to sort.
   * @param {function} comparator
   *        Function to use to compare two items.
   * @param {Number} p
   *        Start index of the array
   * @param {Number} r
   *        End index of the array
   */
  function doQuickSort(ary, comparator, p, r) {
    // If our lower bound is less than our upper bound, we (1) partition the
    // array into two pieces and (2) recurse on each half. If it is not, this is
    // the empty array and our base case.

    if (p < r) {
      // (1) Partitioning.
      //
      // The partitioning chooses a pivot between `p` and `r` and moves all
      // elements that are less than or equal to the pivot to the before it, and
      // all the elements that are greater than it after it. The effect is that
      // once partition is done, the pivot is in the exact place it will be when
      // the array is put in sorted order, and it will not need to be moved
      // again. This runs in O(n) time.

      // Always choose a random pivot so that an input array which is reverse
      // sorted does not cause O(n^2) running time.
      var pivotIndex = randomIntInRange(p, r);
      var i = p - 1;

      swap(ary, pivotIndex, r);
      var pivot = ary[r];

      // Immediately after `j` is incremented in this loop, the following hold
      // true:
      //
      //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
      //
      //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
      for (var j = p; j < r; j++) {
        if (comparator(ary[j], pivot) <= 0) {
          i += 1;
          swap(ary, i, j);
        }
      }

      swap(ary, i + 1, j);
      var q = i + 1;

      // (2) Recurse on each half.

      doQuickSort(ary, comparator, p, q - 1);
      doQuickSort(ary, comparator, q + 1, r);
    }
  }

  /**
   * Sort the given array in-place with the given comparator function.
   *
   * @param {Array} ary
   *        An array to sort.
   * @param {function} comparator
   *        Function to use to compare two items.
   */
  exports.quickSort = function (ary, comparator) {
    doQuickSort(ary, comparator, 0, ary.length - 1);
  };
}

},{}],90:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  var util = require('./util');
  var binarySearch = require('./binary-search');
  var ArraySet = require('./array-set').ArraySet;
  var base64VLQ = require('./base64-vlq');
  var quickSort = require('./quick-sort').quickSort;

  function SourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    return sourceMap.sections != null
      ? new IndexedSourceMapConsumer(sourceMap)
      : new BasicSourceMapConsumer(sourceMap);
  }

  SourceMapConsumer.fromSourceMap = function(aSourceMap) {
    return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
  }

  /**
   * The version of the source mapping spec that we are consuming.
   */
  SourceMapConsumer.prototype._version = 3;

  // `__generatedMappings` and `__originalMappings` are arrays that hold the
  // parsed mapping coordinates from the source map's "mappings" attribute. They
  // are lazily instantiated, accessed via the `_generatedMappings` and
  // `_originalMappings` getters respectively, and we only parse the mappings
  // and create these arrays once queried for a source location. We jump through
  // these hoops because there can be many thousands of mappings, and parsing
  // them is expensive, so we only want to do it if we must.
  //
  // Each object in the arrays is of the form:
  //
  //     {
  //       generatedLine: The line number in the generated code,
  //       generatedColumn: The column number in the generated code,
  //       source: The path to the original source file that generated this
  //               chunk of code,
  //       originalLine: The line number in the original source that
  //                     corresponds to this chunk of generated code,
  //       originalColumn: The column number in the original source that
  //                       corresponds to this chunk of generated code,
  //       name: The name of the original symbol which generated this chunk of
  //             code.
  //     }
  //
  // All properties except for `generatedLine` and `generatedColumn` can be
  // `null`.
  //
  // `_generatedMappings` is ordered by the generated positions.
  //
  // `_originalMappings` is ordered by the original positions.

  SourceMapConsumer.prototype.__generatedMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
    get: function () {
      if (!this.__generatedMappings) {
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__generatedMappings;
    }
  });

  SourceMapConsumer.prototype.__originalMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
    get: function () {
      if (!this.__originalMappings) {
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__originalMappings;
    }
  });

  SourceMapConsumer.prototype._charIsMappingSeparator =
    function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
      var c = aStr.charAt(index);
      return c === ";" || c === ",";
    };

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  SourceMapConsumer.prototype._parseMappings =
    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      throw new Error("Subclasses must implement _parseMappings");
    };

  SourceMapConsumer.GENERATED_ORDER = 1;
  SourceMapConsumer.ORIGINAL_ORDER = 2;

  SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
  SourceMapConsumer.LEAST_UPPER_BOUND = 2;

  /**
   * Iterate over each mapping between an original source/line/column and a
   * generated line/column in this source map.
   *
   * @param Function aCallback
   *        The function that is called with each mapping.
   * @param Object aContext
   *        Optional. If specified, this object will be the value of `this` every
   *        time that `aCallback` is called.
   * @param aOrder
   *        Either `SourceMapConsumer.GENERATED_ORDER` or
   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
   *        iterate over the mappings sorted by the generated file's line/column
   *        order or the original's source/line/column order, respectively. Defaults to
   *        `SourceMapConsumer.GENERATED_ORDER`.
   */
  SourceMapConsumer.prototype.eachMapping =
    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

      var mappings;
      switch (order) {
      case SourceMapConsumer.GENERATED_ORDER:
        mappings = this._generatedMappings;
        break;
      case SourceMapConsumer.ORIGINAL_ORDER:
        mappings = this._originalMappings;
        break;
      default:
        throw new Error("Unknown order of iteration.");
      }

      var sourceRoot = this.sourceRoot;
      mappings.map(function (mapping) {
        var source = mapping.source === null ? null : this._sources.at(mapping.source);
        if (source != null && sourceRoot != null) {
          source = util.join(sourceRoot, source);
        }
        return {
          source: source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name === null ? null : this._names.at(mapping.name)
        };
      }, this).forEach(aCallback, context);
    };

  /**
   * Returns all generated line and column information for the original source,
   * line, and column provided. If no column is provided, returns all mappings
   * corresponding to a either the line we are searching for or the next
   * closest line that has any mappings. Otherwise, returns all mappings
   * corresponding to the given line and either the column we are searching for
   * or the next closest column that has any offsets.
   *
   * The only argument is an object with the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: Optional. the column number in the original source.
   *
   * and an array of objects is returned, each with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  SourceMapConsumer.prototype.allGeneratedPositionsFor =
    function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      var line = util.getArg(aArgs, 'line');

      // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
      // returns the index of the closest mapping less than the needle. By
      // setting needle.originalColumn to 0, we thus find the last mapping for
      // the given line, provided such a mapping exists.
      var needle = {
        source: util.getArg(aArgs, 'source'),
        originalLine: line,
        originalColumn: util.getArg(aArgs, 'column', 0)
      };

      if (this.sourceRoot != null) {
        needle.source = util.relative(this.sourceRoot, needle.source);
      }
      if (!this._sources.has(needle.source)) {
        return [];
      }
      needle.source = this._sources.indexOf(needle.source);

      var mappings = [];

      var index = this._findMapping(needle,
                                    this._originalMappings,
                                    "originalLine",
                                    "originalColumn",
                                    util.compareByOriginalPositions,
                                    binarySearch.LEAST_UPPER_BOUND);
      if (index >= 0) {
        var mapping = this._originalMappings[index];

        if (aArgs.column === undefined) {
          var originalLine = mapping.originalLine;

          // Iterate until either we run out of mappings, or we run into
          // a mapping for a different line than the one we found. Since
          // mappings are sorted, this is guaranteed to find all mappings for
          // the line we found.
          while (mapping && mapping.originalLine === originalLine) {
            mappings.push({
              line: util.getArg(mapping, 'generatedLine', null),
              column: util.getArg(mapping, 'generatedColumn', null),
              lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
            });

            mapping = this._originalMappings[++index];
          }
        } else {
          var originalColumn = mapping.originalColumn;

          // Iterate until either we run out of mappings, or we run into
          // a mapping for a different line than the one we were searching for.
          // Since mappings are sorted, this is guaranteed to find all mappings for
          // the line we are searching for.
          while (mapping &&
                 mapping.originalLine === line &&
                 mapping.originalColumn == originalColumn) {
            mappings.push({
              line: util.getArg(mapping, 'generatedLine', null),
              column: util.getArg(mapping, 'generatedColumn', null),
              lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
            });

            mapping = this._originalMappings[++index];
          }
        }
      }

      return mappings;
    };

  exports.SourceMapConsumer = SourceMapConsumer;

  /**
   * A BasicSourceMapConsumer instance represents a parsed source map which we can
   * query for information about the original file positions by giving it a file
   * position in the generated source.
   *
   * The only parameter is the raw source map (either as a JSON string, or
   * already parsed to an object). According to the spec, source maps have the
   * following attributes:
   *
   *   - version: Which version of the source map spec this map is following.
   *   - sources: An array of URLs to the original source files.
   *   - names: An array of identifiers which can be referrenced by individual mappings.
   *   - sourceRoot: Optional. The URL root from which all sources are relative.
   *   - sourcesContent: Optional. An array of contents of the original source files.
   *   - mappings: A string of base64 VLQs which contain the actual mappings.
   *   - file: Optional. The generated file this source map is associated with.
   *
   * Here is an example source map, taken from the source map spec[0]:
   *
   *     {
   *       version : 3,
   *       file: "out.js",
   *       sourceRoot : "",
   *       sources: ["foo.js", "bar.js"],
   *       names: ["src", "maps", "are", "fun"],
   *       mappings: "AA,AB;;ABCDE;"
   *     }
   *
   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
   */
  function BasicSourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    var version = util.getArg(sourceMap, 'version');
    var sources = util.getArg(sourceMap, 'sources');
    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
    // requires the array) to play nice here.
    var names = util.getArg(sourceMap, 'names', []);
    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
    var mappings = util.getArg(sourceMap, 'mappings');
    var file = util.getArg(sourceMap, 'file', null);

    // Once again, Sass deviates from the spec and supplies the version as a
    // string rather than a number, so we use loose equality checking here.
    if (version != this._version) {
      throw new Error('Unsupported version: ' + version);
    }

    sources = sources
      // Some source maps produce relative source paths like "./foo.js" instead of
      // "foo.js".  Normalize these first so that future comparisons will succeed.
      // See bugzil.la/1090768.
      .map(util.normalize)
      // Always ensure that absolute sources are internally stored relative to
      // the source root, if the source root is absolute. Not doing this would
      // be particularly problematic when the source root is a prefix of the
      // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
      .map(function (source) {
        return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
          ? util.relative(sourceRoot, source)
          : source;
      });

    // Pass `true` below to allow duplicate names and sources. While source maps
    // are intended to be compressed and deduplicated, the TypeScript compiler
    // sometimes generates source maps with duplicates in them. See Github issue
    // #72 and bugzil.la/889492.
    this._names = ArraySet.fromArray(names, true);
    this._sources = ArraySet.fromArray(sources, true);

    this.sourceRoot = sourceRoot;
    this.sourcesContent = sourcesContent;
    this._mappings = mappings;
    this.file = file;
  }

  BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
  BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

  /**
   * Create a BasicSourceMapConsumer from a SourceMapGenerator.
   *
   * @param SourceMapGenerator aSourceMap
   *        The source map that will be consumed.
   * @returns BasicSourceMapConsumer
   */
  BasicSourceMapConsumer.fromSourceMap =
    function SourceMapConsumer_fromSourceMap(aSourceMap) {
      var smc = Object.create(BasicSourceMapConsumer.prototype);

      var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                              smc.sourceRoot);
      smc.file = aSourceMap._file;

      // Because we are modifying the entries (by converting string sources and
      // names to indices into the sources and names ArraySets), we have to make
      // a copy of the entry or else bad things happen. Shared mutable state
      // strikes again! See github issue #191.

      var generatedMappings = aSourceMap._mappings.toArray().slice();
      var destGeneratedMappings = smc.__generatedMappings = [];
      var destOriginalMappings = smc.__originalMappings = [];

      for (var i = 0, length = generatedMappings.length; i < length; i++) {
        var srcMapping = generatedMappings[i];
        var destMapping = new Mapping;
        destMapping.generatedLine = srcMapping.generatedLine;
        destMapping.generatedColumn = srcMapping.generatedColumn;

        if (srcMapping.source) {
          destMapping.source = sources.indexOf(srcMapping.source);
          destMapping.originalLine = srcMapping.originalLine;
          destMapping.originalColumn = srcMapping.originalColumn;

          if (srcMapping.name) {
            destMapping.name = names.indexOf(srcMapping.name);
          }

          destOriginalMappings.push(destMapping);
        }

        destGeneratedMappings.push(destMapping);
      }

      quickSort(smc.__originalMappings, util.compareByOriginalPositions);

      return smc;
    };

  /**
   * The version of the source mapping spec that we are consuming.
   */
  BasicSourceMapConsumer.prototype._version = 3;

  /**
   * The list of original sources.
   */
  Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
    get: function () {
      return this._sources.toArray().map(function (s) {
        return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
      }, this);
    }
  });

  /**
   * Provide the JIT with a nice shape / hidden class.
   */
  function Mapping() {
    this.generatedLine = 0;
    this.generatedColumn = 0;
    this.source = null;
    this.originalLine = null;
    this.originalColumn = null;
    this.name = null;
  }

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  BasicSourceMapConsumer.prototype._parseMappings =
    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var length = aStr.length;
      var index = 0;
      var cachedSegments = {};
      var temp = {};
      var originalMappings = [];
      var generatedMappings = [];
      var mapping, str, segment, end, value;

      while (index < length) {
        if (aStr.charAt(index) === ';') {
          generatedLine++;
          index++;
          previousGeneratedColumn = 0;
        }
        else if (aStr.charAt(index) === ',') {
          index++;
        }
        else {
          mapping = new Mapping();
          mapping.generatedLine = generatedLine;

          // Because each offset is encoded relative to the previous one,
          // many segments often have the same encoding. We can exploit this
          // fact by caching the parsed variable length fields of each segment,
          // allowing us to avoid a second parse if we encounter the same
          // segment again.
          for (end = index; end < length; end++) {
            if (this._charIsMappingSeparator(aStr, end)) {
              break;
            }
          }
          str = aStr.slice(index, end);

          segment = cachedSegments[str];
          if (segment) {
            index += str.length;
          } else {
            segment = [];
            while (index < end) {
              base64VLQ.decode(aStr, index, temp);
              value = temp.value;
              index = temp.rest;
              segment.push(value);
            }

            if (segment.length === 2) {
              throw new Error('Found a source, but no line and column');
            }

            if (segment.length === 3) {
              throw new Error('Found a source and line, but no column');
            }

            cachedSegments[str] = segment;
          }

          // Generated column.
          mapping.generatedColumn = previousGeneratedColumn + segment[0];
          previousGeneratedColumn = mapping.generatedColumn;

          if (segment.length > 1) {
            // Original source.
            mapping.source = previousSource + segment[1];
            previousSource += segment[1];

            // Original line.
            mapping.originalLine = previousOriginalLine + segment[2];
            previousOriginalLine = mapping.originalLine;
            // Lines are stored 0-based
            mapping.originalLine += 1;

            // Original column.
            mapping.originalColumn = previousOriginalColumn + segment[3];
            previousOriginalColumn = mapping.originalColumn;

            if (segment.length > 4) {
              // Original name.
              mapping.name = previousName + segment[4];
              previousName += segment[4];
            }
          }

          generatedMappings.push(mapping);
          if (typeof mapping.originalLine === 'number') {
            originalMappings.push(mapping);
          }
        }
      }

      quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
      this.__generatedMappings = generatedMappings;

      quickSort(originalMappings, util.compareByOriginalPositions);
      this.__originalMappings = originalMappings;
    };

  /**
   * Find the mapping that best matches the hypothetical "needle" mapping that
   * we are searching for in the given "haystack" of mappings.
   */
  BasicSourceMapConsumer.prototype._findMapping =
    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                           aColumnName, aComparator, aBias) {
      // To return the position we are searching for, we must first find the
      // mapping for the given position and then return the opposite position it
      // points to. Because the mappings are sorted, we can use binary search to
      // find the best mapping.

      if (aNeedle[aLineName] <= 0) {
        throw new TypeError('Line must be greater than or equal to 1, got '
                            + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError('Column must be greater than or equal to 0, got '
                            + aNeedle[aColumnName]);
      }

      return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
    };

  /**
   * Compute the last column for each generated mapping. The last column is
   * inclusive.
   */
  BasicSourceMapConsumer.prototype.computeColumnSpans =
    function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];

        // Mappings do not contain a field for the last generated columnt. We
        // can come up with an optimistic estimate, however, by assuming that
        // mappings are contiguous (i.e. given two consecutive mappings, the
        // first mapping ends where the second one starts).
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];

          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }

        // The last mapping for each line spans the entire line.
        mapping.lastGeneratedColumn = Infinity;
      }
    };

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.
   *   - column: The column number in the generated source.
   *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
   *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.
   *   - column: The column number in the original source, or null.
   *   - name: The original identifier, or null.
   */
  BasicSourceMapConsumer.prototype.originalPositionFor =
    function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, 'line'),
        generatedColumn: util.getArg(aArgs, 'column')
      };

      var index = this._findMapping(
        needle,
        this._generatedMappings,
        "generatedLine",
        "generatedColumn",
        util.compareByGeneratedPositionsDeflated,
        util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
      );

      if (index >= 0) {
        var mapping = this._generatedMappings[index];

        if (mapping.generatedLine === needle.generatedLine) {
          var source = util.getArg(mapping, 'source', null);
          if (source !== null) {
            source = this._sources.at(source);
            if (this.sourceRoot != null) {
              source = util.join(this.sourceRoot, source);
            }
          }
          var name = util.getArg(mapping, 'name', null);
          if (name !== null) {
            name = this._names.at(name);
          }
          return {
            source: source,
            line: util.getArg(mapping, 'originalLine', null),
            column: util.getArg(mapping, 'originalColumn', null),
            name: name
          };
        }
      }

      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };

  /**
   * Return true if we have the source content for every source in the source
   * map, false otherwise.
   */
  BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
    function BasicSourceMapConsumer_hasContentsOfAllSources() {
      if (!this.sourcesContent) {
        return false;
      }
      return this.sourcesContent.length >= this._sources.size() &&
        !this.sourcesContent.some(function (sc) { return sc == null; });
    };

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * available.
   */
  BasicSourceMapConsumer.prototype.sourceContentFor =
    function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      if (!this.sourcesContent) {
        return null;
      }

      if (this.sourceRoot != null) {
        aSource = util.relative(this.sourceRoot, aSource);
      }

      if (this._sources.has(aSource)) {
        return this.sourcesContent[this._sources.indexOf(aSource)];
      }

      var url;
      if (this.sourceRoot != null
          && (url = util.urlParse(this.sourceRoot))) {
        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
        // many users. We can help them out when they expect file:// URIs to
        // behave like it would if they were running a local HTTP server. See
        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
        if (url.scheme == "file"
            && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
        }

        if ((!url.path || url.path == "/")
            && this._sources.has("/" + aSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
        }
      }

      // This function is used recursively from
      // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
      // don't want to throw if we can't find the source - we just want to
      // return null, so we provide a flag to exit gracefully.
      if (nullOnMissing) {
        return null;
      }
      else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    };

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: The column number in the original source.
   *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
   *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  BasicSourceMapConsumer.prototype.generatedPositionFor =
    function SourceMapConsumer_generatedPositionFor(aArgs) {
      var source = util.getArg(aArgs, 'source');
      if (this.sourceRoot != null) {
        source = util.relative(this.sourceRoot, source);
      }
      if (!this._sources.has(source)) {
        return {
          line: null,
          column: null,
          lastColumn: null
        };
      }
      source = this._sources.indexOf(source);

      var needle = {
        source: source,
        originalLine: util.getArg(aArgs, 'line'),
        originalColumn: util.getArg(aArgs, 'column')
      };

      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
      );

      if (index >= 0) {
        var mapping = this._originalMappings[index];

        if (mapping.source === needle.source) {
          return {
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          };
        }
      }

      return {
        line: null,
        column: null,
        lastColumn: null
      };
    };

  exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

  /**
   * An IndexedSourceMapConsumer instance represents a parsed source map which
   * we can query for information. It differs from BasicSourceMapConsumer in
   * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
   * input.
   *
   * The only parameter is a raw source map (either as a JSON string, or already
   * parsed to an object). According to the spec for indexed source maps, they
   * have the following attributes:
   *
   *   - version: Which version of the source map spec this map is following.
   *   - file: Optional. The generated file this source map is associated with.
   *   - sections: A list of section definitions.
   *
   * Each value under the "sections" field has two fields:
   *   - offset: The offset into the original specified at which this section
   *       begins to apply, defined as an object with a "line" and "column"
   *       field.
   *   - map: A source map definition. This source map could also be indexed,
   *       but doesn't have to be.
   *
   * Instead of the "map" field, it's also possible to have a "url" field
   * specifying a URL to retrieve a source map from, but that's currently
   * unsupported.
   *
   * Here's an example source map, taken from the source map spec[0], but
   * modified to omit a section which uses the "url" field.
   *
   *  {
   *    version : 3,
   *    file: "app.js",
   *    sections: [{
   *      offset: {line:100, column:10},
   *      map: {
   *        version : 3,
   *        file: "section.js",
   *        sources: ["foo.js", "bar.js"],
   *        names: ["src", "maps", "are", "fun"],
   *        mappings: "AAAA,E;;ABCDE;"
   *      }
   *    }],
   *  }
   *
   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
   */
  function IndexedSourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    var version = util.getArg(sourceMap, 'version');
    var sections = util.getArg(sourceMap, 'sections');

    if (version != this._version) {
      throw new Error('Unsupported version: ' + version);
    }

    this._sources = new ArraySet();
    this._names = new ArraySet();

    var lastOffset = {
      line: -1,
      column: 0
    };
    this._sections = sections.map(function (s) {
      if (s.url) {
        // The url field will require support for asynchronicity.
        // See https://github.com/mozilla/source-map/issues/16
        throw new Error('Support for url field in sections not implemented.');
      }
      var offset = util.getArg(s, 'offset');
      var offsetLine = util.getArg(offset, 'line');
      var offsetColumn = util.getArg(offset, 'column');

      if (offsetLine < lastOffset.line ||
          (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
        throw new Error('Section offsets must be ordered and non-overlapping.');
      }
      lastOffset = offset;

      return {
        generatedOffset: {
          // The offset fields are 0-based, but we use 1-based indices when
          // encoding/decoding from VLQ.
          generatedLine: offsetLine + 1,
          generatedColumn: offsetColumn + 1
        },
        consumer: new SourceMapConsumer(util.getArg(s, 'map'))
      }
    });
  }

  IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
  IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

  /**
   * The version of the source mapping spec that we are consuming.
   */
  IndexedSourceMapConsumer.prototype._version = 3;

  /**
   * The list of original sources.
   */
  Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
    get: function () {
      var sources = [];
      for (var i = 0; i < this._sections.length; i++) {
        for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
          sources.push(this._sections[i].consumer.sources[j]);
        }
      }
      return sources;
    }
  });

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.
   *   - column: The column number in the generated source.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.
   *   - column: The column number in the original source, or null.
   *   - name: The original identifier, or null.
   */
  IndexedSourceMapConsumer.prototype.originalPositionFor =
    function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, 'line'),
        generatedColumn: util.getArg(aArgs, 'column')
      };

      // Find the section containing the generated position we're trying to map
      // to an original position.
      var sectionIndex = binarySearch.search(needle, this._sections,
        function(needle, section) {
          var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
          if (cmp) {
            return cmp;
          }

          return (needle.generatedColumn -
                  section.generatedOffset.generatedColumn);
        });
      var section = this._sections[sectionIndex];

      if (!section) {
        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      }

      return section.consumer.originalPositionFor({
        line: needle.generatedLine -
          (section.generatedOffset.generatedLine - 1),
        column: needle.generatedColumn -
          (section.generatedOffset.generatedLine === needle.generatedLine
           ? section.generatedOffset.generatedColumn - 1
           : 0),
        bias: aArgs.bias
      });
    };

  /**
   * Return true if we have the source content for every source in the source
   * map, false otherwise.
   */
  IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
    function IndexedSourceMapConsumer_hasContentsOfAllSources() {
      return this._sections.every(function (s) {
        return s.consumer.hasContentsOfAllSources();
      });
    };

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * available.
   */
  IndexedSourceMapConsumer.prototype.sourceContentFor =
    function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];

        var content = section.consumer.sourceContentFor(aSource, true);
        if (content) {
          return content;
        }
      }
      if (nullOnMissing) {
        return null;
      }
      else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    };

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: The column number in the original source.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  IndexedSourceMapConsumer.prototype.generatedPositionFor =
    function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];

        // Only consider this section if the requested source is in the list of
        // sources of the consumer.
        if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
          continue;
        }
        var generatedPosition = section.consumer.generatedPositionFor(aArgs);
        if (generatedPosition) {
          var ret = {
            line: generatedPosition.line +
              (section.generatedOffset.generatedLine - 1),
            column: generatedPosition.column +
              (section.generatedOffset.generatedLine === generatedPosition.line
               ? section.generatedOffset.generatedColumn - 1
               : 0)
          };
          return ret;
        }
      }

      return {
        line: null,
        column: null
      };
    };

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  IndexedSourceMapConsumer.prototype._parseMappings =
    function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      this.__generatedMappings = [];
      this.__originalMappings = [];
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var sectionMappings = section.consumer._generatedMappings;
        for (var j = 0; j < sectionMappings.length; j++) {
          var mapping = sectionMappings[j];

          var source = section.consumer._sources.at(mapping.source);
          if (section.consumer.sourceRoot !== null) {
            source = util.join(section.consumer.sourceRoot, source);
          }
          this._sources.add(source);
          source = this._sources.indexOf(source);

          var name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);

          // The mappings coming from the consumer for the section have
          // generated positions relative to the start of the section, so we
          // need to offset them to be relative to the start of the concatenated
          // generated file.
          var adjustedMapping = {
            source: source,
            generatedLine: mapping.generatedLine +
              (section.generatedOffset.generatedLine - 1),
            generatedColumn: mapping.generatedColumn +
              (section.generatedOffset.generatedLine === mapping.generatedLine
              ? section.generatedOffset.generatedColumn - 1
              : 0),
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name: name
          };

          this.__generatedMappings.push(adjustedMapping);
          if (typeof adjustedMapping.originalLine === 'number') {
            this.__originalMappings.push(adjustedMapping);
          }
        }
      }

      quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
      quickSort(this.__originalMappings, util.compareByOriginalPositions);
    };

  exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
}

},{"./array-set":84,"./base64-vlq":85,"./binary-search":87,"./quick-sort":89,"./util":93}],91:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  var base64VLQ = require('./base64-vlq');
  var util = require('./util');
  var ArraySet = require('./array-set').ArraySet;
  var MappingList = require('./mapping-list').MappingList;

  /**
   * An instance of the SourceMapGenerator represents a source map which is
   * being built incrementally. You may pass an object with the following
   * properties:
   *
   *   - file: The filename of the generated source.
   *   - sourceRoot: A root for all relative URLs in this source map.
   */
  function SourceMapGenerator(aArgs) {
    if (!aArgs) {
      aArgs = {};
    }
    this._file = util.getArg(aArgs, 'file', null);
    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
    this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
    this._sources = new ArraySet();
    this._names = new ArraySet();
    this._mappings = new MappingList();
    this._sourcesContents = null;
  }

  SourceMapGenerator.prototype._version = 3;

  /**
   * Creates a new SourceMapGenerator based on a SourceMapConsumer
   *
   * @param aSourceMapConsumer The SourceMap.
   */
  SourceMapGenerator.fromSourceMap =
    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot: sourceRoot
      });
      aSourceMapConsumer.eachMapping(function (mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };

        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }

          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };

          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }

        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };

  /**
   * Add a single mapping from original source line and column to the generated
   * source's line and column for this source map being created. The mapping
   * object should have the following properties:
   *
   *   - generated: An object with the generated line and column positions.
   *   - original: An object with the original line and column positions.
   *   - source: The original source file (relative to the sourceRoot).
   *   - name: An optional original token name for this mapping.
   */
  SourceMapGenerator.prototype.addMapping =
    function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, 'generated');
      var original = util.getArg(aArgs, 'original', null);
      var source = util.getArg(aArgs, 'source', null);
      var name = util.getArg(aArgs, 'name', null);

      if (!this._skipValidation) {
        this._validateMapping(generated, original, source, name);
      }

      if (source != null && !this._sources.has(source)) {
        this._sources.add(source);
      }

      if (name != null && !this._names.has(name)) {
        this._names.add(name);
      }

      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source: source,
        name: name
      });
    };

  /**
   * Set the source content for a source file.
   */
  SourceMapGenerator.prototype.setSourceContent =
    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }

      if (aSourceContent != null) {
        // Add the source content to the _sourcesContents map.
        // Create a new _sourcesContents map if the property is null.
        if (!this._sourcesContents) {
          this._sourcesContents = {};
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        // Remove the source file from the _sourcesContents map.
        // If the _sourcesContents map is empty, set the property to null.
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };

  /**
   * Applies the mappings of a sub-source-map for a specific source file to the
   * source map being generated. Each mapping to the supplied source file is
   * rewritten using the supplied source map. Note: The resolution for the
   * resulting mappings is the minimium of this map and the supplied map.
   *
   * @param aSourceMapConsumer The source map to be applied.
   * @param aSourceFile Optional. The filename of the source file.
   *        If omitted, SourceMapConsumer's file property will be used.
   * @param aSourceMapPath Optional. The dirname of the path to the source map
   *        to be applied. If relative, it is relative to the SourceMapConsumer.
   *        This parameter is needed when the two source maps aren't in the same
   *        directory, and the source map to be applied contains relative source
   *        paths. If so, those relative source paths need to be rewritten
   *        relative to the SourceMapGenerator.
   */
  SourceMapGenerator.prototype.applySourceMap =
    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      // If aSourceFile is omitted, we will use the file property of the SourceMap
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
            'or the source map\'s "file" property. Both were omitted.'
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      // Make "sourceFile" relative if an absolute Url is passed.
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      // Applying the SourceMap can add and remove items from the sources and
      // the names array.
      var newSources = new ArraySet();
      var newNames = new ArraySet();

      // Find mappings for the "sourceFile"
      this._mappings.unsortedForEach(function (mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          // Check if it can be mapped by the source map, then update the mapping.
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            // Copy mapping
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source)
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }

        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }

        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }

      }, this);
      this._sources = newSources;
      this._names = newNames;

      // Copy sourcesContents of applied map.
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile = util.join(aSourceMapPath, sourceFile);
          }
          if (sourceRoot != null) {
            sourceFile = util.relative(sourceRoot, sourceFile);
          }
          this.setSourceContent(sourceFile, content);
        }
      }, this);
    };

  /**
   * A mapping can have one of the three levels of data:
   *
   *   1. Just the generated position.
   *   2. The Generated position, original position, and original source.
   *   3. Generated and original position, original source, as well as a name
   *      token.
   *
   * To maintain consistency, we validate that any new mapping being added falls
   * in to one of these categories.
   */
  SourceMapGenerator.prototype._validateMapping =
    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                                aName) {
      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
          && aGenerated.line > 0 && aGenerated.column >= 0
          && !aOriginal && !aSource && !aName) {
        // Case 1.
        return;
      }
      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
               && aGenerated.line > 0 && aGenerated.column >= 0
               && aOriginal.line > 0 && aOriginal.column >= 0
               && aSource) {
        // Cases 2 and 3.
        return;
      }
      else {
        throw new Error('Invalid mapping: ' + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        }));
      }
    };

  /**
   * Serialize the accumulated mappings in to the stream of base 64 VLQs
   * specified by the source map format.
   */
  SourceMapGenerator.prototype._serializeMappings =
    function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = '';
      var mapping;
      var nameIdx;
      var sourceIdx;

      var mappings = this._mappings.toArray();
      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];

        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            result += ';';
            previousGeneratedLine++;
          }
        }
        else {
          if (i > 0) {
            if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
              continue;
            }
            result += ',';
          }
        }

        result += base64VLQ.encode(mapping.generatedColumn
                                   - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;

        if (mapping.source != null) {
          sourceIdx = this._sources.indexOf(mapping.source);
          result += base64VLQ.encode(sourceIdx - previousSource);
          previousSource = sourceIdx;

          // lines are stored 0-based in SourceMap spec version 3
          result += base64VLQ.encode(mapping.originalLine - 1
                                     - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;

          result += base64VLQ.encode(mapping.originalColumn
                                     - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;

          if (mapping.name != null) {
            nameIdx = this._names.indexOf(mapping.name);
            result += base64VLQ.encode(nameIdx - previousName);
            previousName = nameIdx;
          }
        }
      }

      return result;
    };

  SourceMapGenerator.prototype._generateSourcesContent =
    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function (source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
                                                    key)
          ? this._sourcesContents[key]
          : null;
      }, this);
    };

  /**
   * Externalize the source map.
   */
  SourceMapGenerator.prototype.toJSON =
    function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }

      return map;
    };

  /**
   * Render the source map being generated to a string.
   */
  SourceMapGenerator.prototype.toString =
    function SourceMapGenerator_toString() {
      return JSON.stringify(this.toJSON());
    };

  exports.SourceMapGenerator = SourceMapGenerator;
}

},{"./array-set":84,"./base64-vlq":85,"./mapping-list":88,"./util":93}],92:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
  var util = require('./util');

  // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
  // operating systems these days (capturing the result).
  var REGEX_NEWLINE = /(\r?\n)/;

  // Newline character code for charCodeAt() comparisons
  var NEWLINE_CODE = 10;

  // Private symbol for identifying `SourceNode`s when multiple versions of
  // the source-map library are loaded. This MUST NOT CHANGE across
  // versions!
  var isSourceNode = "$$$isSourceNode$$$";

  /**
   * SourceNodes provide a way to abstract over interpolating/concatenating
   * snippets of generated JavaScript source code while maintaining the line and
   * column information associated with the original source code.
   *
   * @param aLine The original line number.
   * @param aColumn The original column number.
   * @param aSource The original source's filename.
   * @param aChunks Optional. An array of strings which are snippets of
   *        generated JS, or other SourceNodes.
   * @param aName The original identifier.
   */
  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine == null ? null : aLine;
    this.column = aColumn == null ? null : aColumn;
    this.source = aSource == null ? null : aSource;
    this.name = aName == null ? null : aName;
    this[isSourceNode] = true;
    if (aChunks != null) this.add(aChunks);
  }

  /**
   * Creates a SourceNode from generated code and a SourceMapConsumer.
   *
   * @param aGeneratedCode The generated code
   * @param aSourceMapConsumer The SourceMap for the generated code
   * @param aRelativePath Optional. The path that relative sources in the
   *        SourceMapConsumer should be relative to.
   */
  SourceNode.fromStringWithSourceMap =
    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      // The SourceNode we want to fill with the generated code
      // and the SourceMap
      var node = new SourceNode();

      // All even indices of this array are one line of the generated code,
      // while all odd indices are the newlines between two adjacent lines
      // (since `REGEX_NEWLINE` captures its match).
      // Processed fragments are removed from this array, by calling `shiftNextLine`.
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var shiftNextLine = function() {
        var lineContents = remainingLines.shift();
        // The last line of a file might not have a newline.
        var newLine = remainingLines.shift() || "";
        return lineContents + newLine;
      };

      // We need to remember the position of "remainingLines"
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;

      // The generate SourceNodes we need a code range.
      // To extract it current and last mapping is used.
      // Here we store the last mapping.
      var lastMapping = null;

      aSourceMapConsumer.eachMapping(function (mapping) {
        if (lastMapping !== null) {
          // We add the code from "lastMapping" to "mapping":
          // First check if there is a new line in between.
          if (lastGeneratedLine < mapping.generatedLine) {
            // Associate first line with "lastMapping"
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
            // The remaining code is added without mapping
          } else {
            // There is no new line in between.
            // Associate the code between "lastGeneratedColumn" and
            // "mapping.generatedColumn" with "lastMapping"
            var nextLine = remainingLines[0];
            var code = nextLine.substr(0, mapping.generatedColumn -
                                          lastGeneratedColumn);
            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
                                                lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            // No more remaining code, continue
            lastMapping = mapping;
            return;
          }
        }
        // We add the generated code until the first mapping
        // to the SourceNode without any mapping.
        // Each line is added as separate string.
        while (lastGeneratedLine < mapping.generatedLine) {
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[0];
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      // We have processed all mappings.
      if (remainingLines.length > 0) {
        if (lastMapping) {
          // Associate the remaining code in the current line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        // and add the remaining lines without any mapping
        node.add(remainingLines.join(""));
      }

      // Copy sourcesContent into SourceNode
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });

      return node;

      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === undefined) {
          node.add(code);
        } else {
          var source = aRelativePath
            ? util.join(aRelativePath, mapping.source)
            : mapping.source;
          node.add(new SourceNode(mapping.originalLine,
                                  mapping.originalColumn,
                                  source,
                                  code,
                                  mapping.name));
        }
      }
    };

  /**
   * Add a chunk of generated JS to this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.add = function SourceNode_add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function (chunk) {
        this.add(chunk);
      }, this);
    }
    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Add a chunk of generated JS to the beginning of this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (var i = aChunk.length-1; i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    }
    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Walk over the tree of JS snippets in this node and its children. The
   * walking function is called once for each snippet of JS and is passed that
   * snippet and the its original associated source's line/column location.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
    var chunk;
    for (var i = 0, len = this.children.length; i < len; i++) {
      chunk = this.children[i];
      if (chunk[isSourceNode]) {
        chunk.walk(aFn);
      }
      else {
        if (chunk !== '') {
          aFn(chunk, { source: this.source,
                       line: this.line,
                       column: this.column,
                       name: this.name });
        }
      }
    }
  };

  /**
   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
   * each of `this.children`.
   *
   * @param aSep The separator.
   */
  SourceNode.prototype.join = function SourceNode_join(aSep) {
    var newChildren;
    var i;
    var len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0; i < len-1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  };

  /**
   * Call String.prototype.replace on the very right-most source snippet. Useful
   * for trimming whitespace from the end of a source node, etc.
   *
   * @param aPattern The pattern to replace.
   * @param aReplacement The thing to replace the pattern with.
   */
  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
    var lastChild = this.children[this.children.length - 1];
    if (lastChild[isSourceNode]) {
      lastChild.replaceRight(aPattern, aReplacement);
    }
    else if (typeof lastChild === 'string') {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    }
    else {
      this.children.push(''.replace(aPattern, aReplacement));
    }
    return this;
  };

  /**
   * Set the source content for a source file. This will be added to the SourceMapGenerator
   * in the sourcesContent field.
   *
   * @param aSourceFile The filename of the source file
   * @param aSourceContent The content of the source file
   */
  SourceNode.prototype.setSourceContent =
    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };

  /**
   * Walk over the tree of SourceNodes. The walking function is called for each
   * source file content and is passed the filename and source content.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walkSourceContents =
    function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }

      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };

  /**
   * Return the string representation of this source node. Walks over the tree
   * and concatenates all the various snippets together to one string.
   */
  SourceNode.prototype.toString = function SourceNode_toString() {
    var str = "";
    this.walk(function (chunk) {
      str += chunk;
    });
    return str;
  };

  /**
   * Returns the string representation of this source node along with a source
   * map.
   */
  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
    var generated = {
      code: "",
      line: 1,
      column: 0
    };
    var map = new SourceMapGenerator(aArgs);
    var sourceMappingActive = false;
    var lastOriginalSource = null;
    var lastOriginalLine = null;
    var lastOriginalColumn = null;
    var lastOriginalName = null;
    this.walk(function (chunk, original) {
      generated.code += chunk;
      if (original.source !== null
          && original.line !== null
          && original.column !== null) {
        if(lastOriginalSource !== original.source
           || lastOriginalLine !== original.line
           || lastOriginalColumn !== original.column
           || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      for (var idx = 0, length = chunk.length; idx < length; idx++) {
        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
          generated.line++;
          generated.column = 0;
          // Mappings end at eol
          if (idx + 1 === length) {
            lastOriginalSource = null;
            sourceMappingActive = false;
          } else if (sourceMappingActive) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
        } else {
          generated.column++;
        }
      }
    });
    this.walkSourceContents(function (sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });

    return { code: generated.code, map: map };
  };

  exports.SourceNode = SourceNode;
}

},{"./source-map-generator":91,"./util":93}],93:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
{
  /**
   * This is a helper function for getting values from parameter/options
   * objects.
   *
   * @param args The object we are extracting values from
   * @param name The name of the property we are getting.
   * @param defaultValue An optional value to return if the property is missing
   * from the object. If this is not specified and the property is missing, an
   * error will be thrown.
   */
  function getArg(aArgs, aName, aDefaultValue) {
    if (aName in aArgs) {
      return aArgs[aName];
    } else if (arguments.length === 3) {
      return aDefaultValue;
    } else {
      throw new Error('"' + aName + '" is a required argument.');
    }
  }
  exports.getArg = getArg;

  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
  var dataUrlRegexp = /^data:.+\,.+$/;

  function urlParse(aUrl) {
    var match = aUrl.match(urlRegexp);
    if (!match) {
      return null;
    }
    return {
      scheme: match[1],
      auth: match[2],
      host: match[3],
      port: match[4],
      path: match[5]
    };
  }
  exports.urlParse = urlParse;

  function urlGenerate(aParsedUrl) {
    var url = '';
    if (aParsedUrl.scheme) {
      url += aParsedUrl.scheme + ':';
    }
    url += '//';
    if (aParsedUrl.auth) {
      url += aParsedUrl.auth + '@';
    }
    if (aParsedUrl.host) {
      url += aParsedUrl.host;
    }
    if (aParsedUrl.port) {
      url += ":" + aParsedUrl.port
    }
    if (aParsedUrl.path) {
      url += aParsedUrl.path;
    }
    return url;
  }
  exports.urlGenerate = urlGenerate;

  /**
   * Normalizes a path, or the path portion of a URL:
   *
   * - Replaces consequtive slashes with one slash.
   * - Removes unnecessary '.' parts.
   * - Removes unnecessary '<dir>/..' parts.
   *
   * Based on code in the Node.js 'path' core module.
   *
   * @param aPath The path or url to normalize.
   */
  function normalize(aPath) {
    var path = aPath;
    var url = urlParse(aPath);
    if (url) {
      if (!url.path) {
        return aPath;
      }
      path = url.path;
    }
    var isAbsolute = exports.isAbsolute(path);

    var parts = path.split(/\/+/);
    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
      part = parts[i];
      if (part === '.') {
        parts.splice(i, 1);
      } else if (part === '..') {
        up++;
      } else if (up > 0) {
        if (part === '') {
          // The first part is blank if the path is absolute. Trying to go
          // above the root is a no-op. Therefore we can remove all '..' parts
          // directly after the root.
          parts.splice(i + 1, up);
          up = 0;
        } else {
          parts.splice(i, 2);
          up--;
        }
      }
    }
    path = parts.join('/');

    if (path === '') {
      path = isAbsolute ? '/' : '.';
    }

    if (url) {
      url.path = path;
      return urlGenerate(url);
    }
    return path;
  }
  exports.normalize = normalize;

  /**
   * Joins two paths/URLs.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be joined with the root.
   *
   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
   *   first.
   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
   *   is updated with the result and aRoot is returned. Otherwise the result
   *   is returned.
   *   - If aPath is absolute, the result is aPath.
   *   - Otherwise the two paths are joined with a slash.
   * - Joining for example 'http://' and 'www.example.com' is also supported.
   */
  function join(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }
    if (aPath === "") {
      aPath = ".";
    }
    var aPathUrl = urlParse(aPath);
    var aRootUrl = urlParse(aRoot);
    if (aRootUrl) {
      aRoot = aRootUrl.path || '/';
    }

    // `join(foo, '//www.example.org')`
    if (aPathUrl && !aPathUrl.scheme) {
      if (aRootUrl) {
        aPathUrl.scheme = aRootUrl.scheme;
      }
      return urlGenerate(aPathUrl);
    }

    if (aPathUrl || aPath.match(dataUrlRegexp)) {
      return aPath;
    }

    // `join('http://', 'www.example.com')`
    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
      aRootUrl.host = aPath;
      return urlGenerate(aRootUrl);
    }

    var joined = aPath.charAt(0) === '/'
      ? aPath
      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

    if (aRootUrl) {
      aRootUrl.path = joined;
      return urlGenerate(aRootUrl);
    }
    return joined;
  }
  exports.join = join;

  exports.isAbsolute = function (aPath) {
    return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
  };

  /**
   * Make a path relative to a URL or another path.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be made relative to aRoot.
   */
  function relative(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }

    aRoot = aRoot.replace(/\/$/, '');

    // It is possible for the path to be above the root. In this case, simply
    // checking whether the root is a prefix of the path won't work. Instead, we
    // need to remove components from the root one by one, until either we find
    // a prefix that fits, or we run out of components to remove.
    var level = 0;
    while (aPath.indexOf(aRoot + '/') !== 0) {
      var index = aRoot.lastIndexOf("/");
      if (index < 0) {
        return aPath;
      }

      // If the only part of the root that is left is the scheme (i.e. http://,
      // file:///, etc.), one or more slashes (/), or simply nothing at all, we
      // have exhausted all components, so the path is not relative to the root.
      aRoot = aRoot.slice(0, index);
      if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
        return aPath;
      }

      ++level;
    }

    // Make sure we add a "../" for each component we removed from the root.
    return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
  }
  exports.relative = relative;

  /**
   * Because behavior goes wacky when you set `__proto__` on objects, we
   * have to prefix all the strings in our set with an arbitrary character.
   *
   * See https://github.com/mozilla/source-map/pull/31 and
   * https://github.com/mozilla/source-map/issues/30
   *
   * @param String aStr
   */
  function toSetString(aStr) {
    return '$' + aStr;
  }
  exports.toSetString = toSetString;

  function fromSetString(aStr) {
    return aStr.substr(1);
  }
  exports.fromSetString = fromSetString;

  /**
   * Comparator between two mappings where the original positions are compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same original source/line/column, but different generated
   * line and column the same. Useful when searching for a mapping with a
   * stubbed out mapping.
   */
  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
    var cmp = mappingA.source - mappingB.source;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0 || onlyCompareOriginal) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }

    return mappingA.name - mappingB.name;
  }
  exports.compareByOriginalPositions = compareByOriginalPositions;

  /**
   * Comparator between two mappings with deflated source and name indices where
   * the generated positions are compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same generated line and column, but different
   * source/name/original line and column the same. Useful when searching for a
   * mapping with a stubbed out mapping.
   */
  function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0 || onlyCompareGenerated) {
      return cmp;
    }

    cmp = mappingA.source - mappingB.source;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0) {
      return cmp;
    }

    return mappingA.name - mappingB.name;
  }
  exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

  function strcmp(aStr1, aStr2) {
    if (aStr1 === aStr2) {
      return 0;
    }

    if (aStr1 > aStr2) {
      return 1;
    }

    return -1;
  }

  /**
   * Comparator between two mappings with inflated source and name strings where
   * the generated positions are compared.
   */
  function compareByGeneratedPositionsInflated(mappingA, mappingB) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0) {
      return cmp;
    }

    return strcmp(mappingA.name, mappingB.name);
  }
  exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
}

},{}],94:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./lib/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./lib/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./lib/source-node').SourceNode;

},{"./lib/source-map-consumer":90,"./lib/source-map-generator":91,"./lib/source-node":92}],95:[function(require,module,exports){
var sys = require("util");
var MOZ_SourceMap = require("source-map");
var UglifyJS = exports;
/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

function array_to_hash(a) {
    var ret = Object.create(null);
    for (var i = 0; i < a.length; ++i)
        ret[a[i]] = true;
    return ret;
};

function slice(a, start) {
    return Array.prototype.slice.call(a, start || 0);
};

function characters(str) {
    return str.split("");
};

function member(name, array) {
    for (var i = array.length; --i >= 0;)
        if (array[i] == name)
            return true;
    return false;
};

function find_if(func, array) {
    for (var i = 0, n = array.length; i < n; ++i) {
        if (func(array[i]))
            return array[i];
    }
};

function repeat_string(str, i) {
    if (i <= 0) return "";
    if (i == 1) return str;
    var d = repeat_string(str, i >> 1);
    d += d;
    if (i & 1) d += str;
    return d;
};

function DefaultsError(msg, defs) {
    Error.call(this, msg);
    this.msg = msg;
    this.defs = defs;
};
DefaultsError.prototype = Object.create(Error.prototype);
DefaultsError.prototype.constructor = DefaultsError;

DefaultsError.croak = function(msg, defs) {
    throw new DefaultsError(msg, defs);
};

function defaults(args, defs, croak) {
    if (args === true)
        args = {};
    var ret = args || {};
    if (croak) for (var i in ret) if (ret.hasOwnProperty(i) && !defs.hasOwnProperty(i))
        DefaultsError.croak("`" + i + "` is not a supported option", defs);
    for (var i in defs) if (defs.hasOwnProperty(i)) {
        ret[i] = (args && args.hasOwnProperty(i)) ? args[i] : defs[i];
    }
    return ret;
};

function merge(obj, ext) {
    var count = 0;
    for (var i in ext) if (ext.hasOwnProperty(i)) {
        obj[i] = ext[i];
        count++;
    }
    return count;
};

function noop() {};

var MAP = (function(){
    function MAP(a, f, backwards) {
        var ret = [], top = [], i;
        function doit() {
            var val = f(a[i], i);
            var is_last = val instanceof Last;
            if (is_last) val = val.v;
            if (val instanceof AtTop) {
                val = val.v;
                if (val instanceof Splice) {
                    top.push.apply(top, backwards ? val.v.slice().reverse() : val.v);
                } else {
                    top.push(val);
                }
            }
            else if (val !== skip) {
                if (val instanceof Splice) {
                    ret.push.apply(ret, backwards ? val.v.slice().reverse() : val.v);
                } else {
                    ret.push(val);
                }
            }
            return is_last;
        };
        if (a instanceof Array) {
            if (backwards) {
                for (i = a.length; --i >= 0;) if (doit()) break;
                ret.reverse();
                top.reverse();
            } else {
                for (i = 0; i < a.length; ++i) if (doit()) break;
            }
        }
        else {
            for (i in a) if (a.hasOwnProperty(i)) if (doit()) break;
        }
        return top.concat(ret);
    };
    MAP.at_top = function(val) { return new AtTop(val) };
    MAP.splice = function(val) { return new Splice(val) };
    MAP.last = function(val) { return new Last(val) };
    var skip = MAP.skip = {};
    function AtTop(val) { this.v = val };
    function Splice(val) { this.v = val };
    function Last(val) { this.v = val };
    return MAP;
})();

function push_uniq(array, el) {
    if (array.indexOf(el) < 0)
        array.push(el);
};

function string_template(text, props) {
    return text.replace(/\{(.+?)\}/g, function(str, p){
        return props[p];
    });
};

function remove(array, el) {
    for (var i = array.length; --i >= 0;) {
        if (array[i] === el) array.splice(i, 1);
    }
};

function mergeSort(array, cmp) {
    if (array.length < 2) return array.slice();
    function merge(a, b) {
        var r = [], ai = 0, bi = 0, i = 0;
        while (ai < a.length && bi < b.length) {
            cmp(a[ai], b[bi]) <= 0
                ? r[i++] = a[ai++]
                : r[i++] = b[bi++];
        }
        if (ai < a.length) r.push.apply(r, a.slice(ai));
        if (bi < b.length) r.push.apply(r, b.slice(bi));
        return r;
    };
    function _ms(a) {
        if (a.length <= 1)
            return a;
        var m = Math.floor(a.length / 2), left = a.slice(0, m), right = a.slice(m);
        left = _ms(left);
        right = _ms(right);
        return merge(left, right);
    };
    return _ms(array);
};

function set_difference(a, b) {
    return a.filter(function(el){
        return b.indexOf(el) < 0;
    });
};

function set_intersection(a, b) {
    return a.filter(function(el){
        return b.indexOf(el) >= 0;
    });
};

// this function is taken from Acorn [1], written by Marijn Haverbeke
// [1] https://github.com/marijnh/acorn
function makePredicate(words) {
    if (!(words instanceof Array)) words = words.split(" ");
    var f = "", cats = [];
    out: for (var i = 0; i < words.length; ++i) {
        for (var j = 0; j < cats.length; ++j)
            if (cats[j][0].length == words[i].length) {
                cats[j].push(words[i]);
                continue out;
            }
        cats.push([words[i]]);
    }
    function compareTo(arr) {
        if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
        f += "switch(str){";
        for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
        f += "return true}return false;";
    }
    // When there are more than three length categories, an outer
    // switch first dispatches on the lengths, to save on comparisons.
    if (cats.length > 3) {
        cats.sort(function(a, b) {return b.length - a.length;});
        f += "switch(str.length){";
        for (var i = 0; i < cats.length; ++i) {
            var cat = cats[i];
            f += "case " + cat[0].length + ":";
            compareTo(cat);
        }
        f += "}";
        // Otherwise, simply generate a flat `switch` statement.
    } else {
        compareTo(words);
    }
    return new Function("str", f);
};

function all(array, predicate) {
    for (var i = array.length; --i >= 0;)
        if (!predicate(array[i]))
            return false;
    return true;
};

function Dictionary() {
    this._values = Object.create(null);
    this._size = 0;
};
Dictionary.prototype = {
    set: function(key, val) {
        if (!this.has(key)) ++this._size;
        this._values["$" + key] = val;
        return this;
    },
    add: function(key, val) {
        if (this.has(key)) {
            this.get(key).push(val);
        } else {
            this.set(key, [ val ]);
        }
        return this;
    },
    get: function(key) { return this._values["$" + key] },
    del: function(key) {
        if (this.has(key)) {
            --this._size;
            delete this._values["$" + key];
        }
        return this;
    },
    has: function(key) { return ("$" + key) in this._values },
    each: function(f) {
        for (var i in this._values)
            f(this._values[i], i.substr(1));
    },
    size: function() {
        return this._size;
    },
    map: function(f) {
        var ret = [];
        for (var i in this._values)
            ret.push(f(this._values[i], i.substr(1)));
        return ret;
    },
    toObject: function() { return this._values }
};
Dictionary.fromObject = function(obj) {
    var dict = new Dictionary();
    dict._size = merge(dict._values, obj);
    return dict;
};

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

function DEFNODE(type, props, methods, base) {
    if (arguments.length < 4) base = AST_Node;
    if (!props) props = [];
    else props = props.split(/\s+/);
    var self_props = props;
    if (base && base.PROPS)
        props = props.concat(base.PROPS);
    var code = "return function AST_" + type + "(props){ if (props) { ";
    for (var i = props.length; --i >= 0;) {
        code += "this." + props[i] + " = props." + props[i] + ";";
    }
    var proto = base && new base;
    if (proto && proto.initialize || (methods && methods.initialize))
        code += "this.initialize();";
    code += "}}";
    var ctor = new Function(code)();
    if (proto) {
        ctor.prototype = proto;
        ctor.BASE = base;
    }
    if (base) base.SUBCLASSES.push(ctor);
    ctor.prototype.CTOR = ctor;
    ctor.PROPS = props || null;
    ctor.SELF_PROPS = self_props;
    ctor.SUBCLASSES = [];
    if (type) {
        ctor.prototype.TYPE = ctor.TYPE = type;
    }
    if (methods) for (i in methods) if (methods.hasOwnProperty(i)) {
        if (/^\$/.test(i)) {
            ctor[i.substr(1)] = methods[i];
        } else {
            ctor.prototype[i] = methods[i];
        }
    }
    ctor.DEFMETHOD = function(name, method) {
        this.prototype[name] = method;
    };
    exports["AST_" + type] = ctor;
    return ctor;
};

var AST_Token = DEFNODE("Token", "type value line col pos endline endcol endpos nlb comments_before file raw", {
}, null);

var AST_Node = DEFNODE("Node", "start end", {
    clone: function() {
        return new this.CTOR(this);
    },
    $documentation: "Base class of all AST nodes",
    $propdoc: {
        start: "[AST_Token] The first token of this node",
        end: "[AST_Token] The last token of this node"
    },
    _walk: function(visitor) {
        return visitor._visit(this);
    },
    walk: function(visitor) {
        return this._walk(visitor); // not sure the indirection will be any help
    }
}, null);

AST_Node.warn_function = null;
AST_Node.warn = function(txt, props) {
    if (AST_Node.warn_function)
        AST_Node.warn_function(string_template(txt, props));
};

/* -----[ statements ]----- */

var AST_Statement = DEFNODE("Statement", null, {
    $documentation: "Base class of all statements",
});

var AST_Debugger = DEFNODE("Debugger", null, {
    $documentation: "Represents a debugger statement",
}, AST_Statement);

var AST_Directive = DEFNODE("Directive", "value scope quote", {
    $documentation: "Represents a directive, like \"use strict\";",
    $propdoc: {
        value: "[string] The value of this directive as a plain string (it's not an AST_String!)",
        scope: "[AST_Scope/S] The scope that this directive affects",
        quote: "[string] the original quote character"
    },
}, AST_Statement);

var AST_SimpleStatement = DEFNODE("SimpleStatement", "body", {
    $documentation: "A statement consisting of an expression, i.e. a = 1 + 2",
    $propdoc: {
        body: "[AST_Node] an expression node (should not be instanceof AST_Statement)"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.body._walk(visitor);
        });
    }
}, AST_Statement);

function walk_body(node, visitor) {
    if (node.body instanceof AST_Statement) {
        node.body._walk(visitor);
    }
    else node.body.forEach(function(stat){
        stat._walk(visitor);
    });
};

var AST_Block = DEFNODE("Block", "body", {
    $documentation: "A body of statements (usually bracketed)",
    $propdoc: {
        body: "[AST_Statement*] an array of statements"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            walk_body(this, visitor);
        });
    }
}, AST_Statement);

var AST_BlockStatement = DEFNODE("BlockStatement", null, {
    $documentation: "A block statement",
}, AST_Block);

var AST_EmptyStatement = DEFNODE("EmptyStatement", null, {
    $documentation: "The empty statement (empty block or simply a semicolon)",
    _walk: function(visitor) {
        return visitor._visit(this);
    }
}, AST_Statement);

var AST_StatementWithBody = DEFNODE("StatementWithBody", "body", {
    $documentation: "Base class for all statements that contain one nested body: `For`, `ForIn`, `Do`, `While`, `With`",
    $propdoc: {
        body: "[AST_Statement] the body; this should always be present, even if it's an AST_EmptyStatement"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.body._walk(visitor);
        });
    }
}, AST_Statement);

var AST_LabeledStatement = DEFNODE("LabeledStatement", "label", {
    $documentation: "Statement with a label",
    $propdoc: {
        label: "[AST_Label] a label definition"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.label._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_StatementWithBody);

var AST_IterationStatement = DEFNODE("IterationStatement", null, {
    $documentation: "Internal class.  All loops inherit from it."
}, AST_StatementWithBody);

var AST_DWLoop = DEFNODE("DWLoop", "condition", {
    $documentation: "Base class for do/while statements",
    $propdoc: {
        condition: "[AST_Node] the loop condition.  Should not be instanceof AST_Statement"
    }
}, AST_IterationStatement);

var AST_Do = DEFNODE("Do", null, {
    $documentation: "A `do` statement",
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.body._walk(visitor);
            this.condition._walk(visitor);
        });
    }
}, AST_DWLoop);

var AST_While = DEFNODE("While", null, {
    $documentation: "A `while` statement",
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.condition._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_DWLoop);

var AST_For = DEFNODE("For", "init condition step", {
    $documentation: "A `for` statement",
    $propdoc: {
        init: "[AST_Node?] the `for` initialization code, or null if empty",
        condition: "[AST_Node?] the `for` termination clause, or null if empty",
        step: "[AST_Node?] the `for` update clause, or null if empty"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            if (this.init) this.init._walk(visitor);
            if (this.condition) this.condition._walk(visitor);
            if (this.step) this.step._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_IterationStatement);

var AST_ForIn = DEFNODE("ForIn", "init name object", {
    $documentation: "A `for ... in` statement",
    $propdoc: {
        init: "[AST_Node] the `for/in` initialization code",
        name: "[AST_SymbolRef?] the loop variable, only if `init` is AST_Var",
        object: "[AST_Node] the object that we're looping through"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.init._walk(visitor);
            this.object._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_IterationStatement);

var AST_With = DEFNODE("With", "expression", {
    $documentation: "A `with` statement",
    $propdoc: {
        expression: "[AST_Node] the `with` expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            this.body._walk(visitor);
        });
    }
}, AST_StatementWithBody);

/* -----[ scope and functions ]----- */

var AST_Scope = DEFNODE("Scope", "directives variables functions uses_with uses_eval parent_scope enclosed cname", {
    $documentation: "Base class for all statements introducing a lexical scope",
    $propdoc: {
        directives: "[string*/S] an array of directives declared in this scope",
        variables: "[Object/S] a map of name -> SymbolDef for all variables/functions defined in this scope",
        functions: "[Object/S] like `variables`, but only lists function declarations",
        uses_with: "[boolean/S] tells whether this scope uses the `with` statement",
        uses_eval: "[boolean/S] tells whether this scope contains a direct call to the global `eval`",
        parent_scope: "[AST_Scope?/S] link to the parent scope",
        enclosed: "[SymbolDef*/S] a list of all symbol definitions that are accessed from this scope or any subscopes",
        cname: "[integer/S] current index for mangling variables (used internally by the mangler)",
    },
}, AST_Block);

var AST_Toplevel = DEFNODE("Toplevel", "globals", {
    $documentation: "The toplevel scope",
    $propdoc: {
        globals: "[Object/S] a map of name -> SymbolDef for all undeclared names",
    },
    wrap_enclose: function(arg_parameter_pairs) {
        var self = this;
        var args = [];
        var parameters = [];

        arg_parameter_pairs.forEach(function(pair) {
            var splitAt = pair.lastIndexOf(":");

            args.push(pair.substr(0, splitAt));
            parameters.push(pair.substr(splitAt + 1));
        });

        var wrapped_tl = "(function(" + parameters.join(",") + "){ '$ORIG'; })(" + args.join(",") + ")";
        wrapped_tl = parse(wrapped_tl);
        wrapped_tl = wrapped_tl.transform(new TreeTransformer(function before(node){
            if (node instanceof AST_Directive && node.value == "$ORIG") {
                return MAP.splice(self.body);
            }
        }));
        return wrapped_tl;
    },
    wrap_commonjs: function(name, export_all) {
        var self = this;
        var to_export = [];
        if (export_all) {
            self.figure_out_scope();
            self.walk(new TreeWalker(function(node){
                if (node instanceof AST_SymbolDeclaration && node.definition().global) {
                    if (!find_if(function(n){ return n.name == node.name }, to_export))
                        to_export.push(node);
                }
            }));
        }
        var wrapped_tl = "(function(exports, global){ '$ORIG'; '$EXPORTS'; global['" + name + "'] = exports; }({}, (function(){return this}())))";
        wrapped_tl = parse(wrapped_tl);
        wrapped_tl = wrapped_tl.transform(new TreeTransformer(function before(node){
            if (node instanceof AST_Directive) {
                switch (node.value) {
                  case "$ORIG":
                    return MAP.splice(self.body);
                  case "$EXPORTS":
                    var body = [];
                    to_export.forEach(function(sym){
                        body.push(new AST_SimpleStatement({
                            body: new AST_Assign({
                                left: new AST_Sub({
                                    expression: new AST_SymbolRef({ name: "exports" }),
                                    property: new AST_String({ value: sym.name }),
                                }),
                                operator: "=",
                                right: new AST_SymbolRef(sym),
                            }),
                        }));
                    });
                    return MAP.splice(body);
                }
            }
        }));
        return wrapped_tl;
    }
}, AST_Scope);

var AST_Lambda = DEFNODE("Lambda", "name argnames uses_arguments", {
    $documentation: "Base class for functions",
    $propdoc: {
        name: "[AST_SymbolDeclaration?] the name of this function",
        argnames: "[AST_SymbolFunarg*] array of function arguments",
        uses_arguments: "[boolean/S] tells whether this function accesses the arguments array"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            if (this.name) this.name._walk(visitor);
            this.argnames.forEach(function(arg){
                arg._walk(visitor);
            });
            walk_body(this, visitor);
        });
    }
}, AST_Scope);

var AST_Accessor = DEFNODE("Accessor", null, {
    $documentation: "A setter/getter function.  The `name` property is always null."
}, AST_Lambda);

var AST_Function = DEFNODE("Function", null, {
    $documentation: "A function expression"
}, AST_Lambda);

var AST_Defun = DEFNODE("Defun", null, {
    $documentation: "A function definition"
}, AST_Lambda);

/* -----[ JUMPS ]----- */

var AST_Jump = DEFNODE("Jump", null, {
    $documentation: "Base class for “jumps” (for now that's `return`, `throw`, `break` and `continue`)"
}, AST_Statement);

var AST_Exit = DEFNODE("Exit", "value", {
    $documentation: "Base class for “exits” (`return` and `throw`)",
    $propdoc: {
        value: "[AST_Node?] the value returned or thrown by this statement; could be null for AST_Return"
    },
    _walk: function(visitor) {
        return visitor._visit(this, this.value && function(){
            this.value._walk(visitor);
        });
    }
}, AST_Jump);

var AST_Return = DEFNODE("Return", null, {
    $documentation: "A `return` statement"
}, AST_Exit);

var AST_Throw = DEFNODE("Throw", null, {
    $documentation: "A `throw` statement"
}, AST_Exit);

var AST_LoopControl = DEFNODE("LoopControl", "label", {
    $documentation: "Base class for loop control statements (`break` and `continue`)",
    $propdoc: {
        label: "[AST_LabelRef?] the label, or null if none",
    },
    _walk: function(visitor) {
        return visitor._visit(this, this.label && function(){
            this.label._walk(visitor);
        });
    }
}, AST_Jump);

var AST_Break = DEFNODE("Break", null, {
    $documentation: "A `break` statement"
}, AST_LoopControl);

var AST_Continue = DEFNODE("Continue", null, {
    $documentation: "A `continue` statement"
}, AST_LoopControl);

/* -----[ IF ]----- */

var AST_If = DEFNODE("If", "condition alternative", {
    $documentation: "A `if` statement",
    $propdoc: {
        condition: "[AST_Node] the `if` condition",
        alternative: "[AST_Statement?] the `else` part, or null if not present"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.condition._walk(visitor);
            this.body._walk(visitor);
            if (this.alternative) this.alternative._walk(visitor);
        });
    }
}, AST_StatementWithBody);

/* -----[ SWITCH ]----- */

var AST_Switch = DEFNODE("Switch", "expression", {
    $documentation: "A `switch` statement",
    $propdoc: {
        expression: "[AST_Node] the `switch` “discriminant”"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            walk_body(this, visitor);
        });
    }
}, AST_Block);

var AST_SwitchBranch = DEFNODE("SwitchBranch", null, {
    $documentation: "Base class for `switch` branches",
}, AST_Block);

var AST_Default = DEFNODE("Default", null, {
    $documentation: "A `default` switch branch",
}, AST_SwitchBranch);

var AST_Case = DEFNODE("Case", "expression", {
    $documentation: "A `case` switch branch",
    $propdoc: {
        expression: "[AST_Node] the `case` expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            walk_body(this, visitor);
        });
    }
}, AST_SwitchBranch);

/* -----[ EXCEPTIONS ]----- */

var AST_Try = DEFNODE("Try", "bcatch bfinally", {
    $documentation: "A `try` statement",
    $propdoc: {
        bcatch: "[AST_Catch?] the catch block, or null if not present",
        bfinally: "[AST_Finally?] the finally block, or null if not present"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            walk_body(this, visitor);
            if (this.bcatch) this.bcatch._walk(visitor);
            if (this.bfinally) this.bfinally._walk(visitor);
        });
    }
}, AST_Block);

var AST_Catch = DEFNODE("Catch", "argname", {
    $documentation: "A `catch` node; only makes sense as part of a `try` statement",
    $propdoc: {
        argname: "[AST_SymbolCatch] symbol for the exception"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.argname._walk(visitor);
            walk_body(this, visitor);
        });
    }
}, AST_Block);

var AST_Finally = DEFNODE("Finally", null, {
    $documentation: "A `finally` node; only makes sense as part of a `try` statement"
}, AST_Block);

/* -----[ VAR/CONST ]----- */

var AST_Definitions = DEFNODE("Definitions", "definitions", {
    $documentation: "Base class for `var` or `const` nodes (variable declarations/initializations)",
    $propdoc: {
        definitions: "[AST_VarDef*] array of variable definitions"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.definitions.forEach(function(def){
                def._walk(visitor);
            });
        });
    }
}, AST_Statement);

var AST_Var = DEFNODE("Var", null, {
    $documentation: "A `var` statement"
}, AST_Definitions);

var AST_Const = DEFNODE("Const", null, {
    $documentation: "A `const` statement"
}, AST_Definitions);

var AST_VarDef = DEFNODE("VarDef", "name value", {
    $documentation: "A variable declaration; only appears in a AST_Definitions node",
    $propdoc: {
        name: "[AST_SymbolVar|AST_SymbolConst] name of the variable",
        value: "[AST_Node?] initializer, or null of there's no initializer"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.name._walk(visitor);
            if (this.value) this.value._walk(visitor);
        });
    }
});

/* -----[ OTHER ]----- */

var AST_Call = DEFNODE("Call", "expression args", {
    $documentation: "A function call expression",
    $propdoc: {
        expression: "[AST_Node] expression to invoke as function",
        args: "[AST_Node*] array of arguments"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            this.args.forEach(function(arg){
                arg._walk(visitor);
            });
        });
    }
});

var AST_New = DEFNODE("New", null, {
    $documentation: "An object instantiation.  Derives from a function call since it has exactly the same properties"
}, AST_Call);

var AST_Seq = DEFNODE("Seq", "car cdr", {
    $documentation: "A sequence expression (two comma-separated expressions)",
    $propdoc: {
        car: "[AST_Node] first element in sequence",
        cdr: "[AST_Node] second element in sequence"
    },
    $cons: function(x, y) {
        var seq = new AST_Seq(x);
        seq.car = x;
        seq.cdr = y;
        return seq;
    },
    $from_array: function(array) {
        if (array.length == 0) return null;
        if (array.length == 1) return array[0].clone();
        var list = null;
        for (var i = array.length; --i >= 0;) {
            list = AST_Seq.cons(array[i], list);
        }
        var p = list;
        while (p) {
            if (p.cdr && !p.cdr.cdr) {
                p.cdr = p.cdr.car;
                break;
            }
            p = p.cdr;
        }
        return list;
    },
    to_array: function() {
        var p = this, a = [];
        while (p) {
            a.push(p.car);
            if (p.cdr && !(p.cdr instanceof AST_Seq)) {
                a.push(p.cdr);
                break;
            }
            p = p.cdr;
        }
        return a;
    },
    add: function(node) {
        var p = this;
        while (p) {
            if (!(p.cdr instanceof AST_Seq)) {
                var cell = AST_Seq.cons(p.cdr, node);
                return p.cdr = cell;
            }
            p = p.cdr;
        }
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.car._walk(visitor);
            if (this.cdr) this.cdr._walk(visitor);
        });
    }
});

var AST_PropAccess = DEFNODE("PropAccess", "expression property", {
    $documentation: "Base class for property access expressions, i.e. `a.foo` or `a[\"foo\"]`",
    $propdoc: {
        expression: "[AST_Node] the “container” expression",
        property: "[AST_Node|string] the property to access.  For AST_Dot this is always a plain string, while for AST_Sub it's an arbitrary AST_Node"
    }
});

var AST_Dot = DEFNODE("Dot", null, {
    $documentation: "A dotted property access expression",
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
        });
    }
}, AST_PropAccess);

var AST_Sub = DEFNODE("Sub", null, {
    $documentation: "Index-style property access, i.e. `a[\"foo\"]`",
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
            this.property._walk(visitor);
        });
    }
}, AST_PropAccess);

var AST_Unary = DEFNODE("Unary", "operator expression", {
    $documentation: "Base class for unary expressions",
    $propdoc: {
        operator: "[string] the operator",
        expression: "[AST_Node] expression that this unary operator applies to"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.expression._walk(visitor);
        });
    }
});

var AST_UnaryPrefix = DEFNODE("UnaryPrefix", null, {
    $documentation: "Unary prefix expression, i.e. `typeof i` or `++i`"
}, AST_Unary);

var AST_UnaryPostfix = DEFNODE("UnaryPostfix", null, {
    $documentation: "Unary postfix expression, i.e. `i++`"
}, AST_Unary);

var AST_Binary = DEFNODE("Binary", "left operator right", {
    $documentation: "Binary expression, i.e. `a + b`",
    $propdoc: {
        left: "[AST_Node] left-hand side expression",
        operator: "[string] the operator",
        right: "[AST_Node] right-hand side expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.left._walk(visitor);
            this.right._walk(visitor);
        });
    }
});

var AST_Conditional = DEFNODE("Conditional", "condition consequent alternative", {
    $documentation: "Conditional expression using the ternary operator, i.e. `a ? b : c`",
    $propdoc: {
        condition: "[AST_Node]",
        consequent: "[AST_Node]",
        alternative: "[AST_Node]"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.condition._walk(visitor);
            this.consequent._walk(visitor);
            this.alternative._walk(visitor);
        });
    }
});

var AST_Assign = DEFNODE("Assign", null, {
    $documentation: "An assignment expression — `a = b + 5`",
}, AST_Binary);

/* -----[ LITERALS ]----- */

var AST_Array = DEFNODE("Array", "elements", {
    $documentation: "An array literal",
    $propdoc: {
        elements: "[AST_Node*] array of elements"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.elements.forEach(function(el){
                el._walk(visitor);
            });
        });
    }
});

var AST_Object = DEFNODE("Object", "properties", {
    $documentation: "An object literal",
    $propdoc: {
        properties: "[AST_ObjectProperty*] array of properties"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.properties.forEach(function(prop){
                prop._walk(visitor);
            });
        });
    }
});

var AST_ObjectProperty = DEFNODE("ObjectProperty", "key value", {
    $documentation: "Base class for literal object properties",
    $propdoc: {
        key: "[string] the property name converted to a string for ObjectKeyVal.  For setters and getters this is an arbitrary AST_Node.",
        value: "[AST_Node] property value.  For setters and getters this is an AST_Function."
    },
    _walk: function(visitor) {
        return visitor._visit(this, function(){
            this.value._walk(visitor);
        });
    }
});

var AST_ObjectKeyVal = DEFNODE("ObjectKeyVal", "quote", {
    $documentation: "A key: value object property",
    $propdoc: {
        quote: "[string] the original quote character"
    }
}, AST_ObjectProperty);

var AST_ObjectSetter = DEFNODE("ObjectSetter", null, {
    $documentation: "An object setter property",
}, AST_ObjectProperty);

var AST_ObjectGetter = DEFNODE("ObjectGetter", null, {
    $documentation: "An object getter property",
}, AST_ObjectProperty);

var AST_Symbol = DEFNODE("Symbol", "scope name thedef", {
    $propdoc: {
        name: "[string] name of this symbol",
        scope: "[AST_Scope/S] the current scope (not necessarily the definition scope)",
        thedef: "[SymbolDef/S] the definition of this symbol"
    },
    $documentation: "Base class for all symbols",
});

var AST_SymbolAccessor = DEFNODE("SymbolAccessor", null, {
    $documentation: "The name of a property accessor (setter/getter function)"
}, AST_Symbol);

var AST_SymbolDeclaration = DEFNODE("SymbolDeclaration", "init", {
    $documentation: "A declaration symbol (symbol in var/const, function name or argument, symbol in catch)",
    $propdoc: {
        init: "[AST_Node*/S] array of initializers for this declaration."
    }
}, AST_Symbol);

var AST_SymbolVar = DEFNODE("SymbolVar", null, {
    $documentation: "Symbol defining a variable",
}, AST_SymbolDeclaration);

var AST_SymbolConst = DEFNODE("SymbolConst", null, {
    $documentation: "A constant declaration"
}, AST_SymbolDeclaration);

var AST_SymbolFunarg = DEFNODE("SymbolFunarg", null, {
    $documentation: "Symbol naming a function argument",
}, AST_SymbolVar);

var AST_SymbolDefun = DEFNODE("SymbolDefun", null, {
    $documentation: "Symbol defining a function",
}, AST_SymbolDeclaration);

var AST_SymbolLambda = DEFNODE("SymbolLambda", null, {
    $documentation: "Symbol naming a function expression",
}, AST_SymbolDeclaration);

var AST_SymbolCatch = DEFNODE("SymbolCatch", null, {
    $documentation: "Symbol naming the exception in catch",
}, AST_SymbolDeclaration);

var AST_Label = DEFNODE("Label", "references", {
    $documentation: "Symbol naming a label (declaration)",
    $propdoc: {
        references: "[AST_LoopControl*] a list of nodes referring to this label"
    },
    initialize: function() {
        this.references = [];
        this.thedef = this;
    }
}, AST_Symbol);

var AST_SymbolRef = DEFNODE("SymbolRef", null, {
    $documentation: "Reference to some symbol (not definition/declaration)",
}, AST_Symbol);

var AST_LabelRef = DEFNODE("LabelRef", null, {
    $documentation: "Reference to a label symbol",
}, AST_Symbol);

var AST_This = DEFNODE("This", null, {
    $documentation: "The `this` symbol",
}, AST_Symbol);

var AST_Constant = DEFNODE("Constant", null, {
    $documentation: "Base class for all constants",
    getValue: function() {
        return this.value;
    }
});

var AST_String = DEFNODE("String", "value quote", {
    $documentation: "A string literal",
    $propdoc: {
        value: "[string] the contents of this string",
        quote: "[string] the original quote character"
    }
}, AST_Constant);

var AST_Number = DEFNODE("Number", "value literal", {
    $documentation: "A number literal",
    $propdoc: {
        value: "[number] the numeric value",
        literal: "[string] numeric value as string (optional)"
    }
}, AST_Constant);

var AST_RegExp = DEFNODE("RegExp", "value", {
    $documentation: "A regexp literal",
    $propdoc: {
        value: "[RegExp] the actual regexp"
    }
}, AST_Constant);

var AST_Atom = DEFNODE("Atom", null, {
    $documentation: "Base class for atoms",
}, AST_Constant);

var AST_Null = DEFNODE("Null", null, {
    $documentation: "The `null` atom",
    value: null
}, AST_Atom);

var AST_NaN = DEFNODE("NaN", null, {
    $documentation: "The impossible value",
    value: 0/0
}, AST_Atom);

var AST_Undefined = DEFNODE("Undefined", null, {
    $documentation: "The `undefined` value",
    value: (function(){}())
}, AST_Atom);

var AST_Hole = DEFNODE("Hole", null, {
    $documentation: "A hole in an array",
    value: (function(){}())
}, AST_Atom);

var AST_Infinity = DEFNODE("Infinity", null, {
    $documentation: "The `Infinity` value",
    value: 1/0
}, AST_Atom);

var AST_Boolean = DEFNODE("Boolean", null, {
    $documentation: "Base class for booleans",
}, AST_Atom);

var AST_False = DEFNODE("False", null, {
    $documentation: "The `false` atom",
    value: false
}, AST_Boolean);

var AST_True = DEFNODE("True", null, {
    $documentation: "The `true` atom",
    value: true
}, AST_Boolean);

/* -----[ TreeWalker ]----- */

function TreeWalker(callback) {
    this.visit = callback;
    this.stack = [];
    this.directives = Object.create(null);
};
TreeWalker.prototype = {
    _visit: function(node, descend) {
        this.push(node);
        var ret = this.visit(node, descend ? function(){
            descend.call(node);
        } : noop);
        if (!ret && descend) {
            descend.call(node);
        }
        this.pop(node);
        return ret;
    },
    parent: function(n) {
        return this.stack[this.stack.length - 2 - (n || 0)];
    },
    push: function (node) {
        if (node instanceof AST_Lambda) {
            this.directives = Object.create(this.directives);
        } else if (node instanceof AST_Directive) {
            this.directives[node.value] = this.directives[node.value] ? "up" : true;
        }
        this.stack.push(node);
    },
    pop: function(node) {
        this.stack.pop();
        if (node instanceof AST_Lambda) {
            this.directives = Object.getPrototypeOf(this.directives);
        }
    },
    self: function() {
        return this.stack[this.stack.length - 1];
    },
    find_parent: function(type) {
        var stack = this.stack;
        for (var i = stack.length; --i >= 0;) {
            var x = stack[i];
            if (x instanceof type) return x;
        }
    },
    has_directive: function(type) {
        var dir = this.directives[type];
        if (dir) return dir;
        var node = this.stack[this.stack.length - 1];
        if (node instanceof AST_Scope) {
            for (var i = 0; i < node.body.length; ++i) {
                var st = node.body[i];
                if (!(st instanceof AST_Directive)) break;
                if (st.value == type) return true;
            }
        }
    },
    in_boolean_context: function() {
        var stack = this.stack;
        var i = stack.length, self = stack[--i];
        while (i > 0) {
            var p = stack[--i];
            if ((p instanceof AST_If           && p.condition === self) ||
                (p instanceof AST_Conditional  && p.condition === self) ||
                (p instanceof AST_DWLoop       && p.condition === self) ||
                (p instanceof AST_For          && p.condition === self) ||
                (p instanceof AST_UnaryPrefix  && p.operator == "!" && p.expression === self))
            {
                return true;
            }
            if (!(p instanceof AST_Binary && (p.operator == "&&" || p.operator == "||")))
                return false;
            self = p;
        }
    },
    loopcontrol_target: function(label) {
        var stack = this.stack;
        if (label) for (var i = stack.length; --i >= 0;) {
            var x = stack[i];
            if (x instanceof AST_LabeledStatement && x.label.name == label.name) {
                return x.body;
            }
        } else for (var i = stack.length; --i >= 0;) {
            var x = stack[i];
            if (x instanceof AST_Switch || x instanceof AST_IterationStatement)
                return x;
        }
    }
};

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>
    Parser based on parse-js (http://marijn.haverbeke.nl/parse-js/).

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

var KEYWORDS = 'break case catch const continue debugger default delete do else finally for function if in instanceof new return switch throw try typeof var void while with';
var KEYWORDS_ATOM = 'false null true';
var RESERVED_WORDS = 'abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized this throws transient volatile yield'
    + " " + KEYWORDS_ATOM + " " + KEYWORDS;
var KEYWORDS_BEFORE_EXPRESSION = 'return new delete throw else case';

KEYWORDS = makePredicate(KEYWORDS);
RESERVED_WORDS = makePredicate(RESERVED_WORDS);
KEYWORDS_BEFORE_EXPRESSION = makePredicate(KEYWORDS_BEFORE_EXPRESSION);
KEYWORDS_ATOM = makePredicate(KEYWORDS_ATOM);

var OPERATOR_CHARS = makePredicate(characters("+-*&%=<>!?|~^"));

var RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;
var RE_OCT_NUMBER = /^0[0-7]+$/;

var OPERATORS = makePredicate([
    "in",
    "instanceof",
    "typeof",
    "new",
    "void",
    "delete",
    "++",
    "--",
    "+",
    "-",
    "!",
    "~",
    "&",
    "|",
    "^",
    "*",
    "/",
    "%",
    ">>",
    "<<",
    ">>>",
    "<",
    ">",
    "<=",
    ">=",
    "==",
    "===",
    "!=",
    "!==",
    "?",
    "=",
    "+=",
    "-=",
    "/=",
    "*=",
    "%=",
    ">>=",
    "<<=",
    ">>>=",
    "|=",
    "^=",
    "&=",
    "&&",
    "||"
]);

var WHITESPACE_CHARS = makePredicate(characters(" \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\uFEFF"));

var PUNC_BEFORE_EXPRESSION = makePredicate(characters("[{(,.;:"));

var PUNC_CHARS = makePredicate(characters("[]{}(),;:"));

var REGEXP_MODIFIERS = makePredicate(characters("gmsiy"));

/* -----[ Tokenizer ]----- */

// regexps adapted from http://xregexp.com/plugins/#unicode
var UNICODE = {
    letter: new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0-\\u08B2\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),
    digit: new RegExp("[\\u0030-\\u0039\\u0660-\\u0669\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0DE6-\\u0DEF\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uA9F0-\\uA9F9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]"),
    non_spacing_mark: new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065E\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0900-\\u0902\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0955\\u0962\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2\\u09E3\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC\\u0CCD\\u0CE2\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86\\u0F87\\u0F90-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085\\u1086\\u108D\\u109D\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927\\u1928\\u1932\\u1939-\\u193B\\u1A17\\u1A18\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80\\u1B81\\u1BA2-\\u1BA5\\u1BA8\\u1BA9\\u1C2C-\\u1C33\\u1C36\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1DC0-\\u1DE6\\u1DFD-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA67C\\uA67D\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),
    space_combining_mark: new RegExp("[\\u0903\\u093E-\\u0940\\u0949-\\u094C\\u094E\\u0982\\u0983\\u09BE-\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B3E\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0B57\\u0BBE\\u0BBF\\u0BC1\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0F3E\\u0F3F\\u0F7F\\u102B\\u102C\\u1031\\u1038\\u103B\\u103C\\u1056\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A19-\\u1A1B\\u1A55\\u1A57\\u1A61\\u1A63\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1C24-\\u1C2B\\u1C34\\u1C35\\u1CE1\\u1CF2\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4-\\uA8C3\\uA952\\uA953\\uA983\\uA9B4\\uA9B5\\uA9BA\\uA9BB\\uA9BD-\\uA9C0\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D\\uAA7B\\uABE3\\uABE4\\uABE6\\uABE7\\uABE9\\uABEA\\uABEC]"),
    connector_punctuation: new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]")
};

function is_letter(code) {
    return (code >= 97 && code <= 122)
        || (code >= 65 && code <= 90)
        || (code >= 0xaa && UNICODE.letter.test(String.fromCharCode(code)));
};

function is_digit(code) {
    return code >= 48 && code <= 57;
};

function is_alphanumeric_char(code) {
    return is_digit(code) || is_letter(code);
};

function is_unicode_digit(code) {
    return UNICODE.digit.test(String.fromCharCode(code));
}

function is_unicode_combining_mark(ch) {
    return UNICODE.non_spacing_mark.test(ch) || UNICODE.space_combining_mark.test(ch);
};

function is_unicode_connector_punctuation(ch) {
    return UNICODE.connector_punctuation.test(ch);
};

function is_identifier(name) {
    return !RESERVED_WORDS(name) && /^[a-z_$][a-z0-9_$]*$/i.test(name);
};

function is_identifier_start(code) {
    return code == 36 || code == 95 || is_letter(code);
};

function is_identifier_char(ch) {
    var code = ch.charCodeAt(0);
    return is_identifier_start(code)
        || is_digit(code)
        || code == 8204 // \u200c: zero-width non-joiner <ZWNJ>
        || code == 8205 // \u200d: zero-width joiner <ZWJ> (in my ECMA-262 PDF, this is also 200c)
        || is_unicode_combining_mark(ch)
        || is_unicode_connector_punctuation(ch)
        || is_unicode_digit(code)
    ;
};

function is_identifier_string(str){
    return /^[a-z_$][a-z0-9_$]*$/i.test(str);
};

function parse_js_number(num) {
    if (RE_HEX_NUMBER.test(num)) {
        return parseInt(num.substr(2), 16);
    } else if (RE_OCT_NUMBER.test(num)) {
        return parseInt(num.substr(1), 8);
    } else {
        var val = parseFloat(num);
        if (val == num) return val;
    }
};

function JS_Parse_Error(message, filename, line, col, pos) {
    this.message = message;
    this.filename = filename;
    this.line = line;
    this.col = col;
    this.pos = pos;
    this.stack = new Error().stack;
};

JS_Parse_Error.prototype.toString = function() {
    return this.message + " (line: " + this.line + ", col: " + this.col + ", pos: " + this.pos + ")" + "\n\n" + this.stack;
};

function js_error(message, filename, line, col, pos) {
    throw new JS_Parse_Error(message, filename, line, col, pos);
};

function is_token(token, type, val) {
    return token.type == type && (val == null || token.value == val);
};

var EX_EOF = {};

function tokenizer($TEXT, filename, html5_comments, shebang) {

    var S = {
        text            : $TEXT,
        filename        : filename,
        pos             : 0,
        tokpos          : 0,
        line            : 1,
        tokline         : 0,
        col             : 0,
        tokcol          : 0,
        newline_before  : false,
        regex_allowed   : false,
        comments_before : []
    };

    function peek() { return S.text.charAt(S.pos); };

    function next(signal_eof, in_string) {
        var ch = S.text.charAt(S.pos++);
        if (signal_eof && !ch)
            throw EX_EOF;
        if ("\r\n\u2028\u2029".indexOf(ch) >= 0) {
            S.newline_before = S.newline_before || !in_string;
            ++S.line;
            S.col = 0;
            if (!in_string && ch == "\r" && peek() == "\n") {
                // treat a \r\n sequence as a single \n
                ++S.pos;
                ch = "\n";
            }
        } else {
            ++S.col;
        }
        return ch;
    };

    function forward(i) {
        while (i-- > 0) next();
    };

    function looking_at(str) {
        return S.text.substr(S.pos, str.length) == str;
    };

    function find(what, signal_eof) {
        var pos = S.text.indexOf(what, S.pos);
        if (signal_eof && pos == -1) throw EX_EOF;
        return pos;
    };

    function start_token() {
        S.tokline = S.line;
        S.tokcol = S.col;
        S.tokpos = S.pos;
    };

    var prev_was_dot = false;
    function token(type, value, is_comment) {
        S.regex_allowed = ((type == "operator" && !UNARY_POSTFIX(value)) ||
                           (type == "keyword" && KEYWORDS_BEFORE_EXPRESSION(value)) ||
                           (type == "punc" && PUNC_BEFORE_EXPRESSION(value)));
        prev_was_dot = (type == "punc" && value == ".");
        var ret = {
            type    : type,
            value   : value,
            line    : S.tokline,
            col     : S.tokcol,
            pos     : S.tokpos,
            endline : S.line,
            endcol  : S.col,
            endpos  : S.pos,
            nlb     : S.newline_before,
            file    : filename
        };
        if (/^(?:num|string|regexp)$/i.test(type)) {
            ret.raw = $TEXT.substring(ret.pos, ret.endpos);
        }
        if (!is_comment) {
            ret.comments_before = S.comments_before;
            S.comments_before = [];
            // make note of any newlines in the comments that came before
            for (var i = 0, len = ret.comments_before.length; i < len; i++) {
                ret.nlb = ret.nlb || ret.comments_before[i].nlb;
            }
        }
        S.newline_before = false;
        return new AST_Token(ret);
    };

    function skip_whitespace() {
        var ch;
        while (WHITESPACE_CHARS(ch = peek()) || ch == "\u2028" || ch == "\u2029")
            next();
    };

    function read_while(pred) {
        var ret = "", ch, i = 0;
        while ((ch = peek()) && pred(ch, i++))
            ret += next();
        return ret;
    };

    function parse_error(err) {
        js_error(err, filename, S.tokline, S.tokcol, S.tokpos);
    };

    function read_num(prefix) {
        var has_e = false, after_e = false, has_x = false, has_dot = prefix == ".";
        var num = read_while(function(ch, i){
            var code = ch.charCodeAt(0);
            switch (code) {
              case 120: case 88: // xX
                return has_x ? false : (has_x = true);
              case 101: case 69: // eE
                return has_x ? true : has_e ? false : (has_e = after_e = true);
              case 45: // -
                return after_e || (i == 0 && !prefix);
              case 43: // +
                return after_e;
              case (after_e = false, 46): // .
                return (!has_dot && !has_x && !has_e) ? (has_dot = true) : false;
            }
            return is_alphanumeric_char(code);
        });
        if (prefix) num = prefix + num;
        var valid = parse_js_number(num);
        if (!isNaN(valid)) {
            return token("num", valid);
        } else {
            parse_error("Invalid syntax: " + num);
        }
    };

    function read_escaped_char(in_string) {
        var ch = next(true, in_string);
        switch (ch.charCodeAt(0)) {
          case 110 : return "\n";
          case 114 : return "\r";
          case 116 : return "\t";
          case 98  : return "\b";
          case 118 : return "\u000b"; // \v
          case 102 : return "\f";
          case 48  : return "\0";
          case 120 : return String.fromCharCode(hex_bytes(2)); // \x
          case 117 : return String.fromCharCode(hex_bytes(4)); // \u
          case 10  : return ""; // newline
          case 13  :            // \r
            if (peek() == "\n") { // DOS newline
                next(true, in_string);
                return "";
            }
        }
        return ch;
    };

    function hex_bytes(n) {
        var num = 0;
        for (; n > 0; --n) {
            var digit = parseInt(next(true), 16);
            if (isNaN(digit))
                parse_error("Invalid hex-character pattern in string");
            num = (num << 4) | digit;
        }
        return num;
    };

    var read_string = with_eof_error("Unterminated string constant", function(quote_char){
        var quote = next(), ret = "";
        for (;;) {
            var ch = next(true, true);
            if (ch == "\\") {
                // read OctalEscapeSequence (XXX: deprecated if "strict mode")
                // https://github.com/mishoo/UglifyJS/issues/178
                var octal_len = 0, first = null;
                ch = read_while(function(ch){
                    if (ch >= "0" && ch <= "7") {
                        if (!first) {
                            first = ch;
                            return ++octal_len;
                        }
                        else if (first <= "3" && octal_len <= 2) return ++octal_len;
                        else if (first >= "4" && octal_len <= 1) return ++octal_len;
                    }
                    return false;
                });
                if (octal_len > 0) ch = String.fromCharCode(parseInt(ch, 8));
                else ch = read_escaped_char(true);
            }
            else if ("\r\n\u2028\u2029".indexOf(ch) >= 0) parse_error("Unterminated string constant");
            else if (ch == quote) break;
            ret += ch;
        }
        var tok = token("string", ret);
        tok.quote = quote_char;
        return tok;
    });

    function skip_line_comment(type) {
        var regex_allowed = S.regex_allowed;
        var i = find("\n"), ret;
        if (i == -1) {
            ret = S.text.substr(S.pos);
            S.pos = S.text.length;
        } else {
            ret = S.text.substring(S.pos, i);
            S.pos = i;
        }
        S.col = S.tokcol + (S.pos - S.tokpos);
        S.comments_before.push(token(type, ret, true));
        S.regex_allowed = regex_allowed;
        return next_token();
    };

    var skip_multiline_comment = with_eof_error("Unterminated multiline comment", function(){
        var regex_allowed = S.regex_allowed;
        var i = find("*/", true);
        var text = S.text.substring(S.pos, i);
        var a = text.split("\n"), n = a.length;
        // update stream position
        S.pos = i + 2;
        S.line += n - 1;
        if (n > 1) S.col = a[n - 1].length;
        else S.col += a[n - 1].length;
        S.col += 2;
        var nlb = S.newline_before = S.newline_before || text.indexOf("\n") >= 0;
        S.comments_before.push(token("comment2", text, true));
        S.regex_allowed = regex_allowed;
        S.newline_before = nlb;
        return next_token();
    });

    function read_name() {
        var backslash = false, name = "", ch, escaped = false, hex;
        while ((ch = peek()) != null) {
            if (!backslash) {
                if (ch == "\\") escaped = backslash = true, next();
                else if (is_identifier_char(ch)) name += next();
                else break;
            }
            else {
                if (ch != "u") parse_error("Expecting UnicodeEscapeSequence -- uXXXX");
                ch = read_escaped_char();
                if (!is_identifier_char(ch)) parse_error("Unicode char: " + ch.charCodeAt(0) + " is not valid in identifier");
                name += ch;
                backslash = false;
            }
        }
        if (KEYWORDS(name) && escaped) {
            hex = name.charCodeAt(0).toString(16).toUpperCase();
            name = "\\u" + "0000".substr(hex.length) + hex + name.slice(1);
        }
        return name;
    };

    var read_regexp = with_eof_error("Unterminated regular expression", function(regexp){
        var prev_backslash = false, ch, in_class = false;
        while ((ch = next(true))) if (prev_backslash) {
            regexp += "\\" + ch;
            prev_backslash = false;
        } else if (ch == "[") {
            in_class = true;
            regexp += ch;
        } else if (ch == "]" && in_class) {
            in_class = false;
            regexp += ch;
        } else if (ch == "/" && !in_class) {
            break;
        } else if (ch == "\\") {
            prev_backslash = true;
        } else {
            regexp += ch;
        }
        var mods = read_name();
        try {
          return token("regexp", new RegExp(regexp, mods));
        } catch(e) {
          parse_error(e.message);
        }
    });

    function read_operator(prefix) {
        function grow(op) {
            if (!peek()) return op;
            var bigger = op + peek();
            if (OPERATORS(bigger)) {
                next();
                return grow(bigger);
            } else {
                return op;
            }
        };
        return token("operator", grow(prefix || next()));
    };

    function handle_slash() {
        next();
        switch (peek()) {
          case "/":
            next();
            return skip_line_comment("comment1");
          case "*":
            next();
            return skip_multiline_comment();
        }
        return S.regex_allowed ? read_regexp("") : read_operator("/");
    };

    function handle_dot() {
        next();
        return is_digit(peek().charCodeAt(0))
            ? read_num(".")
            : token("punc", ".");
    };

    function read_word() {
        var word = read_name();
        if (prev_was_dot) return token("name", word);
        return KEYWORDS_ATOM(word) ? token("atom", word)
            : !KEYWORDS(word) ? token("name", word)
            : OPERATORS(word) ? token("operator", word)
            : token("keyword", word);
    };

    function with_eof_error(eof_error, cont) {
        return function(x) {
            try {
                return cont(x);
            } catch(ex) {
                if (ex === EX_EOF) parse_error(eof_error);
                else throw ex;
            }
        };
    };

    function next_token(force_regexp) {
        if (force_regexp != null)
            return read_regexp(force_regexp);
        skip_whitespace();
        start_token();
        if (html5_comments) {
            if (looking_at("<!--")) {
                forward(4);
                return skip_line_comment("comment3");
            }
            if (looking_at("-->") && S.newline_before) {
                forward(3);
                return skip_line_comment("comment4");
            }
        }
        var ch = peek();
        if (!ch) return token("eof");
        var code = ch.charCodeAt(0);
        switch (code) {
          case 34: case 39: return read_string(ch);
          case 46: return handle_dot();
          case 47: return handle_slash();
        }
        if (is_digit(code)) return read_num();
        if (PUNC_CHARS(ch)) return token("punc", next());
        if (OPERATOR_CHARS(ch)) return read_operator();
        if (code == 92 || is_identifier_start(code)) return read_word();

        if (shebang) {
            if (S.pos == 0 && looking_at("#!")) {
                forward(2);
                return skip_line_comment("comment5");
            }
        }
        parse_error("Unexpected character '" + ch + "'");
    };

    next_token.context = function(nc) {
        if (nc) S = nc;
        return S;
    };

    return next_token;

};

/* -----[ Parser (constants) ]----- */

var UNARY_PREFIX = makePredicate([
    "typeof",
    "void",
    "delete",
    "--",
    "++",
    "!",
    "~",
    "-",
    "+"
]);

var UNARY_POSTFIX = makePredicate([ "--", "++" ]);

var ASSIGNMENT = makePredicate([ "=", "+=", "-=", "/=", "*=", "%=", ">>=", "<<=", ">>>=", "|=", "^=", "&=" ]);

var PRECEDENCE = (function(a, ret){
    for (var i = 0; i < a.length; ++i) {
        var b = a[i];
        for (var j = 0; j < b.length; ++j) {
            ret[b[j]] = i + 1;
        }
    }
    return ret;
})(
    [
        ["||"],
        ["&&"],
        ["|"],
        ["^"],
        ["&"],
        ["==", "===", "!=", "!=="],
        ["<", ">", "<=", ">=", "in", "instanceof"],
        [">>", "<<", ">>>"],
        ["+", "-"],
        ["*", "/", "%"]
    ],
    {}
);

var STATEMENTS_WITH_LABELS = array_to_hash([ "fo" + "r", "do", "while", "switch" ]);

var ATOMIC_START_TOKEN = array_to_hash([ "atom", "num", "string", "regexp", "name" ]);

/* -----[ Parser ]----- */

function parse($TEXT, options) {

    options = defaults(options, {
        strict         : false,
        filename       : null,
        toplevel       : null,
        expression     : false,
        html5_comments : true,
        bare_returns   : false,
        shebang        : true,
    });

    var S = {
        input         : (typeof $TEXT == "string"
                         ? tokenizer($TEXT, options.filename,
                                     options.html5_comments, options.shebang)
                         : $TEXT),
        token         : null,
        prev          : null,
        peeked        : null,
        in_function   : 0,
        in_directives : true,
        in_loop       : 0,
        labels        : []
    };

    S.token = next();

    function is(type, value) {
        return is_token(S.token, type, value);
    };

    function peek() { return S.peeked || (S.peeked = S.input()); };

    function next() {
        S.prev = S.token;
        if (S.peeked) {
            S.token = S.peeked;
            S.peeked = null;
        } else {
            S.token = S.input();
        }
        S.in_directives = S.in_directives && (
            S.token.type == "string" || is("punc", ";")
        );
        return S.token;
    };

    function prev() {
        return S.prev;
    };

    function croak(msg, line, col, pos) {
        var ctx = S.input.context();
        js_error(msg,
                 ctx.filename,
                 line != null ? line : ctx.tokline,
                 col != null ? col : ctx.tokcol,
                 pos != null ? pos : ctx.tokpos);
    };

    function token_error(token, msg) {
        croak(msg, token.line, token.col);
    };

    function unexpected(token) {
        if (token == null)
            token = S.token;
        token_error(token, "Unexpected token: " + token.type + " (" + token.value + ")");
    };

    function expect_token(type, val) {
        if (is(type, val)) {
            return next();
        }
        token_error(S.token, "Unexpected token " + S.token.type + " «" + S.token.value + "»" + ", expected " + type + " «" + val + "»");
    };

    function expect(punc) { return expect_token("punc", punc); };

    function can_insert_semicolon() {
        return !options.strict && (
            S.token.nlb || is("eof") || is("punc", "}")
        );
    };

    function semicolon(optional) {
        if (is("punc", ";")) next();
        else if (!optional && !can_insert_semicolon()) unexpected();
    };

    function parenthesised() {
        expect("(");
        var exp = expression(true);
        expect(")");
        return exp;
    };

    function embed_tokens(parser) {
        return function() {
            var start = S.token;
            var expr = parser();
            var end = prev();
            expr.start = start;
            expr.end = end;
            return expr;
        };
    };

    function handle_regexp() {
        if (is("operator", "/") || is("operator", "/=")) {
            S.peeked = null;
            S.token = S.input(S.token.value.substr(1)); // force regexp
        }
    };

    var statement = embed_tokens(function() {
        var tmp;
        handle_regexp();
        switch (S.token.type) {
          case "string":
            var dir = S.in_directives, stat = simple_statement();
            // XXXv2: decide how to fix directives
            if (dir && stat.body instanceof AST_String && !is("punc", ",")) {
                return new AST_Directive({
                    start : stat.body.start,
                    end   : stat.body.end,
                    quote : stat.body.quote,
                    value : stat.body.value,
                });
            }
            return stat;
          case "num":
          case "regexp":
          case "operator":
          case "atom":
            return simple_statement();

          case "name":
            return is_token(peek(), "punc", ":")
                ? labeled_statement()
                : simple_statement();

          case "punc":
            switch (S.token.value) {
              case "{":
                return new AST_BlockStatement({
                    start : S.token,
                    body  : block_(),
                    end   : prev()
                });
              case "[":
              case "(":
                return simple_statement();
              case ";":
                next();
                return new AST_EmptyStatement();
              default:
                unexpected();
            }

          case "keyword":
            switch (tmp = S.token.value, next(), tmp) {
              case "break":
                return break_cont(AST_Break);

              case "continue":
                return break_cont(AST_Continue);

              case "debugger":
                semicolon();
                return new AST_Debugger();

              case "do":
                return new AST_Do({
                    body      : in_loop(statement),
                    condition : (expect_token("keyword", "while"), tmp = parenthesised(), semicolon(true), tmp)
                });

              case "while":
                return new AST_While({
                    condition : parenthesised(),
                    body      : in_loop(statement)
                });

              case "fo" + "r":
                return for_();

              case "function":
                return function_(AST_Defun);

              case "if":
                return if_();

              case "return":
                if (S.in_function == 0 && !options.bare_returns)
                    croak("'return' outside of function");
                return new AST_Return({
                    value: ( is("punc", ";")
                             ? (next(), null)
                             : can_insert_semicolon()
                             ? null
                             : (tmp = expression(true), semicolon(), tmp) )
                });

              case "switch":
                return new AST_Switch({
                    expression : parenthesised(),
                    body       : in_loop(switch_body_)
                });

              case "throw":
                if (S.token.nlb)
                    croak("Illegal newline after 'throw'");
                return new AST_Throw({
                    value: (tmp = expression(true), semicolon(), tmp)
                });

              case "try":
                return try_();

              case "var":
                return tmp = var_(), semicolon(), tmp;

              case "const":
                return tmp = const_(), semicolon(), tmp;

              case "with":
                return new AST_With({
                    expression : parenthesised(),
                    body       : statement()
                });

              default:
                unexpected();
            }
        }
    });

    function labeled_statement() {
        var label = as_symbol(AST_Label);
        if (find_if(function(l){ return l.name == label.name }, S.labels)) {
            // ECMA-262, 12.12: An ECMAScript program is considered
            // syntactically incorrect if it contains a
            // LabelledStatement that is enclosed by a
            // LabelledStatement with the same Identifier as label.
            croak("Label " + label.name + " defined twice");
        }
        expect(":");
        S.labels.push(label);
        var stat = statement();
        S.labels.pop();
        if (!(stat instanceof AST_IterationStatement)) {
            // check for `continue` that refers to this label.
            // those should be reported as syntax errors.
            // https://github.com/mishoo/UglifyJS2/issues/287
            label.references.forEach(function(ref){
                if (ref instanceof AST_Continue) {
                    ref = ref.label.start;
                    croak("Continue label `" + label.name + "` refers to non-IterationStatement.",
                          ref.line, ref.col, ref.pos);
                }
            });
        }
        return new AST_LabeledStatement({ body: stat, label: label });
    };

    function simple_statement(tmp) {
        return new AST_SimpleStatement({ body: (tmp = expression(true), semicolon(), tmp) });
    };

    function break_cont(type) {
        var label = null, ldef;
        if (!can_insert_semicolon()) {
            label = as_symbol(AST_LabelRef, true);
        }
        if (label != null) {
            ldef = find_if(function(l){ return l.name == label.name }, S.labels);
            if (!ldef)
                croak("Undefined label " + label.name);
            label.thedef = ldef;
        }
        else if (S.in_loop == 0)
            croak(type.TYPE + " not inside a loop or switch");
        semicolon();
        var stat = new type({ label: label });
        if (ldef) ldef.references.push(stat);
        return stat;
    };

    function for_() {
        expect("(");
        var init = null;
        if (!is("punc", ";")) {
            init = is("keyword", "var")
                ? (next(), var_(true))
                : expression(true, true);
            if (is("operator", "in")) {
                if (init instanceof AST_Var && init.definitions.length > 1)
                    croak("Only one variable declaration allowed in for..in loop");
                next();
                return for_in(init);
            }
        }
        return regular_for(init);
    };

    function regular_for(init) {
        expect(";");
        var test = is("punc", ";") ? null : expression(true);
        expect(";");
        var step = is("punc", ")") ? null : expression(true);
        expect(")");
        return new AST_For({
            init      : init,
            condition : test,
            step      : step,
            body      : in_loop(statement)
        });
    };

    function for_in(init) {
        var lhs = init instanceof AST_Var ? init.definitions[0].name : null;
        var obj = expression(true);
        expect(")");
        return new AST_ForIn({
            init   : init,
            name   : lhs,
            object : obj,
            body   : in_loop(statement)
        });
    };

    var function_ = function(ctor) {
        var in_statement = ctor === AST_Defun;
        var name = is("name") ? as_symbol(in_statement ? AST_SymbolDefun : AST_SymbolLambda) : null;
        if (in_statement && !name)
            unexpected();
        expect("(");
        return new ctor({
            name: name,
            argnames: (function(first, a){
                while (!is("punc", ")")) {
                    if (first) first = false; else expect(",");
                    a.push(as_symbol(AST_SymbolFunarg));
                }
                next();
                return a;
            })(true, []),
            body: (function(loop, labels){
                ++S.in_function;
                S.in_directives = true;
                S.in_loop = 0;
                S.labels = [];
                var a = block_();
                --S.in_function;
                S.in_loop = loop;
                S.labels = labels;
                return a;
            })(S.in_loop, S.labels)
        });
    };

    function if_() {
        var cond = parenthesised(), body = statement(), belse = null;
        if (is("keyword", "else")) {
            next();
            belse = statement();
        }
        return new AST_If({
            condition   : cond,
            body        : body,
            alternative : belse
        });
    };

    function block_() {
        expect("{");
        var a = [];
        while (!is("punc", "}")) {
            if (is("eof")) unexpected();
            a.push(statement());
        }
        next();
        return a;
    };

    function switch_body_() {
        expect("{");
        var a = [], cur = null, branch = null, tmp;
        while (!is("punc", "}")) {
            if (is("eof")) unexpected();
            if (is("keyword", "case")) {
                if (branch) branch.end = prev();
                cur = [];
                branch = new AST_Case({
                    start      : (tmp = S.token, next(), tmp),
                    expression : expression(true),
                    body       : cur
                });
                a.push(branch);
                expect(":");
            }
            else if (is("keyword", "default")) {
                if (branch) branch.end = prev();
                cur = [];
                branch = new AST_Default({
                    start : (tmp = S.token, next(), expect(":"), tmp),
                    body  : cur
                });
                a.push(branch);
            }
            else {
                if (!cur) unexpected();
                cur.push(statement());
            }
        }
        if (branch) branch.end = prev();
        next();
        return a;
    };

    function try_() {
        var body = block_(), bcatch = null, bfinally = null;
        if (is("keyword", "catch")) {
            var start = S.token;
            next();
            expect("(");
            var name = as_symbol(AST_SymbolCatch);
            expect(")");
            bcatch = new AST_Catch({
                start   : start,
                argname : name,
                body    : block_(),
                end     : prev()
            });
        }
        if (is("keyword", "finally")) {
            var start = S.token;
            next();
            bfinally = new AST_Finally({
                start : start,
                body  : block_(),
                end   : prev()
            });
        }
        if (!bcatch && !bfinally)
            croak("Missing catch/finally blocks");
        return new AST_Try({
            body     : body,
            bcatch   : bcatch,
            bfinally : bfinally
        });
    };

    function vardefs(no_in, in_const) {
        var a = [];
        for (;;) {
            a.push(new AST_VarDef({
                start : S.token,
                name  : as_symbol(in_const ? AST_SymbolConst : AST_SymbolVar),
                value : is("operator", "=") ? (next(), expression(false, no_in)) : null,
                end   : prev()
            }));
            if (!is("punc", ","))
                break;
            next();
        }
        return a;
    };

    var var_ = function(no_in) {
        return new AST_Var({
            start       : prev(),
            definitions : vardefs(no_in, false),
            end         : prev()
        });
    };

    var const_ = function() {
        return new AST_Const({
            start       : prev(),
            definitions : vardefs(false, true),
            end         : prev()
        });
    };

    var new_ = function(allow_calls) {
        var start = S.token;
        expect_token("operator", "new");
        var newexp = expr_atom(false), args;
        if (is("punc", "(")) {
            next();
            args = expr_list(")");
        } else {
            args = [];
        }
        return subscripts(new AST_New({
            start      : start,
            expression : newexp,
            args       : args,
            end        : prev()
        }), allow_calls);
    };

    function as_atom_node() {
        var tok = S.token, ret;
        switch (tok.type) {
          case "name":
          case "keyword":
            ret = _make_symbol(AST_SymbolRef);
            break;
          case "num":
            ret = new AST_Number({ start: tok, end: tok, value: tok.value });
            break;
          case "string":
            ret = new AST_String({
                start : tok,
                end   : tok,
                value : tok.value,
                quote : tok.quote
            });
            break;
          case "regexp":
            ret = new AST_RegExp({ start: tok, end: tok, value: tok.value });
            break;
          case "atom":
            switch (tok.value) {
              case "false":
                ret = new AST_False({ start: tok, end: tok });
                break;
              case "true":
                ret = new AST_True({ start: tok, end: tok });
                break;
              case "null":
                ret = new AST_Null({ start: tok, end: tok });
                break;
            }
            break;
          case "operator":
            if (!is_identifier_string(tok.value)) {
                throw new JS_Parse_Error("Invalid getter/setter name: " + tok.value,
                    tok.file, tok.line, tok.col, tok.pos);
            }
            ret = _make_symbol(AST_SymbolRef);
            break;
        }
        next();
        return ret;
    };

    var expr_atom = function(allow_calls) {
        if (is("operator", "new")) {
            return new_(allow_calls);
        }
        var start = S.token;
        if (is("punc")) {
            switch (start.value) {
              case "(":
                next();
                var ex = expression(true);
                ex.start = start;
                ex.end = S.token;
                expect(")");
                return subscripts(ex, allow_calls);
              case "[":
                return subscripts(array_(), allow_calls);
              case "{":
                return subscripts(object_(), allow_calls);
            }
            unexpected();
        }
        if (is("keyword", "function")) {
            next();
            var func = function_(AST_Function);
            func.start = start;
            func.end = prev();
            return subscripts(func, allow_calls);
        }
        if (ATOMIC_START_TOKEN[S.token.type]) {
            return subscripts(as_atom_node(), allow_calls);
        }
        unexpected();
    };

    function expr_list(closing, allow_trailing_comma, allow_empty) {
        var first = true, a = [];
        while (!is("punc", closing)) {
            if (first) first = false; else expect(",");
            if (allow_trailing_comma && is("punc", closing)) break;
            if (is("punc", ",") && allow_empty) {
                a.push(new AST_Hole({ start: S.token, end: S.token }));
            } else {
                a.push(expression(false));
            }
        }
        next();
        return a;
    };

    var array_ = embed_tokens(function() {
        expect("[");
        return new AST_Array({
            elements: expr_list("]", !options.strict, true)
        });
    });

    var object_ = embed_tokens(function() {
        expect("{");
        var first = true, a = [];
        while (!is("punc", "}")) {
            if (first) first = false; else expect(",");
            if (!options.strict && is("punc", "}"))
                // allow trailing comma
                break;
            var start = S.token;
            var type = start.type;
            var name = as_property_name();
            if (type == "name" && !is("punc", ":")) {
                if (name == "get") {
                    a.push(new AST_ObjectGetter({
                        start : start,
                        key   : as_atom_node(),
                        value : function_(AST_Accessor),
                        end   : prev()
                    }));
                    continue;
                }
                if (name == "set") {
                    a.push(new AST_ObjectSetter({
                        start : start,
                        key   : as_atom_node(),
                        value : function_(AST_Accessor),
                        end   : prev()
                    }));
                    continue;
                }
            }
            expect(":");
            a.push(new AST_ObjectKeyVal({
                start : start,
                quote : start.quote,
                key   : name,
                value : expression(false),
                end   : prev()
            }));
        }
        next();
        return new AST_Object({ properties: a });
    });

    function as_property_name() {
        var tmp = S.token;
        next();
        switch (tmp.type) {
          case "num":
          case "string":
          case "name":
          case "operator":
          case "keyword":
          case "atom":
            return tmp.value;
          default:
            unexpected();
        }
    };

    function as_name() {
        var tmp = S.token;
        next();
        switch (tmp.type) {
          case "name":
          case "operator":
          case "keyword":
          case "atom":
            return tmp.value;
          default:
            unexpected();
        }
    };

    function _make_symbol(type) {
        var name = S.token.value;
        return new (name == "this" ? AST_This : type)({
            name  : String(name),
            start : S.token,
            end   : S.token
        });
    };

    function as_symbol(type, noerror) {
        if (!is("name")) {
            if (!noerror) croak("Name expected");
            return null;
        }
        var sym = _make_symbol(type);
        next();
        return sym;
    };

    var subscripts = function(expr, allow_calls) {
        var start = expr.start;
        if (is("punc", ".")) {
            next();
            return subscripts(new AST_Dot({
                start      : start,
                expression : expr,
                property   : as_name(),
                end        : prev()
            }), allow_calls);
        }
        if (is("punc", "[")) {
            next();
            var prop = expression(true);
            expect("]");
            return subscripts(new AST_Sub({
                start      : start,
                expression : expr,
                property   : prop,
                end        : prev()
            }), allow_calls);
        }
        if (allow_calls && is("punc", "(")) {
            next();
            return subscripts(new AST_Call({
                start      : start,
                expression : expr,
                args       : expr_list(")"),
                end        : prev()
            }), true);
        }
        return expr;
    };

    var maybe_unary = function(allow_calls) {
        var start = S.token;
        if (is("operator") && UNARY_PREFIX(start.value)) {
            next();
            handle_regexp();
            var ex = make_unary(AST_UnaryPrefix, start.value, maybe_unary(allow_calls));
            ex.start = start;
            ex.end = prev();
            return ex;
        }
        var val = expr_atom(allow_calls);
        while (is("operator") && UNARY_POSTFIX(S.token.value) && !S.token.nlb) {
            val = make_unary(AST_UnaryPostfix, S.token.value, val);
            val.start = start;
            val.end = S.token;
            next();
        }
        return val;
    };

    function make_unary(ctor, op, expr) {
        if ((op == "++" || op == "--") && !is_assignable(expr))
            croak("Invalid use of " + op + " operator");
        return new ctor({ operator: op, expression: expr });
    };

    var expr_op = function(left, min_prec, no_in) {
        var op = is("operator") ? S.token.value : null;
        if (op == "in" && no_in) op = null;
        var prec = op != null ? PRECEDENCE[op] : null;
        if (prec != null && prec > min_prec) {
            next();
            var right = expr_op(maybe_unary(true), prec, no_in);
            return expr_op(new AST_Binary({
                start    : left.start,
                left     : left,
                operator : op,
                right    : right,
                end      : right.end
            }), min_prec, no_in);
        }
        return left;
    };

    function expr_ops(no_in) {
        return expr_op(maybe_unary(true), 0, no_in);
    };

    var maybe_conditional = function(no_in) {
        var start = S.token;
        var expr = expr_ops(no_in);
        if (is("operator", "?")) {
            next();
            var yes = expression(false);
            expect(":");
            return new AST_Conditional({
                start       : start,
                condition   : expr,
                consequent  : yes,
                alternative : expression(false, no_in),
                end         : prev()
            });
        }
        return expr;
    };

    function is_assignable(expr) {
        if (!options.strict) return true;
        if (expr instanceof AST_This) return false;
        return (expr instanceof AST_PropAccess || expr instanceof AST_Symbol);
    };

    var maybe_assign = function(no_in) {
        var start = S.token;
        var left = maybe_conditional(no_in), val = S.token.value;
        if (is("operator") && ASSIGNMENT(val)) {
            if (is_assignable(left)) {
                next();
                return new AST_Assign({
                    start    : start,
                    left     : left,
                    operator : val,
                    right    : maybe_assign(no_in),
                    end      : prev()
                });
            }
            croak("Invalid assignment");
        }
        return left;
    };

    var expression = function(commas, no_in) {
        var start = S.token;
        var expr = maybe_assign(no_in);
        if (commas && is("punc", ",")) {
            next();
            return new AST_Seq({
                start  : start,
                car    : expr,
                cdr    : expression(true, no_in),
                end    : peek()
            });
        }
        return expr;
    };

    function in_loop(cont) {
        ++S.in_loop;
        var ret = cont();
        --S.in_loop;
        return ret;
    };

    if (options.expression) {
        return expression(true);
    }

    return (function(){
        var start = S.token;
        var body = [];
        while (!is("eof"))
            body.push(statement());
        var end = prev();
        var toplevel = options.toplevel;
        if (toplevel) {
            toplevel.body = toplevel.body.concat(body);
            toplevel.end = end;
        } else {
            toplevel = new AST_Toplevel({ start: start, body: body, end: end });
        }
        return toplevel;
    })();

};

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

// Tree transformer helpers.

function TreeTransformer(before, after) {
    TreeWalker.call(this);
    this.before = before;
    this.after = after;
}
TreeTransformer.prototype = new TreeWalker;

(function(undefined){

    function _(node, descend) {
        node.DEFMETHOD("transform", function(tw, in_list){
            var x, y;
            tw.push(this);
            if (tw.before) x = tw.before(this, descend, in_list);
            if (x === undefined) {
                if (!tw.after) {
                    x = this;
                    descend(x, tw);
                } else {
                    tw.stack[tw.stack.length - 1] = x = this;
                    descend(x, tw);
                    y = tw.after(x, in_list);
                    if (y !== undefined) x = y;
                }
            }
            tw.pop(this);
            return x;
        });
    };

    function do_list(list, tw) {
        return MAP(list, function(node){
            return node.transform(tw, true);
        });
    };

    _(AST_Node, noop);

    _(AST_LabeledStatement, function(self, tw){
        self.label = self.label.transform(tw);
        self.body = self.body.transform(tw);
    });

    _(AST_SimpleStatement, function(self, tw){
        self.body = self.body.transform(tw);
    });

    _(AST_Block, function(self, tw){
        self.body = do_list(self.body, tw);
    });

    _(AST_DWLoop, function(self, tw){
        self.condition = self.condition.transform(tw);
        self.body = self.body.transform(tw);
    });

    _(AST_For, function(self, tw){
        if (self.init) self.init = self.init.transform(tw);
        if (self.condition) self.condition = self.condition.transform(tw);
        if (self.step) self.step = self.step.transform(tw);
        self.body = self.body.transform(tw);
    });

    _(AST_ForIn, function(self, tw){
        self.init = self.init.transform(tw);
        self.object = self.object.transform(tw);
        self.body = self.body.transform(tw);
    });

    _(AST_With, function(self, tw){
        self.expression = self.expression.transform(tw);
        self.body = self.body.transform(tw);
    });

    _(AST_Exit, function(self, tw){
        if (self.value) self.value = self.value.transform(tw);
    });

    _(AST_LoopControl, function(self, tw){
        if (self.label) self.label = self.label.transform(tw);
    });

    _(AST_If, function(self, tw){
        self.condition = self.condition.transform(tw);
        self.body = self.body.transform(tw);
        if (self.alternative) self.alternative = self.alternative.transform(tw);
    });

    _(AST_Switch, function(self, tw){
        self.expression = self.expression.transform(tw);
        self.body = do_list(self.body, tw);
    });

    _(AST_Case, function(self, tw){
        self.expression = self.expression.transform(tw);
        self.body = do_list(self.body, tw);
    });

    _(AST_Try, function(self, tw){
        self.body = do_list(self.body, tw);
        if (self.bcatch) self.bcatch = self.bcatch.transform(tw);
        if (self.bfinally) self.bfinally = self.bfinally.transform(tw);
    });

    _(AST_Catch, function(self, tw){
        self.argname = self.argname.transform(tw);
        self.body = do_list(self.body, tw);
    });

    _(AST_Definitions, function(self, tw){
        self.definitions = do_list(self.definitions, tw);
    });

    _(AST_VarDef, function(self, tw){
        self.name = self.name.transform(tw);
        if (self.value) self.value = self.value.transform(tw);
    });

    _(AST_Lambda, function(self, tw){
        if (self.name) self.name = self.name.transform(tw);
        self.argnames = do_list(self.argnames, tw);
        self.body = do_list(self.body, tw);
    });

    _(AST_Call, function(self, tw){
        self.expression = self.expression.transform(tw);
        self.args = do_list(self.args, tw);
    });

    _(AST_Seq, function(self, tw){
        self.car = self.car.transform(tw);
        self.cdr = self.cdr.transform(tw);
    });

    _(AST_Dot, function(self, tw){
        self.expression = self.expression.transform(tw);
    });

    _(AST_Sub, function(self, tw){
        self.expression = self.expression.transform(tw);
        self.property = self.property.transform(tw);
    });

    _(AST_Unary, function(self, tw){
        self.expression = self.expression.transform(tw);
    });

    _(AST_Binary, function(self, tw){
        self.left = self.left.transform(tw);
        self.right = self.right.transform(tw);
    });

    _(AST_Conditional, function(self, tw){
        self.condition = self.condition.transform(tw);
        self.consequent = self.consequent.transform(tw);
        self.alternative = self.alternative.transform(tw);
    });

    _(AST_Array, function(self, tw){
        self.elements = do_list(self.elements, tw);
    });

    _(AST_Object, function(self, tw){
        self.properties = do_list(self.properties, tw);
    });

    _(AST_ObjectProperty, function(self, tw){
        self.value = self.value.transform(tw);
    });

})();

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

function SymbolDef(scope, index, orig) {
    this.name = orig.name;
    this.orig = [ orig ];
    this.scope = scope;
    this.references = [];
    this.global = false;
    this.mangled_name = null;
    this.undeclared = false;
    this.constant = false;
    this.index = index;
};

SymbolDef.prototype = {
    unmangleable: function(options) {
        if (!options) options = {};

        return (this.global && !options.toplevel)
            || this.undeclared
            || (!options.eval && (this.scope.uses_eval || this.scope.uses_with))
            || (options.keep_fnames
                && (this.orig[0] instanceof AST_SymbolLambda
                    || this.orig[0] instanceof AST_SymbolDefun));
    },
    mangle: function(options) {
        var cache = options.cache && options.cache.props;
        if (this.global && cache && cache.has(this.name)) {
            this.mangled_name = cache.get(this.name);
        }
        else if (!this.mangled_name && !this.unmangleable(options)) {
            var s = this.scope;
            if (!options.screw_ie8 && this.orig[0] instanceof AST_SymbolLambda)
                s = s.parent_scope;
            this.mangled_name = s.next_mangled(options, this);
            if (this.global && cache) {
                cache.set(this.name, this.mangled_name);
            }
        }
    }
};

AST_Toplevel.DEFMETHOD("figure_out_scope", function(options){
    options = defaults(options, {
        screw_ie8: false,
        cache: null
    });

    // pass 1: setup scope chaining and handle definitions
    var self = this;
    var scope = self.parent_scope = null;
    var labels = new Dictionary();
    var defun = null;
    var last_var_had_const_pragma = false;
    var nesting = 0;
    var tw = new TreeWalker(function(node, descend){
        if (options.screw_ie8 && node instanceof AST_Catch) {
            var save_scope = scope;
            scope = new AST_Scope(node);
            scope.init_scope_vars(nesting);
            scope.parent_scope = save_scope;
            descend();
            scope = save_scope;
            return true;
        }
        if (node instanceof AST_Scope) {
            node.init_scope_vars(nesting);
            var save_scope = node.parent_scope = scope;
            var save_defun = defun;
            var save_labels = labels;
            defun = scope = node;
            labels = new Dictionary();
            ++nesting; descend(); --nesting;
            scope = save_scope;
            defun = save_defun;
            labels = save_labels;
            return true;        // don't descend again in TreeWalker
        }
        if (node instanceof AST_LabeledStatement) {
            var l = node.label;
            if (labels.has(l.name)) {
                throw new Error(string_template("Label {name} defined twice", l));
            }
            labels.set(l.name, l);
            descend();
            labels.del(l.name);
            return true;        // no descend again
        }
        if (node instanceof AST_With) {
            for (var s = scope; s; s = s.parent_scope)
                s.uses_with = true;
            return;
        }
        if (node instanceof AST_Symbol) {
            node.scope = scope;
        }
        if (node instanceof AST_Label) {
            node.thedef = node;
            node.references = [];
        }
        if (node instanceof AST_SymbolLambda) {
            defun.def_function(node);
        }
        else if (node instanceof AST_SymbolDefun) {
            // Careful here, the scope where this should be defined is
            // the parent scope.  The reason is that we enter a new
            // scope when we encounter the AST_Defun node (which is
            // instanceof AST_Scope) but we get to the symbol a bit
            // later.
            (node.scope = defun.parent_scope).def_function(node);
        }
        else if (node instanceof AST_Var) {
            last_var_had_const_pragma = node.has_const_pragma();
        }
        else if (node instanceof AST_SymbolVar
                 || node instanceof AST_SymbolConst) {
            var def = defun.def_variable(node);
            def.constant = node instanceof AST_SymbolConst || last_var_had_const_pragma;
            def.init = tw.parent().value;
        }
        else if (node instanceof AST_SymbolCatch) {
            (options.screw_ie8 ? scope : defun)
                .def_variable(node);
        }
        else if (node instanceof AST_LabelRef) {
            var sym = labels.get(node.name);
            if (!sym) throw new Error(string_template("Undefined label {name} [{line},{col}]", {
                name: node.name,
                line: node.start.line,
                col: node.start.col
            }));
            node.thedef = sym;
        }
    });
    self.walk(tw);

    // pass 2: find back references and eval
    var func = null;
    var globals = self.globals = new Dictionary();
    var tw = new TreeWalker(function(node, descend){
        if (node instanceof AST_Lambda) {
            var prev_func = func;
            func = node;
            descend();
            func = prev_func;
            return true;
        }
        if (node instanceof AST_LoopControl && node.label) {
            node.label.thedef.references.push(node);
            return true;
        }
        if (node instanceof AST_SymbolRef) {
            var name = node.name;
            if (name == "eval" && tw.parent() instanceof AST_Call) {
                for (var s = node.scope; s && !s.uses_eval; s = s.parent_scope) {
                    s.uses_eval = true;
                }
            }
            var sym = node.scope.find_variable(name);
            if (!sym) {
                var g;
                if (globals.has(name)) {
                    g = globals.get(name);
                } else {
                    g = new SymbolDef(self, globals.size(), node);
                    g.undeclared = true;
                    g.global = true;
                    globals.set(name, g);
                }
                node.thedef = g;
                if (func && name == "arguments") {
                    func.uses_arguments = true;
                }
            } else {
                node.thedef = sym;
            }
            node.reference();
            return true;
        }
    });
    self.walk(tw);

    if (options.cache) {
        this.cname = options.cache.cname;
    }
});

AST_Scope.DEFMETHOD("init_scope_vars", function(nesting){
    this.variables = new Dictionary(); // map name to AST_SymbolVar (variables defined in this scope; includes functions)
    this.functions = new Dictionary(); // map name to AST_SymbolDefun (functions defined in this scope)
    this.uses_with = false;   // will be set to true if this or some nested scope uses the `with` statement
    this.uses_eval = false;   // will be set to true if this or nested scope uses the global `eval`
    this.parent_scope = null; // the parent scope
    this.enclosed = [];       // a list of variables from this or outer scope(s) that are referenced from this or inner scopes
    this.cname = -1;          // the current index for mangling functions/variables
    this.nesting = nesting;   // the nesting level of this scope (0 means toplevel)
});

AST_Lambda.DEFMETHOD("init_scope_vars", function(){
    AST_Scope.prototype.init_scope_vars.apply(this, arguments);
    this.uses_arguments = false;

    var symbol = new AST_VarDef({ name: "arguments", start: this.start, end: this.end });
    var def = new SymbolDef(this, this.variables.size(), symbol);
    this.variables.set(symbol.name, def);
});

AST_SymbolRef.DEFMETHOD("reference", function() {
    var def = this.definition();
    def.references.push(this);
    var s = this.scope;
    while (s) {
        push_uniq(s.enclosed, def);
        if (s === def.scope) break;
        s = s.parent_scope;
    }
    this.frame = this.scope.nesting - def.scope.nesting;
});

AST_Scope.DEFMETHOD("find_variable", function(name){
    if (name instanceof AST_Symbol) name = name.name;
    return this.variables.get(name)
        || (this.parent_scope && this.parent_scope.find_variable(name));
});

AST_Scope.DEFMETHOD("def_function", function(symbol){
    this.functions.set(symbol.name, this.def_variable(symbol));
});

AST_Scope.DEFMETHOD("def_variable", function(symbol){
    var def;
    if (!this.variables.has(symbol.name)) {
        def = new SymbolDef(this, this.variables.size(), symbol);
        this.variables.set(symbol.name, def);
        def.global = !this.parent_scope;
    } else {
        def = this.variables.get(symbol.name);
        def.orig.push(symbol);
    }
    return symbol.thedef = def;
});

AST_Scope.DEFMETHOD("next_mangled", function(options){
    var ext = this.enclosed;
    out: while (true) {
        var m = base54(++this.cname);
        if (!is_identifier(m)) continue; // skip over "do"

        // https://github.com/mishoo/UglifyJS2/issues/242 -- do not
        // shadow a name excepted from mangling.
        if (options.except.indexOf(m) >= 0) continue;

        // we must ensure that the mangled name does not shadow a name
        // from some parent scope that is referenced in this or in
        // inner scopes.
        for (var i = ext.length; --i >= 0;) {
            var sym = ext[i];
            var name = sym.mangled_name || (sym.unmangleable(options) && sym.name);
            if (m == name) continue out;
        }
        return m;
    }
});

AST_Function.DEFMETHOD("next_mangled", function(options, def){
    // #179, #326
    // in Safari strict mode, something like (function x(x){...}) is a syntax error;
    // a function expression's argument cannot shadow the function expression's name

    var tricky_def = def.orig[0] instanceof AST_SymbolFunarg && this.name && this.name.definition();
    while (true) {
        var name = AST_Lambda.prototype.next_mangled.call(this, options, def);
        if (!(tricky_def && tricky_def.mangled_name == name))
            return name;
    }
});

AST_Scope.DEFMETHOD("references", function(sym){
    if (sym instanceof AST_Symbol) sym = sym.definition();
    return this.enclosed.indexOf(sym) < 0 ? null : sym;
});

AST_Symbol.DEFMETHOD("unmangleable", function(options){
    return this.definition().unmangleable(options);
});

// property accessors are not mangleable
AST_SymbolAccessor.DEFMETHOD("unmangleable", function(){
    return true;
});

// labels are always mangleable
AST_Label.DEFMETHOD("unmangleable", function(){
    return false;
});

AST_Symbol.DEFMETHOD("unreferenced", function(){
    return this.definition().references.length == 0
        && !(this.scope.uses_eval || this.scope.uses_with);
});

AST_Symbol.DEFMETHOD("undeclared", function(){
    return this.definition().undeclared;
});

AST_LabelRef.DEFMETHOD("undeclared", function(){
    return false;
});

AST_Label.DEFMETHOD("undeclared", function(){
    return false;
});

AST_Symbol.DEFMETHOD("definition", function(){
    return this.thedef;
});

AST_Symbol.DEFMETHOD("global", function(){
    return this.definition().global;
});

AST_Var.DEFMETHOD("has_const_pragma", function() {
    var comments_before = this.start && this.start.comments_before;
    var lastComment = comments_before && comments_before[comments_before.length - 1];
    return lastComment && /@const\b/.test(lastComment.value);
});

AST_Toplevel.DEFMETHOD("_default_mangler_options", function(options){
    return defaults(options, {
        except      : [],
        eval        : false,
        sort        : false,
        toplevel    : false,
        screw_ie8   : false,
        keep_fnames : false
    });
});

AST_Toplevel.DEFMETHOD("mangle_names", function(options){
    options = this._default_mangler_options(options);

    // Never mangle arguments
    options.except.push('arguments');

    // We only need to mangle declaration nodes.  Special logic wired
    // into the code generator will display the mangled name if it's
    // present (and for AST_SymbolRef-s it'll use the mangled name of
    // the AST_SymbolDeclaration that it points to).
    var lname = -1;
    var to_mangle = [];

    if (options.cache) {
        this.globals.each(function(symbol){
            if (options.except.indexOf(symbol.name) < 0) {
                to_mangle.push(symbol);
            }
        });
    }

    var tw = new TreeWalker(function(node, descend){
        if (node instanceof AST_LabeledStatement) {
            // lname is incremented when we get to the AST_Label
            var save_nesting = lname;
            descend();
            lname = save_nesting;
            return true;        // don't descend again in TreeWalker
        }
        if (node instanceof AST_Scope) {
            var p = tw.parent(), a = [];
            node.variables.each(function(symbol){
                if (options.except.indexOf(symbol.name) < 0) {
                    a.push(symbol);
                }
            });
            if (options.sort) a.sort(function(a, b){
                return b.references.length - a.references.length;
            });
            to_mangle.push.apply(to_mangle, a);
            return;
        }
        if (node instanceof AST_Label) {
            var name;
            do name = base54(++lname); while (!is_identifier(name));
            node.mangled_name = name;
            return true;
        }
        if (options.screw_ie8 && node instanceof AST_SymbolCatch) {
            to_mangle.push(node.definition());
            return;
        }
    });
    this.walk(tw);
    to_mangle.forEach(function(def){ def.mangle(options) });

    if (options.cache) {
        options.cache.cname = this.cname;
    }
});

AST_Toplevel.DEFMETHOD("compute_char_frequency", function(options){
    options = this._default_mangler_options(options);
    var tw = new TreeWalker(function(node){
        if (node instanceof AST_Constant)
            base54.consider(node.print_to_string());
        else if (node instanceof AST_Return)
            base54.consider("return");
        else if (node instanceof AST_Throw)
            base54.consider("throw");
        else if (node instanceof AST_Continue)
            base54.consider("continue");
        else if (node instanceof AST_Break)
            base54.consider("break");
        else if (node instanceof AST_Debugger)
            base54.consider("debugger");
        else if (node instanceof AST_Directive)
            base54.consider(node.value);
        else if (node instanceof AST_While)
            base54.consider("while");
        else if (node instanceof AST_Do)
            base54.consider("do while");
        else if (node instanceof AST_If) {
            base54.consider("if");
            if (node.alternative) base54.consider("else");
        }
        else if (node instanceof AST_Var)
            base54.consider("var");
        else if (node instanceof AST_Const)
            base54.consider("const");
        else if (node instanceof AST_Lambda)
            base54.consider("function");
        else if (node instanceof AST_For)
            base54.consider("fo" + "r");
        else if (node instanceof AST_ForIn)
            base54.consider("for in");
        else if (node instanceof AST_Switch)
            base54.consider("switch");
        else if (node instanceof AST_Case)
            base54.consider("case");
        else if (node instanceof AST_Default)
            base54.consider("default");
        else if (node instanceof AST_With)
            base54.consider("with");
        else if (node instanceof AST_ObjectSetter)
            base54.consider("set" + node.key);
        else if (node instanceof AST_ObjectGetter)
            base54.consider("get" + node.key);
        else if (node instanceof AST_ObjectKeyVal)
            base54.consider(node.key);
        else if (node instanceof AST_New)
            base54.consider("new");
        else if (node instanceof AST_This)
            base54.consider("this");
        else if (node instanceof AST_Try)
            base54.consider("try");
        else if (node instanceof AST_Catch)
            base54.consider("catch");
        else if (node instanceof AST_Finally)
            base54.consider("finally");
        else if (node instanceof AST_Symbol && node.unmangleable(options))
            base54.consider(node.name);
        else if (node instanceof AST_Unary || node instanceof AST_Binary)
            base54.consider(node.operator);
        else if (node instanceof AST_Dot)
            base54.consider(node.property);
    });
    this.walk(tw);
    base54.sort();
});

var base54 = (function() {
    var string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789";
    var chars, frequency;
    function reset() {
        frequency = Object.create(null);
        chars = string.split("").map(function(ch){ return ch.charCodeAt(0) });
        chars.forEach(function(ch){ frequency[ch] = 0 });
    }
    base54.consider = function(str){
        for (var i = str.length; --i >= 0;) {
            var code = str.charCodeAt(i);
            if (code in frequency) ++frequency[code];
        }
    };
    base54.sort = function() {
        chars = mergeSort(chars, function(a, b){
            if (is_digit(a) && !is_digit(b)) return 1;
            if (is_digit(b) && !is_digit(a)) return -1;
            return frequency[b] - frequency[a];
        });
    };
    base54.reset = reset;
    reset();
    base54.get = function(){ return chars };
    base54.freq = function(){ return frequency };
    function base54(num) {
        var ret = "", base = 54;
        num++;
        do {
            num--;
            ret += String.fromCharCode(chars[num % base]);
            num = Math.floor(num / base);
            base = 64;
        } while (num > 0);
        return ret;
    };
    return base54;
})();

AST_Toplevel.DEFMETHOD("scope_warnings", function(options){
    options = defaults(options, {
        undeclared       : false, // this makes a lot of noise
        unreferenced     : true,
        assign_to_global : true,
        func_arguments   : true,
        nested_defuns    : true,
        eval             : true
    });
    var tw = new TreeWalker(function(node){
        if (options.undeclared
            && node instanceof AST_SymbolRef
            && node.undeclared())
        {
            // XXX: this also warns about JS standard names,
            // i.e. Object, Array, parseInt etc.  Should add a list of
            // exceptions.
            AST_Node.warn("Undeclared symbol: {name} [{file}:{line},{col}]", {
                name: node.name,
                file: node.start.file,
                line: node.start.line,
                col: node.start.col
            });
        }
        if (options.assign_to_global)
        {
            var sym = null;
            if (node instanceof AST_Assign && node.left instanceof AST_SymbolRef)
                sym = node.left;
            else if (node instanceof AST_ForIn && node.init instanceof AST_SymbolRef)
                sym = node.init;
            if (sym
                && (sym.undeclared()
                    || (sym.global() && sym.scope !== sym.definition().scope))) {
                AST_Node.warn("{msg}: {name} [{file}:{line},{col}]", {
                    msg: sym.undeclared() ? "Accidental global?" : "Assignment to global",
                    name: sym.name,
                    file: sym.start.file,
                    line: sym.start.line,
                    col: sym.start.col
                });
            }
        }
        if (options.eval
            && node instanceof AST_SymbolRef
            && node.undeclared()
            && node.name == "eval") {
            AST_Node.warn("Eval is used [{file}:{line},{col}]", node.start);
        }
        if (options.unreferenced
            && (node instanceof AST_SymbolDeclaration || node instanceof AST_Label)
            && !(node instanceof AST_SymbolCatch)
            && node.unreferenced()) {
            AST_Node.warn("{type} {name} is declared but not referenced [{file}:{line},{col}]", {
                type: node instanceof AST_Label ? "Label" : "Symbol",
                name: node.name,
                file: node.start.file,
                line: node.start.line,
                col: node.start.col
            });
        }
        if (options.func_arguments
            && node instanceof AST_Lambda
            && node.uses_arguments) {
            AST_Node.warn("arguments used in function {name} [{file}:{line},{col}]", {
                name: node.name ? node.name.name : "anonymous",
                file: node.start.file,
                line: node.start.line,
                col: node.start.col
            });
        }
        if (options.nested_defuns
            && node instanceof AST_Defun
            && !(tw.parent() instanceof AST_Scope)) {
            AST_Node.warn("Function {name} declared in nested statement \"{type}\" [{file}:{line},{col}]", {
                name: node.name.name,
                type: tw.parent().TYPE,
                file: node.start.file,
                line: node.start.line,
                col: node.start.col
            });
        }
    });
    this.walk(tw);
});

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

function OutputStream(options) {

    options = defaults(options, {
        indent_start     : 0,
        indent_level     : 4,
        quote_keys       : false,
        space_colon      : true,
        ascii_only       : false,
        unescape_regexps : false,
        inline_script    : false,
        width            : 80,
        max_line_len     : 32000,
        beautify         : false,
        source_map       : null,
        bracketize       : false,
        semicolons       : true,
        comments         : false,
        shebang          : true,
        preserve_line    : false,
        screw_ie8        : false,
        preamble         : null,
        quote_style      : 0
    }, true);

    var indentation = 0;
    var current_col = 0;
    var current_line = 1;
    var current_pos = 0;
    var OUTPUT = "";

    function to_ascii(str, identifier) {
        return str.replace(/[\u0080-\uffff]/g, function(ch) {
            var code = ch.charCodeAt(0).toString(16);
            if (code.length <= 2 && !identifier) {
                while (code.length < 2) code = "0" + code;
                return "\\x" + code;
            } else {
                while (code.length < 4) code = "0" + code;
                return "\\u" + code;
            }
        });
    };

    function make_string(str, quote) {
        var dq = 0, sq = 0;
        str = str.replace(/[\\\b\f\n\r\v\t\x22\x27\u2028\u2029\0\ufeff]/g, function(s){
            switch (s) {
              case "\\": return "\\\\";
              case "\b": return "\\b";
              case "\f": return "\\f";
              case "\n": return "\\n";
              case "\r": return "\\r";
              case "\x0B": return options.screw_ie8 ? "\\v" : "\\x0B";
              case "\u2028": return "\\u2028";
              case "\u2029": return "\\u2029";
              case '"': ++dq; return '"';
              case "'": ++sq; return "'";
              case "\0": return "\\x00";
              case "\ufeff": return "\\ufeff";
            }
            return s;
        });
        function quote_single() {
            return "'" + str.replace(/\x27/g, "\\'") + "'";
        }
        function quote_double() {
            return '"' + str.replace(/\x22/g, '\\"') + '"';
        }
        if (options.ascii_only) str = to_ascii(str);
        switch (options.quote_style) {
          case 1:
            return quote_single();
          case 2:
            return quote_double();
          case 3:
            return quote == "'" ? quote_single() : quote_double();
          default:
            return dq > sq ? quote_single() : quote_double();
        }
    };

    function encode_string(str, quote) {
        var ret = make_string(str, quote);
        if (options.inline_script) {
            ret = ret.replace(/<\x2fscript([>\/\t\n\f\r ])/gi, "<\\/script$1");
            ret = ret.replace(/\x3c!--/g, "\\x3c!--");
            ret = ret.replace(/--\x3e/g, "--\\x3e");
        }
        return ret;
    };

    function make_name(name) {
        name = name.toString();
        if (options.ascii_only)
            name = to_ascii(name, true);
        return name;
    };

    function make_indent(back) {
        return repeat_string(" ", options.indent_start + indentation - back * options.indent_level);
    };

    /* -----[ beautification/minification ]----- */

    var might_need_space = false;
    var might_need_semicolon = false;
    var last = null;

    function last_char() {
        return last.charAt(last.length - 1);
    };

    function maybe_newline() {
        if (options.max_line_len && current_col > options.max_line_len)
            print("\n");
    };

    var requireSemicolonChars = makePredicate("( [ + * / - , .");

    function print(str) {
        str = String(str);
        var ch = str.charAt(0);
        if (might_need_semicolon) {
            might_need_semicolon = false;

            if ((!ch || ";}".indexOf(ch) < 0) && !/[;]$/.test(last)) {
                if (options.semicolons || requireSemicolonChars(ch)) {
                    OUTPUT += ";";
                    current_col++;
                    current_pos++;
                } else {
                    OUTPUT += "\n";
                    current_pos++;
                    current_line++;
                    current_col = 0;

                    if (/^\s+$/.test(str)) {
                        // reset the semicolon flag, since we didn't print one
                        // now and might still have to later
                        might_need_semicolon = true;
                    }
                }

                if (!options.beautify)
                    might_need_space = false;
            }
        }

        if (!options.beautify && options.preserve_line && stack[stack.length - 1]) {
            var target_line = stack[stack.length - 1].start.line;
            while (current_line < target_line) {
                OUTPUT += "\n";
                current_pos++;
                current_line++;
                current_col = 0;
                might_need_space = false;
            }
        }

        if (might_need_space) {
            var prev = last_char();
            if ((is_identifier_char(prev)
                 && (is_identifier_char(ch) || ch == "\\"))
                || (/^[\+\-\/]$/.test(ch) && ch == prev))
            {
                OUTPUT += " ";
                current_col++;
                current_pos++;
            }
            might_need_space = false;
        }
        var a = str.split(/\r?\n/), n = a.length - 1;
        current_line += n;
        if (n == 0) {
            current_col += a[n].length;
        } else {
            current_col = a[n].length;
        }
        current_pos += str.length;
        last = str;
        OUTPUT += str;
    };

    var space = options.beautify ? function() {
        print(" ");
    } : function() {
        might_need_space = true;
    };

    var indent = options.beautify ? function(half) {
        if (options.beautify) {
            print(make_indent(half ? 0.5 : 0));
        }
    } : noop;

    var with_indent = options.beautify ? function(col, cont) {
        if (col === true) col = next_indent();
        var save_indentation = indentation;
        indentation = col;
        var ret = cont();
        indentation = save_indentation;
        return ret;
    } : function(col, cont) { return cont() };

    var newline = options.beautify ? function() {
        print("\n");
    } : maybe_newline;

    var semicolon = options.beautify ? function() {
        print(";");
    } : function() {
        might_need_semicolon = true;
    };

    function force_semicolon() {
        might_need_semicolon = false;
        print(";");
    };

    function next_indent() {
        return indentation + options.indent_level;
    };

    function with_block(cont) {
        var ret;
        print("{");
        newline();
        with_indent(next_indent(), function(){
            ret = cont();
        });
        indent();
        print("}");
        return ret;
    };

    function with_parens(cont) {
        print("(");
        //XXX: still nice to have that for argument lists
        //var ret = with_indent(current_col, cont);
        var ret = cont();
        print(")");
        return ret;
    };

    function with_square(cont) {
        print("[");
        //var ret = with_indent(current_col, cont);
        var ret = cont();
        print("]");
        return ret;
    };

    function comma() {
        print(",");
        space();
    };

    function colon() {
        print(":");
        if (options.space_colon) space();
    };

    var add_mapping = options.source_map ? function(token, name) {
        try {
            if (token) options.source_map.add(
                token.file || "?",
                current_line, current_col,
                token.line, token.col,
                (!name && token.type == "name") ? token.value : name
            );
        } catch(ex) {
            AST_Node.warn("Couldn't figure out mapping for {file}:{line},{col} → {cline},{ccol} [{name}]", {
                file: token.file,
                line: token.line,
                col: token.col,
                cline: current_line,
                ccol: current_col,
                name: name || ""
            })
        }
    } : noop;

    function get() {
        return OUTPUT;
    };

    if (options.preamble) {
        print(options.preamble.replace(/\r\n?|[\n\u2028\u2029]|\s*$/g, "\n"));
    }

    var stack = [];
    return {
        get             : get,
        toString        : get,
        indent          : indent,
        indentation     : function() { return indentation },
        current_width   : function() { return current_col - indentation },
        should_break    : function() { return options.width && this.current_width() >= options.width },
        newline         : newline,
        print           : print,
        space           : space,
        comma           : comma,
        colon           : colon,
        last            : function() { return last },
        semicolon       : semicolon,
        force_semicolon : force_semicolon,
        to_ascii        : to_ascii,
        print_name      : function(name) { print(make_name(name)) },
        print_string    : function(str, quote) { print(encode_string(str, quote)) },
        next_indent     : next_indent,
        with_indent     : with_indent,
        with_block      : with_block,
        with_parens     : with_parens,
        with_square     : with_square,
        add_mapping     : add_mapping,
        option          : function(opt) { return options[opt] },
        line            : function() { return current_line },
        col             : function() { return current_col },
        pos             : function() { return current_pos },
        push_node       : function(node) { stack.push(node) },
        pop_node        : function() { return stack.pop() },
        stack           : function() { return stack },
        parent          : function(n) {
            return stack[stack.length - 2 - (n || 0)];
        }
    };

};

/* -----[ code generators ]----- */

(function(){

    /* -----[ utils ]----- */

    function DEFPRINT(nodetype, generator) {
        nodetype.DEFMETHOD("_codegen", generator);
    };

    var use_asm = false;

    AST_Node.DEFMETHOD("print", function(stream, force_parens){
        var self = this, generator = self._codegen, prev_use_asm = use_asm;
        if (self instanceof AST_Directive && self.value == "use asm") {
            use_asm = true;
        }
        function doit() {
            self.add_comments(stream);
            self.add_source_map(stream);
            generator(self, stream);
        }
        stream.push_node(self);
        if (force_parens || self.needs_parens(stream)) {
            stream.with_parens(doit);
        } else {
            doit();
        }
        stream.pop_node();
        if (self instanceof AST_Lambda) {
            use_asm = prev_use_asm;
        }
    });

    AST_Node.DEFMETHOD("print_to_string", function(options){
        var s = OutputStream(options);
        this.print(s);
        return s.get();
    });

    /* -----[ comments ]----- */

    AST_Node.DEFMETHOD("add_comments", function(output){
        var c = output.option("comments"), self = this;
        var start = self.start;
        if (start && !start._comments_dumped) {
            start._comments_dumped = true;
            var comments = start.comments_before || [];

            // XXX: ugly fix for https://github.com/mishoo/UglifyJS2/issues/112
            //               and https://github.com/mishoo/UglifyJS2/issues/372
            if (self instanceof AST_Exit && self.value) {
                self.value.walk(new TreeWalker(function(node){
                    if (node.start && node.start.comments_before) {
                        comments = comments.concat(node.start.comments_before);
                        node.start.comments_before = [];
                    }
                    if (node instanceof AST_Function ||
                        node instanceof AST_Array ||
                        node instanceof AST_Object)
                    {
                        return true; // don't go inside.
                    }
                }));
            }

            if (!c) {
                comments = comments.filter(function(comment) {
                    return comment.type == "comment5";
                });
            } else if (c.test) {
                comments = comments.filter(function(comment){
                    return comment.type == "comment5" || c.test(comment.value);
                });
            } else if (typeof c == "function") {
                comments = comments.filter(function(comment){
                    return comment.type == "comment5" || c(self, comment);
                });
            }

            // Keep single line comments after nlb, after nlb
            if (!output.option("beautify") && comments.length > 0 &&
                /comment[134]/.test(comments[0].type) &&
                output.col() !== 0 && comments[0].nlb)
            {
                output.print("\n");
            }

            comments.forEach(function(c){
                if (/comment[134]/.test(c.type)) {
                    output.print("//" + c.value + "\n");
                    output.indent();
                }
                else if (c.type == "comment2") {
                    output.print("/*" + c.value + "*/");
                    if (start.nlb) {
                        output.print("\n");
                        output.indent();
                    } else {
                        output.space();
                    }
                }
                else if (output.pos() === 0 && c.type == "comment5" && output.option("shebang")) {
                    output.print("#!" + c.value + "\n");
                    output.indent();
                }
            });
        }
    });

    /* -----[ PARENTHESES ]----- */

    function PARENS(nodetype, func) {
        if (Array.isArray(nodetype)) {
            nodetype.forEach(function(nodetype){
                PARENS(nodetype, func);
            });
        } else {
            nodetype.DEFMETHOD("needs_parens", func);
        }
    };

    PARENS(AST_Node, function(){
        return false;
    });

    // a function expression needs parens around it when it's provably
    // the first token to appear in a statement.
    PARENS(AST_Function, function(output){
        return first_in_statement(output);
    });

    // same goes for an object literal, because otherwise it would be
    // interpreted as a block of code.
    PARENS(AST_Object, function(output){
        return first_in_statement(output);
    });

    PARENS([ AST_Unary, AST_Undefined ], function(output){
        var p = output.parent();
        return p instanceof AST_PropAccess && p.expression === this;
    });

    PARENS(AST_Seq, function(output){
        var p = output.parent();
        return p instanceof AST_Call             // (foo, bar)() or foo(1, (2, 3), 4)
            || p instanceof AST_Unary            // !(foo, bar, baz)
            || p instanceof AST_Binary           // 1 + (2, 3) + 4 ==> 8
            || p instanceof AST_VarDef           // var a = (1, 2), b = a + a; ==> b == 4
            || p instanceof AST_PropAccess       // (1, {foo:2}).foo or (1, {foo:2})["foo"] ==> 2
            || p instanceof AST_Array            // [ 1, (2, 3), 4 ] ==> [ 1, 3, 4 ]
            || p instanceof AST_ObjectProperty   // { foo: (1, 2) }.foo ==> 2
            || p instanceof AST_Conditional      /* (false, true) ? (a = 10, b = 20) : (c = 30)
                                                  * ==> 20 (side effect, set a := 10 and b := 20) */
        ;
    });

    PARENS(AST_Binary, function(output){
        var p = output.parent();
        // (foo && bar)()
        if (p instanceof AST_Call && p.expression === this)
            return true;
        // typeof (foo && bar)
        if (p instanceof AST_Unary)
            return true;
        // (foo && bar)["prop"], (foo && bar).prop
        if (p instanceof AST_PropAccess && p.expression === this)
            return true;
        // this deals with precedence: 3 * (2 + 1)
        if (p instanceof AST_Binary) {
            var po = p.operator, pp = PRECEDENCE[po];
            var so = this.operator, sp = PRECEDENCE[so];
            if (pp > sp
                || (pp == sp
                    && this === p.right)) {
                return true;
            }
        }
    });

    PARENS(AST_PropAccess, function(output){
        var p = output.parent();
        if (p instanceof AST_New && p.expression === this) {
            // i.e. new (foo.bar().baz)
            //
            // if there's one call into this subtree, then we need
            // parens around it too, otherwise the call will be
            // interpreted as passing the arguments to the upper New
            // expression.
            try {
                this.walk(new TreeWalker(function(node){
                    if (node instanceof AST_Call) throw p;
                }));
            } catch(ex) {
                if (ex !== p) throw ex;
                return true;
            }
        }
    });

    PARENS(AST_Call, function(output){
        var p = output.parent(), p1;
        if (p instanceof AST_New && p.expression === this)
            return true;

        // workaround for Safari bug.
        // https://bugs.webkit.org/show_bug.cgi?id=123506
        return this.expression instanceof AST_Function
            && p instanceof AST_PropAccess
            && p.expression === this
            && (p1 = output.parent(1)) instanceof AST_Assign
            && p1.left === p;
    });

    PARENS(AST_New, function(output){
        var p = output.parent();
        if (no_constructor_parens(this, output)
            && (p instanceof AST_PropAccess // (new Date).getTime(), (new Date)["getTime"]()
                || p instanceof AST_Call && p.expression === this)) // (new foo)(bar)
            return true;
    });

    PARENS(AST_Number, function(output){
        var p = output.parent();
        if (this.getValue() < 0 && p instanceof AST_PropAccess && p.expression === this)
            return true;
    });

    PARENS([ AST_Assign, AST_Conditional ], function (output){
        var p = output.parent();
        // !(a = false) → true
        if (p instanceof AST_Unary)
            return true;
        // 1 + (a = 2) + 3 → 6, side effect setting a = 2
        if (p instanceof AST_Binary && !(p instanceof AST_Assign))
            return true;
        // (a = func)() —or— new (a = Object)()
        if (p instanceof AST_Call && p.expression === this)
            return true;
        // (a = foo) ? bar : baz
        if (p instanceof AST_Conditional && p.condition === this)
            return true;
        // (a = foo)["prop"] —or— (a = foo).prop
        if (p instanceof AST_PropAccess && p.expression === this)
            return true;
    });

    /* -----[ PRINTERS ]----- */

    DEFPRINT(AST_Directive, function(self, output){
        output.print_string(self.value, self.quote);
        output.semicolon();
    });
    DEFPRINT(AST_Debugger, function(self, output){
        output.print("debugger");
        output.semicolon();
    });

    /* -----[ statements ]----- */

    function display_body(body, is_toplevel, output) {
        var last = body.length - 1;
        body.forEach(function(stmt, i){
            if (!(stmt instanceof AST_EmptyStatement)) {
                output.indent();
                stmt.print(output);
                if (!(i == last && is_toplevel)) {
                    output.newline();
                    if (is_toplevel) output.newline();
                }
            }
        });
    };

    AST_StatementWithBody.DEFMETHOD("_do_print_body", function(output){
        force_statement(this.body, output);
    });

    DEFPRINT(AST_Statement, function(self, output){
        self.body.print(output);
        output.semicolon();
    });
    DEFPRINT(AST_Toplevel, function(self, output){
        display_body(self.body, true, output);
        output.print("");
    });
    DEFPRINT(AST_LabeledStatement, function(self, output){
        self.label.print(output);
        output.colon();
        self.body.print(output);
    });
    DEFPRINT(AST_SimpleStatement, function(self, output){
        self.body.print(output);
        output.semicolon();
    });
    function print_bracketed(body, output) {
        if (body.length > 0) output.with_block(function(){
            display_body(body, false, output);
        });
        else output.print("{}");
    };
    DEFPRINT(AST_BlockStatement, function(self, output){
        print_bracketed(self.body, output);
    });
    DEFPRINT(AST_EmptyStatement, function(self, output){
        output.semicolon();
    });
    DEFPRINT(AST_Do, function(self, output){
        output.print("do");
        output.space();
        self._do_print_body(output);
        output.space();
        output.print("while");
        output.space();
        output.with_parens(function(){
            self.condition.print(output);
        });
        output.semicolon();
    });
    DEFPRINT(AST_While, function(self, output){
        output.print("while");
        output.space();
        output.with_parens(function(){
            self.condition.print(output);
        });
        output.space();
        self._do_print_body(output);
    });
    DEFPRINT(AST_For, function(self, output){
        output.print("fo" + "r");
        output.space();
        output.with_parens(function(){
            if (self.init && !(self.init instanceof AST_EmptyStatement)) {
                if (self.init instanceof AST_Definitions) {
                    self.init.print(output);
                } else {
                    parenthesize_for_noin(self.init, output, true);
                }
                output.print(";");
                output.space();
            } else {
                output.print(";");
            }
            if (self.condition) {
                self.condition.print(output);
                output.print(";");
                output.space();
            } else {
                output.print(";");
            }
            if (self.step) {
                self.step.print(output);
            }
        });
        output.space();
        self._do_print_body(output);
    });
    DEFPRINT(AST_ForIn, function(self, output){
        output.print("fo" + "r");
        output.space();
        output.with_parens(function(){
            self.init.print(output);
            output.space();
            output.print("in");
            output.space();
            self.object.print(output);
        });
        output.space();
        self._do_print_body(output);
    });
    DEFPRINT(AST_With, function(self, output){
        output.print("with");
        output.space();
        output.with_parens(function(){
            self.expression.print(output);
        });
        output.space();
        self._do_print_body(output);
    });

    /* -----[ functions ]----- */
    AST_Lambda.DEFMETHOD("_do_print", function(output, nokeyword){
        var self = this;
        if (!nokeyword) {
            output.print("function");
        }
        if (self.name) {
            output.space();
            self.name.print(output);
        }
        output.with_parens(function(){
            self.argnames.forEach(function(arg, i){
                if (i) output.comma();
                arg.print(output);
            });
        });
        output.space();
        print_bracketed(self.body, output);
    });
    DEFPRINT(AST_Lambda, function(self, output){
        self._do_print(output);
    });

    /* -----[ exits ]----- */
    AST_Exit.DEFMETHOD("_do_print", function(output, kind){
        output.print(kind);
        if (this.value) {
            output.space();
            this.value.print(output);
        }
        output.semicolon();
    });
    DEFPRINT(AST_Return, function(self, output){
        self._do_print(output, "return");
    });
    DEFPRINT(AST_Throw, function(self, output){
        self._do_print(output, "throw");
    });

    /* -----[ loop control ]----- */
    AST_LoopControl.DEFMETHOD("_do_print", function(output, kind){
        output.print(kind);
        if (this.label) {
            output.space();
            this.label.print(output);
        }
        output.semicolon();
    });
    DEFPRINT(AST_Break, function(self, output){
        self._do_print(output, "break");
    });
    DEFPRINT(AST_Continue, function(self, output){
        self._do_print(output, "continue");
    });

    /* -----[ if ]----- */
    function make_then(self, output) {
        if (output.option("bracketize")) {
            make_block(self.body, output);
            return;
        }
        // The squeezer replaces "block"-s that contain only a single
        // statement with the statement itself; technically, the AST
        // is correct, but this can create problems when we output an
        // IF having an ELSE clause where the THEN clause ends in an
        // IF *without* an ELSE block (then the outer ELSE would refer
        // to the inner IF).  This function checks for this case and
        // adds the block brackets if needed.
        if (!self.body)
            return output.force_semicolon();
        if (self.body instanceof AST_Do
            && !output.option("screw_ie8")) {
            // https://github.com/mishoo/UglifyJS/issues/#issue/57 IE
            // croaks with "syntax error" on code like this: if (foo)
            // do ... while(cond); else ...  we need block brackets
            // around do/while
            make_block(self.body, output);
            return;
        }
        var b = self.body;
        while (true) {
            if (b instanceof AST_If) {
                if (!b.alternative) {
                    make_block(self.body, output);
                    return;
                }
                b = b.alternative;
            }
            else if (b instanceof AST_StatementWithBody) {
                b = b.body;
            }
            else break;
        }
        force_statement(self.body, output);
    };
    DEFPRINT(AST_If, function(self, output){
        output.print("if");
        output.space();
        output.with_parens(function(){
            self.condition.print(output);
        });
        output.space();
        if (self.alternative) {
            make_then(self, output);
            output.space();
            output.print("else");
            output.space();
            force_statement(self.alternative, output);
        } else {
            self._do_print_body(output);
        }
    });

    /* -----[ switch ]----- */
    DEFPRINT(AST_Switch, function(self, output){
        output.print("switch");
        output.space();
        output.with_parens(function(){
            self.expression.print(output);
        });
        output.space();
        if (self.body.length > 0) output.with_block(function(){
            self.body.forEach(function(stmt, i){
                if (i) output.newline();
                output.indent(true);
                stmt.print(output);
            });
        });
        else output.print("{}");
    });
    AST_SwitchBranch.DEFMETHOD("_do_print_body", function(output){
        if (this.body.length > 0) {
            output.newline();
            this.body.forEach(function(stmt){
                output.indent();
                stmt.print(output);
                output.newline();
            });
        }
    });
    DEFPRINT(AST_Default, function(self, output){
        output.print("default:");
        self._do_print_body(output);
    });
    DEFPRINT(AST_Case, function(self, output){
        output.print("case");
        output.space();
        self.expression.print(output);
        output.print(":");
        self._do_print_body(output);
    });

    /* -----[ exceptions ]----- */
    DEFPRINT(AST_Try, function(self, output){
        output.print("try");
        output.space();
        print_bracketed(self.body, output);
        if (self.bcatch) {
            output.space();
            self.bcatch.print(output);
        }
        if (self.bfinally) {
            output.space();
            self.bfinally.print(output);
        }
    });
    DEFPRINT(AST_Catch, function(self, output){
        output.print("catch");
        output.space();
        output.with_parens(function(){
            self.argname.print(output);
        });
        output.space();
        print_bracketed(self.body, output);
    });
    DEFPRINT(AST_Finally, function(self, output){
        output.print("finally");
        output.space();
        print_bracketed(self.body, output);
    });

    /* -----[ var/const ]----- */
    AST_Definitions.DEFMETHOD("_do_print", function(output, kind){
        output.print(kind);
        output.space();
        this.definitions.forEach(function(def, i){
            if (i) output.comma();
            def.print(output);
        });
        var p = output.parent();
        var in_for = p instanceof AST_For || p instanceof AST_ForIn;
        var avoid_semicolon = in_for && p.init === this;
        if (!avoid_semicolon)
            output.semicolon();
    });
    DEFPRINT(AST_Var, function(self, output){
        self._do_print(output, "var");
    });
    DEFPRINT(AST_Const, function(self, output){
        self._do_print(output, "const");
    });

    function parenthesize_for_noin(node, output, noin) {
        if (!noin) node.print(output);
        else try {
            // need to take some precautions here:
            //    https://github.com/mishoo/UglifyJS2/issues/60
            node.walk(new TreeWalker(function(node){
                if (node instanceof AST_Binary && node.operator == "in")
                    throw output;
            }));
            node.print(output);
        } catch(ex) {
            if (ex !== output) throw ex;
            node.print(output, true);
        }
    };

    DEFPRINT(AST_VarDef, function(self, output){
        self.name.print(output);
        if (self.value) {
            output.space();
            output.print("=");
            output.space();
            var p = output.parent(1);
            var noin = p instanceof AST_For || p instanceof AST_ForIn;
            parenthesize_for_noin(self.value, output, noin);
        }
    });

    /* -----[ other expressions ]----- */
    DEFPRINT(AST_Call, function(self, output){
        self.expression.print(output);
        if (self instanceof AST_New && no_constructor_parens(self, output))
            return;
        output.with_parens(function(){
            self.args.forEach(function(expr, i){
                if (i) output.comma();
                expr.print(output);
            });
        });
    });
    DEFPRINT(AST_New, function(self, output){
        output.print("new");
        output.space();
        AST_Call.prototype._codegen(self, output);
    });

    AST_Seq.DEFMETHOD("_do_print", function(output){
        this.car.print(output);
        if (this.cdr) {
            output.comma();
            if (output.should_break()) {
                output.newline();
                output.indent();
            }
            this.cdr.print(output);
        }
    });
    DEFPRINT(AST_Seq, function(self, output){
        self._do_print(output);
        // var p = output.parent();
        // if (p instanceof AST_Statement) {
        //     output.with_indent(output.next_indent(), function(){
        //         self._do_print(output);
        //     });
        // } else {
        //     self._do_print(output);
        // }
    });
    DEFPRINT(AST_Dot, function(self, output){
        var expr = self.expression;
        expr.print(output);
        if (expr instanceof AST_Number && expr.getValue() >= 0) {
            if (!/[xa-f.]/i.test(output.last())) {
                output.print(".");
            }
        }
        output.print(".");
        // the name after dot would be mapped about here.
        output.add_mapping(self.end);
        output.print_name(self.property);
    });
    DEFPRINT(AST_Sub, function(self, output){
        self.expression.print(output);
        output.print("[");
        self.property.print(output);
        output.print("]");
    });
    DEFPRINT(AST_UnaryPrefix, function(self, output){
        var op = self.operator;
        output.print(op);
        if (/^[a-z]/i.test(op)
            || (/[+-]$/.test(op)
                && self.expression instanceof AST_UnaryPrefix
                && /^[+-]/.test(self.expression.operator))) {
            output.space();
        }
        self.expression.print(output);
    });
    DEFPRINT(AST_UnaryPostfix, function(self, output){
        self.expression.print(output);
        output.print(self.operator);
    });
    DEFPRINT(AST_Binary, function(self, output){
        var op = self.operator;
        self.left.print(output);
        if (op[0] == ">" /* ">>" ">>>" ">" ">=" */
            && self.left instanceof AST_UnaryPostfix
            && self.left.operator == "--") {
            // space is mandatory to avoid outputting -->
            output.print(" ");
        } else {
            // the space is optional depending on "beautify"
            output.space();
        }
        output.print(op);
        if ((op == "<" || op == "<<")
            && self.right instanceof AST_UnaryPrefix
            && self.right.operator == "!"
            && self.right.expression instanceof AST_UnaryPrefix
            && self.right.expression.operator == "--") {
            // space is mandatory to avoid outputting <!--
            output.print(" ");
        } else {
            // the space is optional depending on "beautify"
            output.space();
        }
        self.right.print(output);
    });
    DEFPRINT(AST_Conditional, function(self, output){
        self.condition.print(output);
        output.space();
        output.print("?");
        output.space();
        self.consequent.print(output);
        output.space();
        output.colon();
        self.alternative.print(output);
    });

    /* -----[ literals ]----- */
    DEFPRINT(AST_Array, function(self, output){
        output.with_square(function(){
            var a = self.elements, len = a.length;
            if (len > 0) output.space();
            a.forEach(function(exp, i){
                if (i) output.comma();
                exp.print(output);
                // If the final element is a hole, we need to make sure it
                // doesn't look like a trailing comma, by inserting an actual
                // trailing comma.
                if (i === len - 1 && exp instanceof AST_Hole)
                  output.comma();
            });
            if (len > 0) output.space();
        });
    });
    DEFPRINT(AST_Object, function(self, output){
        if (self.properties.length > 0) output.with_block(function(){
            self.properties.forEach(function(prop, i){
                if (i) {
                    output.print(",");
                    output.newline();
                }
                output.indent();
                prop.print(output);
            });
            output.newline();
        });
        else output.print("{}");
    });
    DEFPRINT(AST_ObjectKeyVal, function(self, output){
        var key = self.key;
        var quote = self.quote;
        if (output.option("quote_keys")) {
            output.print_string(key + "");
        } else if ((typeof key == "number"
                    || !output.option("beautify")
                    && +key + "" == key)
                   && parseFloat(key) >= 0) {
            output.print(make_num(key));
        } else if (RESERVED_WORDS(key) ? output.option("screw_ie8") : is_identifier_string(key)) {
            output.print_name(key);
        } else {
            output.print_string(key, quote);
        }
        output.colon();
        self.value.print(output);
    });
    DEFPRINT(AST_ObjectSetter, function(self, output){
        output.print("set");
        output.space();
        self.key.print(output);
        self.value._do_print(output, true);
    });
    DEFPRINT(AST_ObjectGetter, function(self, output){
        output.print("get");
        output.space();
        self.key.print(output);
        self.value._do_print(output, true);
    });
    DEFPRINT(AST_Symbol, function(self, output){
        var def = self.definition();
        output.print_name(def ? def.mangled_name || def.name : self.name);
    });
    DEFPRINT(AST_Undefined, function(self, output){
        output.print("void 0");
    });
    DEFPRINT(AST_Hole, noop);
    DEFPRINT(AST_Infinity, function(self, output){
        output.print("Infinity");
    });
    DEFPRINT(AST_NaN, function(self, output){
        output.print("NaN");
    });
    DEFPRINT(AST_This, function(self, output){
        output.print("this");
    });
    DEFPRINT(AST_Constant, function(self, output){
        output.print(self.getValue());
    });
    DEFPRINT(AST_String, function(self, output){
        output.print_string(self.getValue(), self.quote);
    });
    DEFPRINT(AST_Number, function(self, output){
        if (use_asm && self.start.raw != null) {
            output.print(self.start.raw);
        } else {
            output.print(make_num(self.getValue()));
        }
    });

    function regexp_safe_literal(code) {
        return [
            0x5c   , // \
            0x2f   , // /
            0x2e   , // .
            0x2b   , // +
            0x2a   , // *
            0x3f   , // ?
            0x28   , // (
            0x29   , // )
            0x5b   , // [
            0x5d   , // ]
            0x7b   , // {
            0x7d   , // }
            0x24   , // $
            0x5e   , // ^
            0x3a   , // :
            0x7c   , // |
            0x21   , // !
            0x0a   , // \n
            0x0d   , // \r
            0x00   , // \0
            0xfeff , // Unicode BOM
            0x2028 , // unicode "line separator"
            0x2029 , // unicode "paragraph separator"
        ].indexOf(code) < 0;
    };

    DEFPRINT(AST_RegExp, function(self, output){
        var str = self.getValue().toString();
        if (output.option("ascii_only")) {
            str = output.to_ascii(str);
        } else if (output.option("unescape_regexps")) {
            str = str.split("\\\\").map(function(str){
                return str.replace(/\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}/g, function(s){
                    var code = parseInt(s.substr(2), 16);
                    return regexp_safe_literal(code) ? String.fromCharCode(code) : s;
                });
            }).join("\\\\");
        }
        output.print(str);
        var p = output.parent();
        if (p instanceof AST_Binary && /^in/.test(p.operator) && p.left === self)
            output.print(" ");
    });

    function force_statement(stat, output) {
        if (output.option("bracketize")) {
            if (!stat || stat instanceof AST_EmptyStatement)
                output.print("{}");
            else if (stat instanceof AST_BlockStatement)
                stat.print(output);
            else output.with_block(function(){
                output.indent();
                stat.print(output);
                output.newline();
            });
        } else {
            if (!stat || stat instanceof AST_EmptyStatement)
                output.force_semicolon();
            else
                stat.print(output);
        }
    };

    // return true if the node at the top of the stack (that means the
    // innermost node in the current output) is lexically the first in
    // a statement.
    function first_in_statement(output) {
        var a = output.stack(), i = a.length, node = a[--i], p = a[--i];
        while (i > 0) {
            if (p instanceof AST_Statement && p.body === node)
                return true;
            if ((p instanceof AST_Seq           && p.car === node        ) ||
                (p instanceof AST_Call          && p.expression === node && !(p instanceof AST_New) ) ||
                (p instanceof AST_Dot           && p.expression === node ) ||
                (p instanceof AST_Sub           && p.expression === node ) ||
                (p instanceof AST_Conditional   && p.condition === node  ) ||
                (p instanceof AST_Binary        && p.left === node       ) ||
                (p instanceof AST_UnaryPostfix  && p.expression === node ))
            {
                node = p;
                p = a[--i];
            } else {
                return false;
            }
        }
    };

    // self should be AST_New.  decide if we want to show parens or not.
    function no_constructor_parens(self, output) {
        return self.args.length == 0 && !output.option("beautify");
    };

    function best_of(a) {
        var best = a[0], len = best.length;
        for (var i = 1; i < a.length; ++i) {
            if (a[i].length < len) {
                best = a[i];
                len = best.length;
            }
        }
        return best;
    };

    function make_num(num) {
        var str = num.toString(10), a = [ str.replace(/^0\./, ".").replace('e+', 'e') ], m;
        if (Math.floor(num) === num) {
            if (num >= 0) {
                a.push("0x" + num.toString(16).toLowerCase(), // probably pointless
                       "0" + num.toString(8)); // same.
            } else {
                a.push("-0x" + (-num).toString(16).toLowerCase(), // probably pointless
                       "-0" + (-num).toString(8)); // same.
            }
            if ((m = /^(.*?)(0+)$/.exec(num))) {
                a.push(m[1] + "e" + m[2].length);
            }
        } else if ((m = /^0?\.(0+)(.*)$/.exec(num))) {
            a.push(m[2] + "e-" + (m[1].length + m[2].length),
                   str.substr(str.indexOf(".")));
        }
        return best_of(a);
    };

    function make_block(stmt, output) {
        if (stmt instanceof AST_BlockStatement) {
            stmt.print(output);
            return;
        }
        output.with_block(function(){
            output.indent();
            stmt.print(output);
            output.newline();
        });
    };

    /* -----[ source map generators ]----- */

    function DEFMAP(nodetype, generator) {
        nodetype.DEFMETHOD("add_source_map", function(stream){
            generator(this, stream);
        });
    };

    // We could easily add info for ALL nodes, but it seems to me that
    // would be quite wasteful, hence this noop in the base class.
    DEFMAP(AST_Node, noop);

    function basic_sourcemap_gen(self, output) {
        output.add_mapping(self.start);
    };

    // XXX: I'm not exactly sure if we need it for all of these nodes,
    // or if we should add even more.

    DEFMAP(AST_Directive, basic_sourcemap_gen);
    DEFMAP(AST_Debugger, basic_sourcemap_gen);
    DEFMAP(AST_Symbol, basic_sourcemap_gen);
    DEFMAP(AST_Jump, basic_sourcemap_gen);
    DEFMAP(AST_StatementWithBody, basic_sourcemap_gen);
    DEFMAP(AST_LabeledStatement, noop); // since the label symbol will mark it
    DEFMAP(AST_Lambda, basic_sourcemap_gen);
    DEFMAP(AST_Switch, basic_sourcemap_gen);
    DEFMAP(AST_SwitchBranch, basic_sourcemap_gen);
    DEFMAP(AST_BlockStatement, basic_sourcemap_gen);
    DEFMAP(AST_Toplevel, noop);
    DEFMAP(AST_New, basic_sourcemap_gen);
    DEFMAP(AST_Try, basic_sourcemap_gen);
    DEFMAP(AST_Catch, basic_sourcemap_gen);
    DEFMAP(AST_Finally, basic_sourcemap_gen);
    DEFMAP(AST_Definitions, basic_sourcemap_gen);
    DEFMAP(AST_Constant, basic_sourcemap_gen);
    DEFMAP(AST_ObjectSetter, function(self, output){
        output.add_mapping(self.start, self.key.name);
    });
    DEFMAP(AST_ObjectGetter, function(self, output){
        output.add_mapping(self.start, self.key.name);
    });
    DEFMAP(AST_ObjectProperty, function(self, output){
        output.add_mapping(self.start, self.key);
    });

})();

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

function Compressor(options, false_by_default) {
    if (!(this instanceof Compressor))
        return new Compressor(options, false_by_default);
    TreeTransformer.call(this, this.before, this.after);
    this.options = defaults(options, {
        sequences     : !false_by_default,
        properties    : !false_by_default,
        dead_code     : !false_by_default,
        drop_debugger : !false_by_default,
        unsafe        : false,
        unsafe_comps  : false,
        conditionals  : !false_by_default,
        comparisons   : !false_by_default,
        evaluate      : !false_by_default,
        booleans      : !false_by_default,
        loops         : !false_by_default,
        unused        : !false_by_default,
        hoist_funs    : !false_by_default,
        keep_fargs    : true,
        keep_fnames   : false,
        hoist_vars    : false,
        if_return     : !false_by_default,
        join_vars     : !false_by_default,
        collapse_vars : false,
        cascade       : !false_by_default,
        side_effects  : !false_by_default,
        pure_getters  : false,
        pure_funcs    : null,
        negate_iife   : !false_by_default,
        screw_ie8     : false,
        drop_console  : false,
        angular       : false,

        warnings      : true,
        global_defs   : {}
    }, true);
};

Compressor.prototype = new TreeTransformer;
merge(Compressor.prototype, {
    option: function(key) { return this.options[key] },
    warn: function() {
        if (this.options.warnings)
            AST_Node.warn.apply(AST_Node, arguments);
    },
    before: function(node, descend, in_list) {
        if (node._squeezed) return node;
        var was_scope = false;
        if (node instanceof AST_Scope) {
            node = node.hoist_declarations(this);
            was_scope = true;
        }
        descend(node, this);
        node = node.optimize(this);
        if (was_scope && node instanceof AST_Scope) {
            node.drop_unused(this);
            descend(node, this);
        }
        node._squeezed = true;
        return node;
    }
});

(function(){

    function OPT(node, optimizer) {
        node.DEFMETHOD("optimize", function(compressor){
            var self = this;
            if (self._optimized) return self;
            if (compressor.has_directive("use asm")) return self;
            var opt = optimizer(self, compressor);
            opt._optimized = true;
            if (opt === self) return opt;
            return opt.transform(compressor);
        });
    };

    OPT(AST_Node, function(self, compressor){
        return self;
    });

    AST_Node.DEFMETHOD("equivalent_to", function(node){
        // XXX: this is a rather expensive way to test two node's equivalence:
        return this.print_to_string() == node.print_to_string();
    });

    function make_node(ctor, orig, props) {
        if (!props) props = {};
        if (orig) {
            if (!props.start) props.start = orig.start;
            if (!props.end) props.end = orig.end;
        }
        return new ctor(props);
    };

    function make_node_from_constant(compressor, val, orig) {
        // XXX: WIP.
        // if (val instanceof AST_Node) return val.transform(new TreeTransformer(null, function(node){
        //     if (node instanceof AST_SymbolRef) {
        //         var scope = compressor.find_parent(AST_Scope);
        //         var def = scope.find_variable(node);
        //         node.thedef = def;
        //         return node;
        //     }
        // })).transform(compressor);

        if (val instanceof AST_Node) return val.transform(compressor);
        switch (typeof val) {
          case "string":
            return make_node(AST_String, orig, {
                value: val
            }).optimize(compressor);
          case "number":
            return make_node(isNaN(val) ? AST_NaN : AST_Number, orig, {
                value: val
            }).optimize(compressor);
          case "boolean":
            return make_node(val ? AST_True : AST_False, orig).optimize(compressor);
          case "undefined":
            return make_node(AST_Undefined, orig).optimize(compressor);
          default:
            if (val === null) {
                return make_node(AST_Null, orig, { value: null }).optimize(compressor);
            }
            if (val instanceof RegExp) {
                return make_node(AST_RegExp, orig, { value: val }).optimize(compressor);
            }
            throw new Error(string_template("Can't handle constant of type: {type}", {
                type: typeof val
            }));
        }
    };

    // we shouldn't compress (1,func)(something) to
    // func(something) because that changes the meaning of
    // the func (becomes lexical instead of global).
    function maintain_this_binding(parent, orig, val) {
        if (parent instanceof AST_Call && parent.expression === orig) {
            if (val instanceof AST_PropAccess || val instanceof AST_SymbolRef && val.name === "eval") {
                return make_node(AST_Seq, orig, {
                    car: make_node(AST_Number, orig, {
                        value: 0
                    }),
                    cdr: val
                });
            }
        }
        return val;
    }

    function as_statement_array(thing) {
        if (thing === null) return [];
        if (thing instanceof AST_BlockStatement) return thing.body;
        if (thing instanceof AST_EmptyStatement) return [];
        if (thing instanceof AST_Statement) return [ thing ];
        throw new Error("Can't convert thing to statement array");
    };

    function is_empty(thing) {
        if (thing === null) return true;
        if (thing instanceof AST_EmptyStatement) return true;
        if (thing instanceof AST_BlockStatement) return thing.body.length == 0;
        return false;
    };

    function loop_body(x) {
        if (x instanceof AST_Switch) return x;
        if (x instanceof AST_For || x instanceof AST_ForIn || x instanceof AST_DWLoop) {
            return (x.body instanceof AST_BlockStatement ? x.body : x);
        }
        return x;
    };

    function tighten_body(statements, compressor) {
        var CHANGED, max_iter = 10;
        do {
            CHANGED = false;
            if (compressor.option("angular")) {
                statements = process_for_angular(statements);
            }
            statements = eliminate_spurious_blocks(statements);
            if (compressor.option("dead_code")) {
                statements = eliminate_dead_code(statements, compressor);
            }
            if (compressor.option("if_return")) {
                statements = handle_if_return(statements, compressor);
            }
            if (compressor.option("sequences")) {
                statements = sequencesize(statements, compressor);
            }
            if (compressor.option("join_vars")) {
                statements = join_consecutive_vars(statements, compressor);
            }
            if (compressor.option("collapse_vars")) {
                statements = collapse_single_use_vars(statements, compressor);
            }
        } while (CHANGED && max_iter-- > 0);

        if (compressor.option("negate_iife")) {
            negate_iifes(statements, compressor);
        }

        return statements;

        function collapse_single_use_vars(statements, compressor) {
            // Iterate statements backwards looking for a statement with a var/const
            // declaration immediately preceding it. Grab the rightmost var definition
            // and if it has exactly one reference then attempt to replace its reference
            // in the statement with the var value and then erase the var definition.

            var self = compressor.self();
            var var_defs_removed = false;
            for (var stat_index = statements.length; --stat_index >= 0;) {
                var stat = statements[stat_index];
                if (stat instanceof AST_Definitions) continue;

                // Process child blocks of statement if present.
                [stat, stat.body, stat.alternative, stat.bcatch, stat.bfinally].forEach(function(node) {
                    node && node.body && collapse_single_use_vars(node.body, compressor);
                });

                // The variable definition must precede a statement.
                if (stat_index <= 0) break;
                var prev_stat_index = stat_index - 1;
                var prev_stat = statements[prev_stat_index];
                if (!(prev_stat instanceof AST_Definitions)) continue;
                var var_defs = prev_stat.definitions;
                if (var_defs == null) continue;

                var var_names_seen = {};
                var side_effects_encountered = false;
                var lvalues_encountered = false;
                var lvalues = {};

                // Scan variable definitions from right to left.
                for (var var_defs_index = var_defs.length; --var_defs_index >= 0;) {

                    // Obtain var declaration and var name with basic sanity check.
                    var var_decl = var_defs[var_defs_index];
                    if (var_decl.value == null) break;
                    var var_name = var_decl.name.name;
                    if (!var_name || !var_name.length) break;

                    // Bail if we've seen a var definition of same name before.
                    if (var_name in var_names_seen) break;
                    var_names_seen[var_name] = true;

                    // Only interested in cases with just one reference to the variable.
                    var def = self.find_variable && self.find_variable(var_name);
                    if (!def || !def.references || def.references.length !== 1 || var_name == "arguments") {
                        side_effects_encountered = true;
                        continue;
                    }
                    var ref = def.references[0];

                    // Don't replace ref if eval() or with statement in scope.
                    if (ref.scope.uses_eval || ref.scope.uses_with) break;

                    // Constant single use vars can be replaced in any scope.
                    if (var_decl.value.is_constant(compressor)) {
                        var ctt = new TreeTransformer(function(node) {
                            if (node === ref)
                                return replace_var(node, ctt.parent(), true);
                        });
                        stat.transform(ctt);
                        continue;
                    }

                    // Restrict var replacement to constants if side effects encountered.
                    if (side_effects_encountered |= lvalues_encountered) continue;

                    // Non-constant single use vars can only be replaced in same scope.
                    if (ref.scope !== self) {
                        side_effects_encountered |= var_decl.value.has_side_effects(compressor);
                        continue;
                    }

                    // Detect lvalues in var value.
                    var tw = new TreeWalker(function(node){
                        if (node instanceof AST_SymbolRef && is_lvalue(node, tw.parent())) {
                            lvalues[node.name] = lvalues_encountered = true;
                        }
                    });
                    var_decl.value.walk(tw);

                    // Replace the non-constant single use var in statement if side effect free.
                    var unwind = false;
                    var tt = new TreeTransformer(
                        function preorder(node) {
                            if (unwind) return node;
                            var parent = tt.parent();
                            if (node instanceof AST_Lambda
                                || node instanceof AST_Try
                                || node instanceof AST_With
                                || node instanceof AST_Case
                                || node instanceof AST_IterationStatement
                                || (parent instanceof AST_If          && node !== parent.condition)
                                || (parent instanceof AST_Conditional && node !== parent.condition)
                                || (parent instanceof AST_Binary
                                    && (parent.operator == "&&" || parent.operator == "||")
                                    && node === parent.right)
                                || (parent instanceof AST_Switch && node !== parent.expression)) {
                                return side_effects_encountered = unwind = true, node;
                            }
                        },
                        function postorder(node) {
                            if (unwind) return node;
                            if (node === ref)
                                return unwind = true, replace_var(node, tt.parent(), false);
                            if (side_effects_encountered |= node.has_side_effects(compressor))
                                return unwind = true, node;
                            if (lvalues_encountered && node instanceof AST_SymbolRef && node.name in lvalues) {
                                side_effects_encountered = true;
                                return unwind = true, node;
                            }
                        }
                    );
                    stat.transform(tt);
                }
            }

            // Remove extraneous empty statments in block after removing var definitions.
            // Leave at least one statement in `statements`.
            if (var_defs_removed) for (var i = statements.length; --i >= 0;) {
                if (statements.length > 1 && statements[i] instanceof AST_EmptyStatement)
                    statements.splice(i, 1);
            }

            return statements;

            function is_lvalue(node, parent) {
                return node instanceof AST_SymbolRef && (
                    (parent instanceof AST_Assign && node === parent.left)
                    || (parent instanceof AST_Unary && parent.expression === node
                        && (parent.operator == "++" || parent.operator == "--")));
            }
            function replace_var(node, parent, is_constant) {
                if (is_lvalue(node, parent)) return node;

                // Remove var definition and return its value to the TreeTransformer to replace.
                var value = maintain_this_binding(parent, node, var_decl.value);
                var_decl.value = null;

                var_defs.splice(var_defs_index, 1);
                if (var_defs.length === 0) {
                    statements[prev_stat_index] = make_node(AST_EmptyStatement, self);
                    var_defs_removed = true;
                }
                // Further optimize statement after substitution.
                stat.walk(new TreeWalker(function(node){
                    delete node._squeezed;
                    delete node._optimized;
                }));

                compressor.warn("Replacing " + (is_constant ? "constant" : "variable") +
                    " " + var_name + " [{file}:{line},{col}]", node.start);
                CHANGED = true;
                return value;
            }
        }

        function process_for_angular(statements) {
            function has_inject(comment) {
                return /@ngInject/.test(comment.value);
            }
            function make_arguments_names_list(func) {
                return func.argnames.map(function(sym){
                    return make_node(AST_String, sym, { value: sym.name });
                });
            }
            function make_array(orig, elements) {
                return make_node(AST_Array, orig, { elements: elements });
            }
            function make_injector(func, name) {
                return make_node(AST_SimpleStatement, func, {
                    body: make_node(AST_Assign, func, {
                        operator: "=",
                        left: make_node(AST_Dot, name, {
                            expression: make_node(AST_SymbolRef, name, name),
                            property: "$inject"
                        }),
                        right: make_array(func, make_arguments_names_list(func))
                    })
                });
            }
            function check_expression(body) {
                if (body && body.args) {
                    // if this is a function call check all of arguments passed
                    body.args.forEach(function(argument, index, array) {
                        var comments = argument.start.comments_before;
                        // if the argument is function preceded by @ngInject
                        if (argument instanceof AST_Lambda && comments.length && has_inject(comments[0])) {
                            // replace the function with an array of names of its parameters and function at the end
                            array[index] = make_array(argument, make_arguments_names_list(argument).concat(argument));
                        }
                    });
                    // if this is chained call check previous one recursively
                    if (body.expression && body.expression.expression) {
                        check_expression(body.expression.expression);
                    }
                }
            }
            return statements.reduce(function(a, stat){
                a.push(stat);

                if (stat.body && stat.body.args) {
                    check_expression(stat.body);
                } else {
                    var token = stat.start;
                    var comments = token.comments_before;
                    if (comments && comments.length > 0) {
                        var last = comments.pop();
                        if (has_inject(last)) {
                            // case 1: defun
                            if (stat instanceof AST_Defun) {
                                a.push(make_injector(stat, stat.name));
                            }
                            else if (stat instanceof AST_Definitions) {
                                stat.definitions.forEach(function(def) {
                                    if (def.value && def.value instanceof AST_Lambda) {
                                        a.push(make_injector(def.value, def.name));
                                    }
                                });
                            }
                            else {
                                compressor.warn("Unknown statement marked with @ngInject [{file}:{line},{col}]", token);
                            }
                        }
                    }
                }

                return a;
            }, []);
        }

        function eliminate_spurious_blocks(statements) {
            var seen_dirs = [];
            return statements.reduce(function(a, stat){
                if (stat instanceof AST_BlockStatement) {
                    CHANGED = true;
                    a.push.apply(a, eliminate_spurious_blocks(stat.body));
                } else if (stat instanceof AST_EmptyStatement) {
                    CHANGED = true;
                } else if (stat instanceof AST_Directive) {
                    if (seen_dirs.indexOf(stat.value) < 0) {
                        a.push(stat);
                        seen_dirs.push(stat.value);
                    } else {
                        CHANGED = true;
                    }
                } else {
                    a.push(stat);
                }
                return a;
            }, []);
        };

        function handle_if_return(statements, compressor) {
            var self = compressor.self();
            var in_lambda = self instanceof AST_Lambda;
            var ret = [];
            loop: for (var i = statements.length; --i >= 0;) {
                var stat = statements[i];
                switch (true) {
                  case (in_lambda && stat instanceof AST_Return && !stat.value && ret.length == 0):
                    CHANGED = true;
                    // note, ret.length is probably always zero
                    // because we drop unreachable code before this
                    // step.  nevertheless, it's good to check.
                    continue loop;
                  case stat instanceof AST_If:
                    if (stat.body instanceof AST_Return) {
                        //---
                        // pretty silly case, but:
                        // if (foo()) return; return; ==> foo(); return;
                        if (((in_lambda && ret.length == 0)
                             || (ret[0] instanceof AST_Return && !ret[0].value))
                            && !stat.body.value && !stat.alternative) {
                            CHANGED = true;
                            var cond = make_node(AST_SimpleStatement, stat.condition, {
                                body: stat.condition
                            });
                            ret.unshift(cond);
                            continue loop;
                        }
                        //---
                        // if (foo()) return x; return y; ==> return foo() ? x : y;
                        if (ret[0] instanceof AST_Return && stat.body.value && ret[0].value && !stat.alternative) {
                            CHANGED = true;
                            stat = stat.clone();
                            stat.alternative = ret[0];
                            ret[0] = stat.transform(compressor);
                            continue loop;
                        }
                        //---
                        // if (foo()) return x; [ return ; ] ==> return foo() ? x : undefined;
                        if ((ret.length == 0 || ret[0] instanceof AST_Return) && stat.body.value && !stat.alternative && in_lambda) {
                            CHANGED = true;
                            stat = stat.clone();
                            stat.alternative = ret[0] || make_node(AST_Return, stat, {
                                value: make_node(AST_Undefined, stat)
                            });
                            ret[0] = stat.transform(compressor);
                            continue loop;
                        }
                        //---
                        // if (foo()) return; [ else x... ]; y... ==> if (!foo()) { x...; y... }
                        if (!stat.body.value && in_lambda) {
                            CHANGED = true;
                            stat = stat.clone();
                            stat.condition = stat.condition.negate(compressor);
                            stat.body = make_node(AST_BlockStatement, stat, {
                                body: as_statement_array(stat.alternative).concat(ret)
                            });
                            stat.alternative = null;
                            ret = [ stat.transform(compressor) ];
                            continue loop;
                        }
                        //---
                        // XXX: what was the intention of this case?
                        // if sequences is not enabled, this can lead to an endless loop (issue #866).
                        // however, with sequences on this helps producing slightly better output for
                        // the example code.
                        if (compressor.option("sequences")
                            && ret.length == 1 && in_lambda && ret[0] instanceof AST_SimpleStatement
                            && (!stat.alternative || stat.alternative instanceof AST_SimpleStatement)) {
                            CHANGED = true;
                            ret.push(make_node(AST_Return, ret[0], {
                                value: make_node(AST_Undefined, ret[0])
                            }).transform(compressor));
                            ret = as_statement_array(stat.alternative).concat(ret);
                            ret.unshift(stat);
                            continue loop;
                        }
                    }

                    var ab = aborts(stat.body);
                    var lct = ab instanceof AST_LoopControl ? compressor.loopcontrol_target(ab.label) : null;
                    if (ab && ((ab instanceof AST_Return && !ab.value && in_lambda)
                               || (ab instanceof AST_Continue && self === loop_body(lct))
                               || (ab instanceof AST_Break && lct instanceof AST_BlockStatement && self === lct))) {
                        if (ab.label) {
                            remove(ab.label.thedef.references, ab);
                        }
                        CHANGED = true;
                        var body = as_statement_array(stat.body).slice(0, -1);
                        stat = stat.clone();
                        stat.condition = stat.condition.negate(compressor);
                        stat.body = make_node(AST_BlockStatement, stat, {
                            body: as_statement_array(stat.alternative).concat(ret)
                        });
                        stat.alternative = make_node(AST_BlockStatement, stat, {
                            body: body
                        });
                        ret = [ stat.transform(compressor) ];
                        continue loop;
                    }

                    var ab = aborts(stat.alternative);
                    var lct = ab instanceof AST_LoopControl ? compressor.loopcontrol_target(ab.label) : null;
                    if (ab && ((ab instanceof AST_Return && !ab.value && in_lambda)
                               || (ab instanceof AST_Continue && self === loop_body(lct))
                               || (ab instanceof AST_Break && lct instanceof AST_BlockStatement && self === lct))) {
                        if (ab.label) {
                            remove(ab.label.thedef.references, ab);
                        }
                        CHANGED = true;
                        stat = stat.clone();
                        stat.body = make_node(AST_BlockStatement, stat.body, {
                            body: as_statement_array(stat.body).concat(ret)
                        });
                        stat.alternative = make_node(AST_BlockStatement, stat.alternative, {
                            body: as_statement_array(stat.alternative).slice(0, -1)
                        });
                        ret = [ stat.transform(compressor) ];
                        continue loop;
                    }

                    ret.unshift(stat);
                    break;
                  default:
                    ret.unshift(stat);
                    break;
                }
            }
            return ret;
        };

        function eliminate_dead_code(statements, compressor) {
            var has_quit = false;
            var orig = statements.length;
            var self = compressor.self();
            statements = statements.reduce(function(a, stat){
                if (has_quit) {
                    extract_declarations_from_unreachable_code(compressor, stat, a);
                } else {
                    if (stat instanceof AST_LoopControl) {
                        var lct = compressor.loopcontrol_target(stat.label);
                        if ((stat instanceof AST_Break
                             && lct instanceof AST_BlockStatement
                             && loop_body(lct) === self) || (stat instanceof AST_Continue
                                                             && loop_body(lct) === self)) {
                            if (stat.label) {
                                remove(stat.label.thedef.references, stat);
                            }
                        } else {
                            a.push(stat);
                        }
                    } else {
                        a.push(stat);
                    }
                    if (aborts(stat)) has_quit = true;
                }
                return a;
            }, []);
            CHANGED = statements.length != orig;
            return statements;
        };

        function sequencesize(statements, compressor) {
            if (statements.length < 2) return statements;
            var seq = [], ret = [];
            function push_seq() {
                seq = AST_Seq.from_array(seq);
                if (seq) ret.push(make_node(AST_SimpleStatement, seq, {
                    body: seq
                }));
                seq = [];
            };
            statements.forEach(function(stat){
                if (stat instanceof AST_SimpleStatement && seq.length < 2000) seq.push(stat.body);
                else push_seq(), ret.push(stat);
            });
            push_seq();
            ret = sequencesize_2(ret, compressor);
            CHANGED = ret.length != statements.length;
            return ret;
        };

        function sequencesize_2(statements, compressor) {
            function cons_seq(right) {
                ret.pop();
                var left = prev.body;
                if (left instanceof AST_Seq) {
                    left.add(right);
                } else {
                    left = AST_Seq.cons(left, right);
                }
                return left.transform(compressor);
            };
            var ret = [], prev = null;
            statements.forEach(function(stat){
                if (prev) {
                    if (stat instanceof AST_For) {
                        var opera = {};
                        try {
                            prev.body.walk(new TreeWalker(function(node){
                                if (node instanceof AST_Binary && node.operator == "in")
                                    throw opera;
                            }));
                            if (stat.init && !(stat.init instanceof AST_Definitions)) {
                                stat.init = cons_seq(stat.init);
                            }
                            else if (!stat.init) {
                                stat.init = prev.body;
                                ret.pop();
                            }
                        } catch(ex) {
                            if (ex !== opera) throw ex;
                        }
                    }
                    else if (stat instanceof AST_If) {
                        stat.condition = cons_seq(stat.condition);
                    }
                    else if (stat instanceof AST_With) {
                        stat.expression = cons_seq(stat.expression);
                    }
                    else if (stat instanceof AST_Exit && stat.value) {
                        stat.value = cons_seq(stat.value);
                    }
                    else if (stat instanceof AST_Exit) {
                        stat.value = cons_seq(make_node(AST_Undefined, stat));
                    }
                    else if (stat instanceof AST_Switch) {
                        stat.expression = cons_seq(stat.expression);
                    }
                }
                ret.push(stat);
                prev = stat instanceof AST_SimpleStatement ? stat : null;
            });
            return ret;
        };

        function join_consecutive_vars(statements, compressor) {
            var prev = null;
            return statements.reduce(function(a, stat){
                if (stat instanceof AST_Definitions && prev && prev.TYPE == stat.TYPE) {
                    prev.definitions = prev.definitions.concat(stat.definitions);
                    CHANGED = true;
                }
                else if (stat instanceof AST_For
                         && prev instanceof AST_Definitions
                         && (!stat.init || stat.init.TYPE == prev.TYPE)) {
                    CHANGED = true;
                    a.pop();
                    if (stat.init) {
                        stat.init.definitions = prev.definitions.concat(stat.init.definitions);
                    } else {
                        stat.init = prev;
                    }
                    a.push(stat);
                    prev = stat;
                }
                else {
                    prev = stat;
                    a.push(stat);
                }
                return a;
            }, []);
        };

        function negate_iifes(statements, compressor) {
            statements.forEach(function(stat){
                if (stat instanceof AST_SimpleStatement) {
                    stat.body = (function transform(thing) {
                        return thing.transform(new TreeTransformer(function(node){
                            if (node instanceof AST_Call && node.expression instanceof AST_Function) {
                                return make_node(AST_UnaryPrefix, node, {
                                    operator: "!",
                                    expression: node
                                });
                            }
                            else if (node instanceof AST_Call) {
                                node.expression = transform(node.expression);
                            }
                            else if (node instanceof AST_Seq) {
                                node.car = transform(node.car);
                            }
                            else if (node instanceof AST_Conditional) {
                                var expr = transform(node.condition);
                                if (expr !== node.condition) {
                                    // it has been negated, reverse
                                    node.condition = expr;
                                    var tmp = node.consequent;
                                    node.consequent = node.alternative;
                                    node.alternative = tmp;
                                }
                            }
                            return node;
                        }));
                    })(stat.body);
                }
            });
        };

    };

    function extract_declarations_from_unreachable_code(compressor, stat, target) {
        compressor.warn("Dropping unreachable code [{file}:{line},{col}]", stat.start);
        stat.walk(new TreeWalker(function(node){
            if (node instanceof AST_Definitions) {
                compressor.warn("Declarations in unreachable code! [{file}:{line},{col}]", node.start);
                node.remove_initializers();
                target.push(node);
                return true;
            }
            if (node instanceof AST_Defun) {
                target.push(node);
                return true;
            }
            if (node instanceof AST_Scope) {
                return true;
            }
        }));
    };

    /* -----[ boolean/negation helpers ]----- */

    // methods to determine whether an expression has a boolean result type
    (function (def){
        var unary_bool = [ "!", "delete" ];
        var binary_bool = [ "in", "instanceof", "==", "!=", "===", "!==", "<", "<=", ">=", ">" ];
        def(AST_Node, function(){ return false });
        def(AST_UnaryPrefix, function(){
            return member(this.operator, unary_bool);
        });
        def(AST_Binary, function(){
            return member(this.operator, binary_bool) ||
                ( (this.operator == "&&" || this.operator == "||") &&
                  this.left.is_boolean() && this.right.is_boolean() );
        });
        def(AST_Conditional, function(){
            return this.consequent.is_boolean() && this.alternative.is_boolean();
        });
        def(AST_Assign, function(){
            return this.operator == "=" && this.right.is_boolean();
        });
        def(AST_Seq, function(){
            return this.cdr.is_boolean();
        });
        def(AST_True, function(){ return true });
        def(AST_False, function(){ return true });
    })(function(node, func){
        node.DEFMETHOD("is_boolean", func);
    });

    // methods to determine if an expression has a string result type
    (function (def){
        def(AST_Node, function(){ return false });
        def(AST_String, function(){ return true });
        def(AST_UnaryPrefix, function(){
            return this.operator == "typeof";
        });
        def(AST_Binary, function(compressor){
            return this.operator == "+" &&
                (this.left.is_string(compressor) || this.right.is_string(compressor));
        });
        def(AST_Assign, function(compressor){
            return (this.operator == "=" || this.operator == "+=") && this.right.is_string(compressor);
        });
        def(AST_Seq, function(compressor){
            return this.cdr.is_string(compressor);
        });
        def(AST_Conditional, function(compressor){
            return this.consequent.is_string(compressor) && this.alternative.is_string(compressor);
        });
        def(AST_Call, function(compressor){
            return compressor.option("unsafe")
                && this.expression instanceof AST_SymbolRef
                && this.expression.name == "String"
                && this.expression.undeclared();
        });
    })(function(node, func){
        node.DEFMETHOD("is_string", func);
    });

    function best_of(ast1, ast2) {
        return ast1.print_to_string().length >
            ast2.print_to_string().length
            ? ast2 : ast1;
    };

    // methods to evaluate a constant expression
    (function (def){
        // The evaluate method returns an array with one or two
        // elements.  If the node has been successfully reduced to a
        // constant, then the second element tells us the value;
        // otherwise the second element is missing.  The first element
        // of the array is always an AST_Node descendant; if
        // evaluation was successful it's a node that represents the
        // constant; otherwise it's the original or a replacement node.
        AST_Node.DEFMETHOD("evaluate", function(compressor){
            if (!compressor.option("evaluate")) return [ this ];
            try {
                var val = this._eval(compressor);
                return [ best_of(make_node_from_constant(compressor, val, this), this), val ];
            } catch(ex) {
                if (ex !== def) throw ex;
                return [ this ];
            }
        });
        AST_Node.DEFMETHOD("is_constant", function(compressor){
            // Accomodate when compress option evaluate=false
            // as well as the common constant expressions !0 and !1
            return this instanceof AST_Constant
                || (this instanceof AST_UnaryPrefix && this.operator == "!"
                    && this.expression instanceof AST_Constant)
                || this.evaluate(compressor).length > 1;
        });
        // Obtain the constant value of an expression already known to be constant.
        // Result only valid iff this.is_constant(compressor) is true.
        AST_Node.DEFMETHOD("constant_value", function(compressor){
            // Accomodate when option evaluate=false.
            if (this instanceof AST_Constant) return this.value;
            // Accomodate the common constant expressions !0 and !1 when option evaluate=false.
            if (this instanceof AST_UnaryPrefix
                && this.operator == "!"
                && this.expression instanceof AST_Constant) {
                return !this.expression.value;
            }
            var result = this.evaluate(compressor)
            if (result.length > 1) {
                return result[1];
            }
            // should never be reached
            return undefined;
        });
        def(AST_Statement, function(){
            throw new Error(string_template("Cannot evaluate a statement [{file}:{line},{col}]", this.start));
        });
        def(AST_Function, function(){
            // XXX: AST_Function inherits from AST_Scope, which itself
            // inherits from AST_Statement; however, an AST_Function
            // isn't really a statement.  This could byte in other
            // places too. :-( Wish JS had multiple inheritance.
            throw def;
        });
        function ev(node, compressor) {
            if (!compressor) throw new Error("Compressor must be passed");

            return node._eval(compressor);
        };
        def(AST_Node, function(){
            throw def;          // not constant
        });
        def(AST_Constant, function(){
            return this.getValue();
        });
        def(AST_UnaryPrefix, function(compressor){
            var e = this.expression;
            switch (this.operator) {
              case "!": return !ev(e, compressor);
              case "typeof":
                // Function would be evaluated to an array and so typeof would
                // incorrectly return 'object'. Hence making is a special case.
                if (e instanceof AST_Function) return typeof function(){};

                e = ev(e, compressor);

                // typeof <RegExp> returns "object" or "function" on different platforms
                // so cannot evaluate reliably
                if (e instanceof RegExp) throw def;

                return typeof e;
              case "void": return void ev(e, compressor);
              case "~": return ~ev(e, compressor);
              case "-":
                e = ev(e, compressor);
                if (e === 0) throw def;
                return -e;
              case "+": return +ev(e, compressor);
            }
            throw def;
        });
        def(AST_Binary, function(c){
            var left = this.left, right = this.right;
            switch (this.operator) {
              case "&&"         : return ev(left, c) &&         ev(right, c);
              case "||"         : return ev(left, c) ||         ev(right, c);
              case "|"          : return ev(left, c) |          ev(right, c);
              case "&"          : return ev(left, c) &          ev(right, c);
              case "^"          : return ev(left, c) ^          ev(right, c);
              case "+"          : return ev(left, c) +          ev(right, c);
              case "*"          : return ev(left, c) *          ev(right, c);
              case "/"          : return ev(left, c) /          ev(right, c);
              case "%"          : return ev(left, c) %          ev(right, c);
              case "-"          : return ev(left, c) -          ev(right, c);
              case "<<"         : return ev(left, c) <<         ev(right, c);
              case ">>"         : return ev(left, c) >>         ev(right, c);
              case ">>>"        : return ev(left, c) >>>        ev(right, c);
              case "=="         : return ev(left, c) ==         ev(right, c);
              case "==="        : return ev(left, c) ===        ev(right, c);
              case "!="         : return ev(left, c) !=         ev(right, c);
              case "!=="        : return ev(left, c) !==        ev(right, c);
              case "<"          : return ev(left, c) <          ev(right, c);
              case "<="         : return ev(left, c) <=         ev(right, c);
              case ">"          : return ev(left, c) >          ev(right, c);
              case ">="         : return ev(left, c) >=         ev(right, c);
              case "in"         : return ev(left, c) in         ev(right, c);
              case "instanceof" : return ev(left, c) instanceof ev(right, c);
            }
            throw def;
        });
        def(AST_Conditional, function(compressor){
            return ev(this.condition, compressor)
                ? ev(this.consequent, compressor)
                : ev(this.alternative, compressor);
        });
        def(AST_SymbolRef, function(compressor){
            var d = this.definition();
            if (d && d.constant && d.init) return ev(d.init, compressor);
            throw def;
        });
        def(AST_Dot, function(compressor){
            if (compressor.option("unsafe") && this.property == "length") {
                var str = ev(this.expression, compressor);
                if (typeof str == "string")
                    return str.length;
            }
            throw def;
        });
    })(function(node, func){
        node.DEFMETHOD("_eval", func);
    });

    // method to negate an expression
    (function(def){
        function basic_negation(exp) {
            return make_node(AST_UnaryPrefix, exp, {
                operator: "!",
                expression: exp
            });
        };
        def(AST_Node, function(){
            return basic_negation(this);
        });
        def(AST_Statement, function(){
            throw new Error("Cannot negate a statement");
        });
        def(AST_Function, function(){
            return basic_negation(this);
        });
        def(AST_UnaryPrefix, function(){
            if (this.operator == "!")
                return this.expression;
            return basic_negation(this);
        });
        def(AST_Seq, function(compressor){
            var self = this.clone();
            self.cdr = self.cdr.negate(compressor);
            return self;
        });
        def(AST_Conditional, function(compressor){
            var self = this.clone();
            self.consequent = self.consequent.negate(compressor);
            self.alternative = self.alternative.negate(compressor);
            return best_of(basic_negation(this), self);
        });
        def(AST_Binary, function(compressor){
            var self = this.clone(), op = this.operator;
            if (compressor.option("unsafe_comps")) {
                switch (op) {
                  case "<=" : self.operator = ">"  ; return self;
                  case "<"  : self.operator = ">=" ; return self;
                  case ">=" : self.operator = "<"  ; return self;
                  case ">"  : self.operator = "<=" ; return self;
                }
            }
            switch (op) {
              case "==" : self.operator = "!="; return self;
              case "!=" : self.operator = "=="; return self;
              case "===": self.operator = "!=="; return self;
              case "!==": self.operator = "==="; return self;
              case "&&":
                self.operator = "||";
                self.left = self.left.negate(compressor);
                self.right = self.right.negate(compressor);
                return best_of(basic_negation(this), self);
              case "||":
                self.operator = "&&";
                self.left = self.left.negate(compressor);
                self.right = self.right.negate(compressor);
                return best_of(basic_negation(this), self);
            }
            return basic_negation(this);
        });
    })(function(node, func){
        node.DEFMETHOD("negate", function(compressor){
            return func.call(this, compressor);
        });
    });

    // determine if expression has side effects
    (function(def){
        def(AST_Node, function(compressor){ return true });

        def(AST_EmptyStatement, function(compressor){ return false });
        def(AST_Constant, function(compressor){ return false });
        def(AST_This, function(compressor){ return false });

        def(AST_Call, function(compressor){
            var pure = compressor.option("pure_funcs");
            if (!pure) return true;
            if (typeof pure == "function") return pure(this);
            return pure.indexOf(this.expression.print_to_string()) < 0;
        });

        def(AST_Block, function(compressor){
            for (var i = this.body.length; --i >= 0;) {
                if (this.body[i].has_side_effects(compressor))
                    return true;
            }
            return false;
        });

        def(AST_SimpleStatement, function(compressor){
            return this.body.has_side_effects(compressor);
        });
        def(AST_Defun, function(compressor){ return true });
        def(AST_Function, function(compressor){ return false });
        def(AST_Binary, function(compressor){
            return this.left.has_side_effects(compressor)
                || this.right.has_side_effects(compressor);
        });
        def(AST_Assign, function(compressor){ return true });
        def(AST_Conditional, function(compressor){
            return this.condition.has_side_effects(compressor)
                || this.consequent.has_side_effects(compressor)
                || this.alternative.has_side_effects(compressor);
        });
        def(AST_Unary, function(compressor){
            return this.operator == "delete"
                || this.operator == "++"
                || this.operator == "--"
                || this.expression.has_side_effects(compressor);
        });
        def(AST_SymbolRef, function(compressor){
            return this.global() && this.undeclared();
        });
        def(AST_Object, function(compressor){
            for (var i = this.properties.length; --i >= 0;)
                if (this.properties[i].has_side_effects(compressor))
                    return true;
            return false;
        });
        def(AST_ObjectProperty, function(compressor){
            return this.value.has_side_effects(compressor);
        });
        def(AST_Array, function(compressor){
            for (var i = this.elements.length; --i >= 0;)
                if (this.elements[i].has_side_effects(compressor))
                    return true;
            return false;
        });
        def(AST_Dot, function(compressor){
            if (!compressor.option("pure_getters")) return true;
            return this.expression.has_side_effects(compressor);
        });
        def(AST_Sub, function(compressor){
            if (!compressor.option("pure_getters")) return true;
            return this.expression.has_side_effects(compressor)
                || this.property.has_side_effects(compressor);
        });
        def(AST_PropAccess, function(compressor){
            return !compressor.option("pure_getters");
        });
        def(AST_Seq, function(compressor){
            return this.car.has_side_effects(compressor)
                || this.cdr.has_side_effects(compressor);
        });
    })(function(node, func){
        node.DEFMETHOD("has_side_effects", func);
    });

    // tell me if a statement aborts
    function aborts(thing) {
        return thing && thing.aborts();
    };
    (function(def){
        def(AST_Statement, function(){ return null });
        def(AST_Jump, function(){ return this });
        function block_aborts(){
            var n = this.body.length;
            return n > 0 && aborts(this.body[n - 1]);
        };
        def(AST_BlockStatement, block_aborts);
        def(AST_SwitchBranch, block_aborts);
        def(AST_If, function(){
            return this.alternative && aborts(this.body) && aborts(this.alternative) && this;
        });
    })(function(node, func){
        node.DEFMETHOD("aborts", func);
    });

    /* -----[ optimizers ]----- */

    OPT(AST_Directive, function(self, compressor){
        if (compressor.has_directive(self.value) === "up") {
            return make_node(AST_EmptyStatement, self);
        }
        return self;
    });

    OPT(AST_Debugger, function(self, compressor){
        if (compressor.option("drop_debugger"))
            return make_node(AST_EmptyStatement, self);
        return self;
    });

    OPT(AST_LabeledStatement, function(self, compressor){
        if (self.body instanceof AST_Break
            && compressor.loopcontrol_target(self.body.label) === self.body) {
            return make_node(AST_EmptyStatement, self);
        }
        return self.label.references.length == 0 ? self.body : self;
    });

    OPT(AST_Block, function(self, compressor){
        self.body = tighten_body(self.body, compressor);
        return self;
    });

    OPT(AST_BlockStatement, function(self, compressor){
        self.body = tighten_body(self.body, compressor);
        switch (self.body.length) {
          case 1: return self.body[0];
          case 0: return make_node(AST_EmptyStatement, self);
        }
        return self;
    });

    AST_Scope.DEFMETHOD("drop_unused", function(compressor){
        var self = this;
        if (compressor.has_directive("use asm")) return self;
        if (compressor.option("unused")
            && !(self instanceof AST_Toplevel)
            && !self.uses_eval
           ) {
            var in_use = [];
            var initializations = new Dictionary();
            // pass 1: find out which symbols are directly used in
            // this scope (not in nested scopes).
            var scope = this;
            var tw = new TreeWalker(function(node, descend){
                if (node !== self) {
                    if (node instanceof AST_Defun) {
                        initializations.add(node.name.name, node);
                        return true; // don't go in nested scopes
                    }
                    if (node instanceof AST_Definitions && scope === self) {
                        node.definitions.forEach(function(def){
                            if (def.value) {
                                initializations.add(def.name.name, def.value);
                                if (def.value.has_side_effects(compressor)) {
                                    def.value.walk(tw);
                                }
                            }
                        });
                        return true;
                    }
                    if (node instanceof AST_SymbolRef) {
                        push_uniq(in_use, node.definition());
                        return true;
                    }
                    if (node instanceof AST_Scope) {
                        var save_scope = scope;
                        scope = node;
                        descend();
                        scope = save_scope;
                        return true;
                    }
                }
            });
            self.walk(tw);
            // pass 2: for every used symbol we need to walk its
            // initialization code to figure out if it uses other
            // symbols (that may not be in_use).
            for (var i = 0; i < in_use.length; ++i) {
                in_use[i].orig.forEach(function(decl){
                    // undeclared globals will be instanceof AST_SymbolRef
                    var init = initializations.get(decl.name);
                    if (init) init.forEach(function(init){
                        var tw = new TreeWalker(function(node){
                            if (node instanceof AST_SymbolRef) {
                                push_uniq(in_use, node.definition());
                            }
                        });
                        init.walk(tw);
                    });
                });
            }
            // pass 3: we should drop declarations not in_use
            var tt = new TreeTransformer(
                function before(node, descend, in_list) {
                    if (node instanceof AST_Lambda && !(node instanceof AST_Accessor)) {
                        if (!compressor.option("keep_fargs")) {
                            for (var a = node.argnames, i = a.length; --i >= 0;) {
                                var sym = a[i];
                                if (sym.unreferenced()) {
                                    a.pop();
                                    compressor.warn("Dropping unused function argument {name} [{file}:{line},{col}]", {
                                        name : sym.name,
                                        file : sym.start.file,
                                        line : sym.start.line,
                                        col  : sym.start.col
                                    });
                                }
                                else break;
                            }
                        }
                    }
                    if (node instanceof AST_Defun && node !== self) {
                        if (!member(node.name.definition(), in_use)) {
                            compressor.warn("Dropping unused function {name} [{file}:{line},{col}]", {
                                name : node.name.name,
                                file : node.name.start.file,
                                line : node.name.start.line,
                                col  : node.name.start.col
                            });
                            return make_node(AST_EmptyStatement, node);
                        }
                        return node;
                    }
                    if (node instanceof AST_Definitions && !(tt.parent() instanceof AST_ForIn)) {
                        var def = node.definitions.filter(function(def){
                            if (member(def.name.definition(), in_use)) return true;
                            var w = {
                                name : def.name.name,
                                file : def.name.start.file,
                                line : def.name.start.line,
                                col  : def.name.start.col
                            };
                            if (def.value && def.value.has_side_effects(compressor)) {
                                def._unused_side_effects = true;
                                compressor.warn("Side effects in initialization of unused variable {name} [{file}:{line},{col}]", w);
                                return true;
                            }
                            compressor.warn("Dropping unused variable {name} [{file}:{line},{col}]", w);
                            return false;
                        });
                        // place uninitialized names at the start
                        def = mergeSort(def, function(a, b){
                            if (!a.value && b.value) return -1;
                            if (!b.value && a.value) return 1;
                            return 0;
                        });
                        // for unused names whose initialization has
                        // side effects, we can cascade the init. code
                        // into the next one, or next statement.
                        var side_effects = [];
                        for (var i = 0; i < def.length;) {
                            var x = def[i];
                            if (x._unused_side_effects) {
                                side_effects.push(x.value);
                                def.splice(i, 1);
                            } else {
                                if (side_effects.length > 0) {
                                    side_effects.push(x.value);
                                    x.value = AST_Seq.from_array(side_effects);
                                    side_effects = [];
                                }
                                ++i;
                            }
                        }
                        if (side_effects.length > 0) {
                            side_effects = make_node(AST_BlockStatement, node, {
                                body: [ make_node(AST_SimpleStatement, node, {
                                    body: AST_Seq.from_array(side_effects)
                                }) ]
                            });
                        } else {
                            side_effects = null;
                        }
                        if (def.length == 0 && !side_effects) {
                            return make_node(AST_EmptyStatement, node);
                        }
                        if (def.length == 0) {
                            return in_list ? MAP.splice(side_effects.body) : side_effects;
                        }
                        node.definitions = def;
                        if (side_effects) {
                            side_effects.body.unshift(node);
                            return in_list ? MAP.splice(side_effects.body) : side_effects;
                        }
                        return node;
                    }
                    if (node instanceof AST_For) {
                        descend(node, this);

                        if (node.init instanceof AST_BlockStatement) {
                            // certain combination of unused name + side effect leads to:
                            //    https://github.com/mishoo/UglifyJS2/issues/44
                            // that's an invalid AST.
                            // We fix it at this stage by moving the `var` outside the `for`.

                            var body = node.init.body.slice(0, -1);
                            node.init = node.init.body.slice(-1)[0].body;
                            body.push(node);

                            return in_list ? MAP.splice(body) : make_node(AST_BlockStatement, node, {
                                body: body
                            });
                        }
                    }
                    if (node instanceof AST_Scope && node !== self)
                        return node;
                }
            );
            self.transform(tt);
        }
    });

    AST_Scope.DEFMETHOD("hoist_declarations", function(compressor){
        var self = this;
        if (compressor.has_directive("use asm")) return self;
        var hoist_funs = compressor.option("hoist_funs");
        var hoist_vars = compressor.option("hoist_vars");
        if (hoist_funs || hoist_vars) {
            var dirs = [];
            var hoisted = [];
            var vars = new Dictionary(), vars_found = 0, var_decl = 0;
            // let's count var_decl first, we seem to waste a lot of
            // space if we hoist `var` when there's only one.
            self.walk(new TreeWalker(function(node){
                if (node instanceof AST_Scope && node !== self)
                    return true;
                if (node instanceof AST_Var) {
                    ++var_decl;
                    return true;
                }
            }));
            hoist_vars = hoist_vars && var_decl > 1;
            var tt = new TreeTransformer(
                function before(node) {
                    if (node !== self) {
                        if (node instanceof AST_Directive) {
                            dirs.push(node);
                            return make_node(AST_EmptyStatement, node);
                        }
                        if (node instanceof AST_Defun && hoist_funs) {
                            hoisted.push(node);
                            return make_node(AST_EmptyStatement, node);
                        }
                        if (node instanceof AST_Var && hoist_vars) {
                            node.definitions.forEach(function(def){
                                vars.set(def.name.name, def);
                                ++vars_found;
                            });
                            var seq = node.to_assignments();
                            var p = tt.parent();
                            if (p instanceof AST_ForIn && p.init === node) {
                                if (seq == null) {
                                    var def = node.definitions[0].name;
                                    return make_node(AST_SymbolRef, def, def);
                                }
                                return seq;
                            }
                            if (p instanceof AST_For && p.init === node) {
                                return seq;
                            }
                            if (!seq) return make_node(AST_EmptyStatement, node);
                            return make_node(AST_SimpleStatement, node, {
                                body: seq
                            });
                        }
                        if (node instanceof AST_Scope)
                            return node; // to avoid descending in nested scopes
                    }
                }
            );
            self = self.transform(tt);
            if (vars_found > 0) {
                // collect only vars which don't show up in self's arguments list
                var defs = [];
                vars.each(function(def, name){
                    if (self instanceof AST_Lambda
                        && find_if(function(x){ return x.name == def.name.name },
                                   self.argnames)) {
                        vars.del(name);
                    } else {
                        def = def.clone();
                        def.value = null;
                        defs.push(def);
                        vars.set(name, def);
                    }
                });
                if (defs.length > 0) {
                    // try to merge in assignments
                    for (var i = 0; i < self.body.length;) {
                        if (self.body[i] instanceof AST_SimpleStatement) {
                            var expr = self.body[i].body, sym, assign;
                            if (expr instanceof AST_Assign
                                && expr.operator == "="
                                && (sym = expr.left) instanceof AST_Symbol
                                && vars.has(sym.name))
                            {
                                var def = vars.get(sym.name);
                                if (def.value) break;
                                def.value = expr.right;
                                remove(defs, def);
                                defs.push(def);
                                self.body.splice(i, 1);
                                continue;
                            }
                            if (expr instanceof AST_Seq
                                && (assign = expr.car) instanceof AST_Assign
                                && assign.operator == "="
                                && (sym = assign.left) instanceof AST_Symbol
                                && vars.has(sym.name))
                            {
                                var def = vars.get(sym.name);
                                if (def.value) break;
                                def.value = assign.right;
                                remove(defs, def);
                                defs.push(def);
                                self.body[i].body = expr.cdr;
                                continue;
                            }
                        }
                        if (self.body[i] instanceof AST_EmptyStatement) {
                            self.body.splice(i, 1);
                            continue;
                        }
                        if (self.body[i] instanceof AST_BlockStatement) {
                            var tmp = [ i, 1 ].concat(self.body[i].body);
                            self.body.splice.apply(self.body, tmp);
                            continue;
                        }
                        break;
                    }
                    defs = make_node(AST_Var, self, {
                        definitions: defs
                    });
                    hoisted.push(defs);
                };
            }
            self.body = dirs.concat(hoisted, self.body);
        }
        return self;
    });

    OPT(AST_SimpleStatement, function(self, compressor){
        if (compressor.option("side_effects")) {
            if (!self.body.has_side_effects(compressor)) {
                compressor.warn("Dropping side-effect-free statement [{file}:{line},{col}]", self.start);
                return make_node(AST_EmptyStatement, self);
            }
        }
        return self;
    });

    OPT(AST_DWLoop, function(self, compressor){
        var cond = self.condition.evaluate(compressor);
        self.condition = cond[0];
        if (!compressor.option("loops")) return self;
        if (cond.length > 1) {
            if (cond[1]) {
                return make_node(AST_For, self, {
                    body: self.body
                });
            } else if (self instanceof AST_While) {
                if (compressor.option("dead_code")) {
                    var a = [];
                    extract_declarations_from_unreachable_code(compressor, self.body, a);
                    return make_node(AST_BlockStatement, self, { body: a });
                }
            }
        }
        return self;
    });

    function if_break_in_loop(self, compressor) {
        function drop_it(rest) {
            rest = as_statement_array(rest);
            if (self.body instanceof AST_BlockStatement) {
                self.body = self.body.clone();
                self.body.body = rest.concat(self.body.body.slice(1));
                self.body = self.body.transform(compressor);
            } else {
                self.body = make_node(AST_BlockStatement, self.body, {
                    body: rest
                }).transform(compressor);
            }
            if_break_in_loop(self, compressor);
        }
        var first = self.body instanceof AST_BlockStatement ? self.body.body[0] : self.body;
        if (first instanceof AST_If) {
            if (first.body instanceof AST_Break
                && compressor.loopcontrol_target(first.body.label) === self) {
                if (self.condition) {
                    self.condition = make_node(AST_Binary, self.condition, {
                        left: self.condition,
                        operator: "&&",
                        right: first.condition.negate(compressor),
                    });
                } else {
                    self.condition = first.condition.negate(compressor);
                }
                drop_it(first.alternative);
            }
            else if (first.alternative instanceof AST_Break
                     && compressor.loopcontrol_target(first.alternative.label) === self) {
                if (self.condition) {
                    self.condition = make_node(AST_Binary, self.condition, {
                        left: self.condition,
                        operator: "&&",
                        right: first.condition,
                    });
                } else {
                    self.condition = first.condition;
                }
                drop_it(first.body);
            }
        }
    };

    OPT(AST_While, function(self, compressor) {
        if (!compressor.option("loops")) return self;
        self = AST_DWLoop.prototype.optimize.call(self, compressor);
        if (self instanceof AST_While) {
            if_break_in_loop(self, compressor);
            self = make_node(AST_For, self, self).transform(compressor);
        }
        return self;
    });

    OPT(AST_For, function(self, compressor){
        var cond = self.condition;
        if (cond) {
            cond = cond.evaluate(compressor);
            self.condition = cond[0];
        }
        if (!compressor.option("loops")) return self;
        if (cond) {
            if (cond.length > 1 && !cond[1]) {
                if (compressor.option("dead_code")) {
                    var a = [];
                    if (self.init instanceof AST_Statement) {
                        a.push(self.init);
                    }
                    else if (self.init) {
                        a.push(make_node(AST_SimpleStatement, self.init, {
                            body: self.init
                        }));
                    }
                    extract_declarations_from_unreachable_code(compressor, self.body, a);
                    return make_node(AST_BlockStatement, self, { body: a });
                }
            }
        }
        if_break_in_loop(self, compressor);
        return self;
    });

    OPT(AST_If, function(self, compressor){
        if (!compressor.option("conditionals")) return self;
        // if condition can be statically determined, warn and drop
        // one of the blocks.  note, statically determined implies
        // “has no side effects”; also it doesn't work for cases like
        // `x && true`, though it probably should.
        var cond = self.condition.evaluate(compressor);
        self.condition = cond[0];
        if (cond.length > 1) {
            if (cond[1]) {
                compressor.warn("Condition always true [{file}:{line},{col}]", self.condition.start);
                if (compressor.option("dead_code")) {
                    var a = [];
                    if (self.alternative) {
                        extract_declarations_from_unreachable_code(compressor, self.alternative, a);
                    }
                    a.push(self.body);
                    return make_node(AST_BlockStatement, self, { body: a }).transform(compressor);
                }
            } else {
                compressor.warn("Condition always false [{file}:{line},{col}]", self.condition.start);
                if (compressor.option("dead_code")) {
                    var a = [];
                    extract_declarations_from_unreachable_code(compressor, self.body, a);
                    if (self.alternative) a.push(self.alternative);
                    return make_node(AST_BlockStatement, self, { body: a }).transform(compressor);
                }
            }
        }
        if (is_empty(self.alternative)) self.alternative = null;
        var negated = self.condition.negate(compressor);
        var self_condition_length = self.condition.print_to_string().length;
        var negated_length = negated.print_to_string().length;
        var negated_is_best = negated_length < self_condition_length;
        if (self.alternative && negated_is_best) {
            negated_is_best = false; // because we already do the switch here.
            // no need to swap values of self_condition_length and negated_length
            // here because they are only used in an equality comparison later on.
            self.condition = negated;
            var tmp = self.body;
            self.body = self.alternative || make_node(AST_EmptyStatement);
            self.alternative = tmp;
        }
        if (is_empty(self.body) && is_empty(self.alternative)) {
            return make_node(AST_SimpleStatement, self.condition, {
                body: self.condition
            }).transform(compressor);
        }
        if (self.body instanceof AST_SimpleStatement
            && self.alternative instanceof AST_SimpleStatement) {
            return make_node(AST_SimpleStatement, self, {
                body: make_node(AST_Conditional, self, {
                    condition   : self.condition,
                    consequent  : self.body.body,
                    alternative : self.alternative.body
                })
            }).transform(compressor);
        }
        if (is_empty(self.alternative) && self.body instanceof AST_SimpleStatement) {
            if (self_condition_length === negated_length && !negated_is_best
                && self.condition instanceof AST_Binary && self.condition.operator == "||") {
                // although the code length of self.condition and negated are the same,
                // negated does not require additional surrounding parentheses.
                // see https://github.com/mishoo/UglifyJS2/issues/979
                negated_is_best = true;
            }
            if (negated_is_best) return make_node(AST_SimpleStatement, self, {
                body: make_node(AST_Binary, self, {
                    operator : "||",
                    left     : negated,
                    right    : self.body.body
                })
            }).transform(compressor);
            return make_node(AST_SimpleStatement, self, {
                body: make_node(AST_Binary, self, {
                    operator : "&&",
                    left     : self.condition,
                    right    : self.body.body
                })
            }).transform(compressor);
        }
        if (self.body instanceof AST_EmptyStatement
            && self.alternative
            && self.alternative instanceof AST_SimpleStatement) {
            return make_node(AST_SimpleStatement, self, {
                body: make_node(AST_Binary, self, {
                    operator : "||",
                    left     : self.condition,
                    right    : self.alternative.body
                })
            }).transform(compressor);
        }
        if (self.body instanceof AST_Exit
            && self.alternative instanceof AST_Exit
            && self.body.TYPE == self.alternative.TYPE) {
            return make_node(self.body.CTOR, self, {
                value: make_node(AST_Conditional, self, {
                    condition   : self.condition,
                    consequent  : self.body.value || make_node(AST_Undefined, self.body).optimize(compressor),
                    alternative : self.alternative.value || make_node(AST_Undefined, self.alternative).optimize(compressor)
                })
            }).transform(compressor);
        }
        if (self.body instanceof AST_If
            && !self.body.alternative
            && !self.alternative) {
            self.condition = make_node(AST_Binary, self.condition, {
                operator: "&&",
                left: self.condition,
                right: self.body.condition
            }).transform(compressor);
            self.body = self.body.body;
        }
        if (aborts(self.body)) {
            if (self.alternative) {
                var alt = self.alternative;
                self.alternative = null;
                return make_node(AST_BlockStatement, self, {
                    body: [ self, alt ]
                }).transform(compressor);
            }
        }
        if (aborts(self.alternative)) {
            var body = self.body;
            self.body = self.alternative;
            self.condition = negated_is_best ? negated : self.condition.negate(compressor);
            self.alternative = null;
            return make_node(AST_BlockStatement, self, {
                body: [ self, body ]
            }).transform(compressor);
        }
        return self;
    });

    OPT(AST_Switch, function(self, compressor){
        if (self.body.length == 0 && compressor.option("conditionals")) {
            return make_node(AST_SimpleStatement, self, {
                body: self.expression
            }).transform(compressor);
        }
        for(;;) {
            var last_branch = self.body[self.body.length - 1];
            if (last_branch) {
                var stat = last_branch.body[last_branch.body.length - 1]; // last statement
                if (stat instanceof AST_Break && loop_body(compressor.loopcontrol_target(stat.label)) === self)
                    last_branch.body.pop();
                if (last_branch instanceof AST_Default && last_branch.body.length == 0) {
                    self.body.pop();
                    continue;
                }
            }
            break;
        }
        var exp = self.expression.evaluate(compressor);
        out: if (exp.length == 2) try {
            // constant expression
            self.expression = exp[0];
            if (!compressor.option("dead_code")) break out;
            var value = exp[1];
            var in_if = false;
            var in_block = false;
            var started = false;
            var stopped = false;
            var ruined = false;
            var tt = new TreeTransformer(function(node, descend, in_list){
                if (node instanceof AST_Lambda || node instanceof AST_SimpleStatement) {
                    // no need to descend these node types
                    return node;
                }
                else if (node instanceof AST_Switch && node === self) {
                    node = node.clone();
                    descend(node, this);
                    return ruined ? node : make_node(AST_BlockStatement, node, {
                        body: node.body.reduce(function(a, branch){
                            return a.concat(branch.body);
                        }, [])
                    }).transform(compressor);
                }
                else if (node instanceof AST_If || node instanceof AST_Try) {
                    var save = in_if;
                    in_if = !in_block;
                    descend(node, this);
                    in_if = save;
                    return node;
                }
                else if (node instanceof AST_StatementWithBody || node instanceof AST_Switch) {
                    var save = in_block;
                    in_block = true;
                    descend(node, this);
                    in_block = save;
                    return node;
                }
                else if (node instanceof AST_Break && this.loopcontrol_target(node.label) === self) {
                    if (in_if) {
                        ruined = true;
                        return node;
                    }
                    if (in_block) return node;
                    stopped = true;
                    return in_list ? MAP.skip : make_node(AST_EmptyStatement, node);
                }
                else if (node instanceof AST_SwitchBranch && this.parent() === self) {
                    if (stopped) return MAP.skip;
                    if (node instanceof AST_Case) {
                        var exp = node.expression.evaluate(compressor);
                        if (exp.length < 2) {
                            // got a case with non-constant expression, baling out
                            throw self;
                        }
                        if (exp[1] === value || started) {
                            started = true;
                            if (aborts(node)) stopped = true;
                            descend(node, this);
                            return node;
                        }
                        return MAP.skip;
                    }
                    descend(node, this);
                    return node;
                }
            });
            tt.stack = compressor.stack.slice(); // so that's able to see parent nodes
            self = self.transform(tt);
        } catch(ex) {
            if (ex !== self) throw ex;
        }
        return self;
    });

    OPT(AST_Case, function(self, compressor){
        self.body = tighten_body(self.body, compressor);
        return self;
    });

    OPT(AST_Try, function(self, compressor){
        self.body = tighten_body(self.body, compressor);
        return self;
    });

    AST_Definitions.DEFMETHOD("remove_initializers", function(){
        this.definitions.forEach(function(def){ def.value = null });
    });

    AST_Definitions.DEFMETHOD("to_assignments", function(){
        var assignments = this.definitions.reduce(function(a, def){
            if (def.value) {
                var name = make_node(AST_SymbolRef, def.name, def.name);
                a.push(make_node(AST_Assign, def, {
                    operator : "=",
                    left     : name,
                    right    : def.value
                }));
            }
            return a;
        }, []);
        if (assignments.length == 0) return null;
        return AST_Seq.from_array(assignments);
    });

    OPT(AST_Definitions, function(self, compressor){
        if (self.definitions.length == 0)
            return make_node(AST_EmptyStatement, self);
        return self;
    });

    OPT(AST_Function, function(self, compressor){
        self = AST_Lambda.prototype.optimize.call(self, compressor);
        if (compressor.option("unused") && !compressor.option("keep_fnames")) {
            if (self.name && self.name.unreferenced()) {
                self.name = null;
            }
        }
        return self;
    });

    OPT(AST_Call, function(self, compressor){
        if (compressor.option("unsafe")) {
            var exp = self.expression;
            if (exp instanceof AST_SymbolRef && exp.undeclared()) {
                switch (exp.name) {
                  case "Array":
                    if (self.args.length != 1) {
                        return make_node(AST_Array, self, {
                            elements: self.args
                        }).transform(compressor);
                    }
                    break;
                  case "Object":
                    if (self.args.length == 0) {
                        return make_node(AST_Object, self, {
                            properties: []
                        });
                    }
                    break;
                  case "String":
                    if (self.args.length == 0) return make_node(AST_String, self, {
                        value: ""
                    });
                    if (self.args.length <= 1) return make_node(AST_Binary, self, {
                        left: self.args[0],
                        operator: "+",
                        right: make_node(AST_String, self, { value: "" })
                    }).transform(compressor);
                    break;
                  case "Number":
                    if (self.args.length == 0) return make_node(AST_Number, self, {
                        value: 0
                    });
                    if (self.args.length == 1) return make_node(AST_UnaryPrefix, self, {
                        expression: self.args[0],
                        operator: "+"
                    }).transform(compressor);
                  case "Boolean":
                    if (self.args.length == 0) return make_node(AST_False, self);
                    if (self.args.length == 1) return make_node(AST_UnaryPrefix, self, {
                        expression: make_node(AST_UnaryPrefix, null, {
                            expression: self.args[0],
                            operator: "!"
                        }),
                        operator: "!"
                    }).transform(compressor);
                    break;
                  case "Function":
                    // new Function() => function(){}
                    if (self.args.length == 0) return make_node(AST_Function, self, {
                        argnames: [],
                        body: []
                    });
                    if (all(self.args, function(x){ return x instanceof AST_String })) {
                        // quite a corner-case, but we can handle it:
                        //   https://github.com/mishoo/UglifyJS2/issues/203
                        // if the code argument is a constant, then we can minify it.
                        try {
                            var code = "(function(" + self.args.slice(0, -1).map(function(arg){
                                return arg.value;
                            }).join(",") + "){" + self.args[self.args.length - 1].value + "})()";
                            var ast = parse(code);
                            ast.figure_out_scope({ screw_ie8: compressor.option("screw_ie8") });
                            var comp = new Compressor(compressor.options);
                            ast = ast.transform(comp);
                            ast.figure_out_scope({ screw_ie8: compressor.option("screw_ie8") });
                            ast.mangle_names();
                            var fun;
                            try {
                                ast.walk(new TreeWalker(function(node){
                                    if (node instanceof AST_Lambda) {
                                        fun = node;
                                        throw ast;
                                    }
                                }));
                            } catch(ex) {
                                if (ex !== ast) throw ex;
                            };
                            if (!fun) return self;
                            var args = fun.argnames.map(function(arg, i){
                                return make_node(AST_String, self.args[i], {
                                    value: arg.print_to_string()
                                });
                            });
                            var code = OutputStream();
                            AST_BlockStatement.prototype._codegen.call(fun, fun, code);
                            code = code.toString().replace(/^\{|\}$/g, "");
                            args.push(make_node(AST_String, self.args[self.args.length - 1], {
                                value: code
                            }));
                            self.args = args;
                            return self;
                        } catch(ex) {
                            if (ex instanceof JS_Parse_Error) {
                                compressor.warn("Error parsing code passed to new Function [{file}:{line},{col}]", self.args[self.args.length - 1].start);
                                compressor.warn(ex.toString());
                            } else {
                                console.log(ex);
                                throw ex;
                            }
                        }
                    }
                    break;
                }
            }
            else if (exp instanceof AST_Dot && exp.property == "toString" && self.args.length == 0) {
                return make_node(AST_Binary, self, {
                    left: make_node(AST_String, self, { value: "" }),
                    operator: "+",
                    right: exp.expression
                }).transform(compressor);
            }
            else if (exp instanceof AST_Dot && exp.expression instanceof AST_Array && exp.property == "join") EXIT: {
                var separator = self.args.length == 0 ? "," : self.args[0].evaluate(compressor)[1];
                if (separator == null) break EXIT; // not a constant
                var elements = exp.expression.elements.reduce(function(a, el){
                    el = el.evaluate(compressor);
                    if (a.length == 0 || el.length == 1) {
                        a.push(el);
                    } else {
                        var last = a[a.length - 1];
                        if (last.length == 2) {
                            // it's a constant
                            var val = "" + last[1] + separator + el[1];
                            a[a.length - 1] = [ make_node_from_constant(compressor, val, last[0]), val ];
                        } else {
                            a.push(el);
                        }
                    }
                    return a;
                }, []);
                if (elements.length == 0) return make_node(AST_String, self, { value: "" });
                if (elements.length == 1) return elements[0][0];
                if (separator == "") {
                    var first;
                    if (elements[0][0] instanceof AST_String
                        || elements[1][0] instanceof AST_String) {
                        first = elements.shift()[0];
                    } else {
                        first = make_node(AST_String, self, { value: "" });
                    }
                    return elements.reduce(function(prev, el){
                        return make_node(AST_Binary, el[0], {
                            operator : "+",
                            left     : prev,
                            right    : el[0],
                        });
                    }, first).transform(compressor);
                }
                // need this awkward cloning to not affect original element
                // best_of will decide which one to get through.
                var node = self.clone();
                node.expression = node.expression.clone();
                node.expression.expression = node.expression.expression.clone();
                node.expression.expression.elements = elements.map(function(el){
                    return el[0];
                });
                return best_of(self, node);
            }
        }
        if (compressor.option("side_effects")) {
            if (self.expression instanceof AST_Function
                && self.args.length == 0
                && !AST_Block.prototype.has_side_effects.call(self.expression, compressor)) {
                return make_node(AST_Undefined, self).transform(compressor);
            }
        }
        if (compressor.option("drop_console")) {
            if (self.expression instanceof AST_PropAccess) {
                var name = self.expression.expression;
                while (name.expression) {
                    name = name.expression;
                }
                if (name instanceof AST_SymbolRef
                    && name.name == "console"
                    && name.undeclared()) {
                    return make_node(AST_Undefined, self).transform(compressor);
                }
            }
        }
        return self.evaluate(compressor)[0];
    });

    OPT(AST_New, function(self, compressor){
        if (compressor.option("unsafe")) {
            var exp = self.expression;
            if (exp instanceof AST_SymbolRef && exp.undeclared()) {
                switch (exp.name) {
                  case "Object":
                  case "RegExp":
                  case "Function":
                  case "Error":
                  case "Array":
                    return make_node(AST_Call, self, self).transform(compressor);
                }
            }
        }
        return self;
    });

    OPT(AST_Seq, function(self, compressor){
        if (!compressor.option("side_effects"))
            return self;
        if (!self.car.has_side_effects(compressor)) {
            return maintain_this_binding(compressor.parent(), self, self.cdr);
        }
        if (compressor.option("cascade")) {
            if (self.car instanceof AST_Assign
                && !self.car.left.has_side_effects(compressor)) {
                if (self.car.left.equivalent_to(self.cdr)) {
                    return self.car;
                }
                if (self.cdr instanceof AST_Call
                    && self.cdr.expression.equivalent_to(self.car.left)) {
                    self.cdr.expression = self.car;
                    return self.cdr;
                }
            }
            if (!self.car.has_side_effects(compressor)
                && !self.cdr.has_side_effects(compressor)
                && self.car.equivalent_to(self.cdr)) {
                return self.car;
            }
        }
        if (self.cdr instanceof AST_UnaryPrefix
            && self.cdr.operator == "void"
            && !self.cdr.expression.has_side_effects(compressor)) {
            self.cdr.expression = self.car;
            return self.cdr;
        }
        if (self.cdr instanceof AST_Undefined) {
            return make_node(AST_UnaryPrefix, self, {
                operator   : "void",
                expression : self.car
            });
        }
        return self;
    });

    AST_Unary.DEFMETHOD("lift_sequences", function(compressor){
        if (compressor.option("sequences")) {
            if (this.expression instanceof AST_Seq) {
                var seq = this.expression;
                var x = seq.to_array();
                this.expression = x.pop();
                x.push(this);
                seq = AST_Seq.from_array(x).transform(compressor);
                return seq;
            }
        }
        return this;
    });

    OPT(AST_UnaryPostfix, function(self, compressor){
        return self.lift_sequences(compressor);
    });

    OPT(AST_UnaryPrefix, function(self, compressor){
        self = self.lift_sequences(compressor);
        var e = self.expression;
        if (compressor.option("booleans") && compressor.in_boolean_context()) {
            switch (self.operator) {
              case "!":
                if (e instanceof AST_UnaryPrefix && e.operator == "!") {
                    // !!foo ==> foo, if we're in boolean context
                    return e.expression;
                }
                break;
              case "typeof":
                // typeof always returns a non-empty string, thus it's
                // always true in booleans
                compressor.warn("Boolean expression always true [{file}:{line},{col}]", self.start);
                return make_node(AST_True, self);
            }
            if (e instanceof AST_Binary && self.operator == "!") {
                self = best_of(self, e.negate(compressor));
            }
        }
        return self.evaluate(compressor)[0];
    });

    function has_side_effects_or_prop_access(node, compressor) {
        var save_pure_getters = compressor.option("pure_getters");
        compressor.options.pure_getters = false;
        var ret = node.has_side_effects(compressor);
        compressor.options.pure_getters = save_pure_getters;
        return ret;
    }

    AST_Binary.DEFMETHOD("lift_sequences", function(compressor){
        if (compressor.option("sequences")) {
            if (this.left instanceof AST_Seq) {
                var seq = this.left;
                var x = seq.to_array();
                this.left = x.pop();
                x.push(this);
                seq = AST_Seq.from_array(x).transform(compressor);
                return seq;
            }
            if (this.right instanceof AST_Seq
                && this instanceof AST_Assign
                && !has_side_effects_or_prop_access(this.left, compressor)) {
                var seq = this.right;
                var x = seq.to_array();
                this.right = x.pop();
                x.push(this);
                seq = AST_Seq.from_array(x).transform(compressor);
                return seq;
            }
        }
        return this;
    });

    var commutativeOperators = makePredicate("== === != !== * & | ^");

    OPT(AST_Binary, function(self, compressor){
        function reverse(op, force) {
            if (force || !(self.left.has_side_effects(compressor) || self.right.has_side_effects(compressor))) {
                if (op) self.operator = op;
                var tmp = self.left;
                self.left = self.right;
                self.right = tmp;
            }
        }
        if (commutativeOperators(self.operator)) {
            if (self.right instanceof AST_Constant
                && !(self.left instanceof AST_Constant)) {
                // if right is a constant, whatever side effects the
                // left side might have could not influence the
                // result.  hence, force switch.

                if (!(self.left instanceof AST_Binary
                      && PRECEDENCE[self.left.operator] >= PRECEDENCE[self.operator])) {
                    reverse(null, true);
                }
            }
            if (/^[!=]==?$/.test(self.operator)) {
                if (self.left instanceof AST_SymbolRef && self.right instanceof AST_Conditional) {
                    if (self.right.consequent instanceof AST_SymbolRef
                        && self.right.consequent.definition() === self.left.definition()) {
                        if (/^==/.test(self.operator)) return self.right.condition;
                        if (/^!=/.test(self.operator)) return self.right.condition.negate(compressor);
                    }
                    if (self.right.alternative instanceof AST_SymbolRef
                        && self.right.alternative.definition() === self.left.definition()) {
                        if (/^==/.test(self.operator)) return self.right.condition.negate(compressor);
                        if (/^!=/.test(self.operator)) return self.right.condition;
                    }
                }
                if (self.right instanceof AST_SymbolRef && self.left instanceof AST_Conditional) {
                    if (self.left.consequent instanceof AST_SymbolRef
                        && self.left.consequent.definition() === self.right.definition()) {
                        if (/^==/.test(self.operator)) return self.left.condition;
                        if (/^!=/.test(self.operator)) return self.left.condition.negate(compressor);
                    }
                    if (self.left.alternative instanceof AST_SymbolRef
                        && self.left.alternative.definition() === self.right.definition()) {
                        if (/^==/.test(self.operator)) return self.left.condition.negate(compressor);
                        if (/^!=/.test(self.operator)) return self.left.condition;
                    }
                }
            }
        }
        self = self.lift_sequences(compressor);
        if (compressor.option("comparisons")) switch (self.operator) {
          case "===":
          case "!==":
            if ((self.left.is_string(compressor) && self.right.is_string(compressor)) ||
                (self.left.is_boolean() && self.right.is_boolean())) {
                self.operator = self.operator.substr(0, 2);
            }
            // XXX: intentionally falling down to the next case
          case "==":
          case "!=":
            if (self.left instanceof AST_String
                && self.left.value == "undefined"
                && self.right instanceof AST_UnaryPrefix
                && self.right.operator == "typeof"
                && compressor.option("unsafe")) {
                if (!(self.right.expression instanceof AST_SymbolRef)
                    || !self.right.expression.undeclared()) {
                    self.right = self.right.expression;
                    self.left = make_node(AST_Undefined, self.left).optimize(compressor);
                    if (self.operator.length == 2) self.operator += "=";
                }
            }
            break;
        }
        if (compressor.option("conditionals")) {
            if (self.operator == "&&") {
                var ll = self.left.evaluate(compressor);
                if (ll.length > 1) {
                    if (ll[1]) {
                        compressor.warn("Condition left of && always true [{file}:{line},{col}]", self.start);
                        return maintain_this_binding(compressor.parent(), self, self.right.evaluate(compressor)[0]);
                    } else {
                        compressor.warn("Condition left of && always false [{file}:{line},{col}]", self.start);
                        return maintain_this_binding(compressor.parent(), self, ll[0]);
                    }
                }
            }
            else if (self.operator == "||") {
                var ll = self.left.evaluate(compressor);
                if (ll.length > 1) {
                    if (ll[1]) {
                        compressor.warn("Condition left of || always true [{file}:{line},{col}]", self.start);
                        return maintain_this_binding(compressor.parent(), self, ll[0]);
                    } else {
                        compressor.warn("Condition left of || always false [{file}:{line},{col}]", self.start);
                        return maintain_this_binding(compressor.parent(), self, self.right.evaluate(compressor)[0]);
                    }
                }
            }
        }
        if (compressor.option("booleans") && compressor.in_boolean_context()) switch (self.operator) {
          case "&&":
            var ll = self.left.evaluate(compressor);
            var rr = self.right.evaluate(compressor);
            if ((ll.length > 1 && !ll[1]) || (rr.length > 1 && !rr[1])) {
                compressor.warn("Boolean && always false [{file}:{line},{col}]", self.start);
                if (self.left.has_side_effects(compressor)) {
                    return make_node(AST_Seq, self, {
                        car: self.left,
                        cdr: make_node(AST_False)
                    }).optimize(compressor);
                }
                return make_node(AST_False, self);
            }
            if (ll.length > 1 && ll[1]) {
                return rr[0];
            }
            if (rr.length > 1 && rr[1]) {
                return ll[0];
            }
            break;
          case "||":
            var ll = self.left.evaluate(compressor);
            var rr = self.right.evaluate(compressor);
            if ((ll.length > 1 && ll[1]) || (rr.length > 1 && rr[1])) {
                compressor.warn("Boolean || always true [{file}:{line},{col}]", self.start);
                if (self.left.has_side_effects(compressor)) {
                    return make_node(AST_Seq, self, {
                        car: self.left,
                        cdr: make_node(AST_True)
                    }).optimize(compressor);
                }
                return make_node(AST_True, self);
            }
            if (ll.length > 1 && !ll[1]) {
                return rr[0];
            }
            if (rr.length > 1 && !rr[1]) {
                return ll[0];
            }
            break;
          case "+":
            var ll = self.left.evaluate(compressor);
            var rr = self.right.evaluate(compressor);
            if ((ll.length > 1 && ll[0] instanceof AST_String && ll[1]) ||
                (rr.length > 1 && rr[0] instanceof AST_String && rr[1])) {
                compressor.warn("+ in boolean context always true [{file}:{line},{col}]", self.start);
                return make_node(AST_True, self);
            }
            break;
        }
        if (compressor.option("comparisons") && self.is_boolean()) {
            if (!(compressor.parent() instanceof AST_Binary)
                || compressor.parent() instanceof AST_Assign) {
                var negated = make_node(AST_UnaryPrefix, self, {
                    operator: "!",
                    expression: self.negate(compressor)
                });
                self = best_of(self, negated);
            }
            switch (self.operator) {
              case "<": reverse(">"); break;
              case "<=": reverse(">="); break;
            }
        }
        if (self.operator == "+" && self.right instanceof AST_String
            && self.right.getValue() === "" && self.left instanceof AST_Binary
            && self.left.operator == "+" && self.left.is_string(compressor)) {
            return self.left;
        }
        if (compressor.option("evaluate")) {
            if (self.operator == "+") {
                if (self.left instanceof AST_Constant
                    && self.right instanceof AST_Binary
                    && self.right.operator == "+"
                    && self.right.left instanceof AST_Constant
                    && self.right.is_string(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "+",
                        left: make_node(AST_String, null, {
                            value: "" + self.left.getValue() + self.right.left.getValue(),
                            start: self.left.start,
                            end: self.right.left.end
                        }),
                        right: self.right.right
                    });
                }
                if (self.right instanceof AST_Constant
                    && self.left instanceof AST_Binary
                    && self.left.operator == "+"
                    && self.left.right instanceof AST_Constant
                    && self.left.is_string(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "+",
                        left: self.left.left,
                        right: make_node(AST_String, null, {
                            value: "" + self.left.right.getValue() + self.right.getValue(),
                            start: self.left.right.start,
                            end: self.right.end
                        })
                    });
                }
                if (self.left instanceof AST_Binary
                    && self.left.operator == "+"
                    && self.left.is_string(compressor)
                    && self.left.right instanceof AST_Constant
                    && self.right instanceof AST_Binary
                    && self.right.operator == "+"
                    && self.right.left instanceof AST_Constant
                    && self.right.is_string(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "+",
                        left: make_node(AST_Binary, self.left, {
                            operator: "+",
                            left: self.left.left,
                            right: make_node(AST_String, null, {
                                value: "" + self.left.right.getValue() + self.right.left.getValue(),
                                start: self.left.right.start,
                                end: self.right.left.end
                            })
                        }),
                        right: self.right.right
                    });
                }
            }
        }
        // x && (y && z)  ==>  x && y && z
        // x || (y || z)  ==>  x || y || z
        if (self.right instanceof AST_Binary
            && self.right.operator == self.operator
            && (self.operator == "&&" || self.operator == "||"))
        {
            self.left = make_node(AST_Binary, self.left, {
                operator : self.operator,
                left     : self.left,
                right    : self.right.left
            });
            self.right = self.right.right;
            return self.transform(compressor);
        }
        return self.evaluate(compressor)[0];
    });

    OPT(AST_SymbolRef, function(self, compressor){
        function isLHS(symbol, parent) {
            return (
                parent instanceof AST_Binary &&
                parent.operator === '=' &&
                parent.left === symbol
            );
        }

        if (self.undeclared() && !isLHS(self, compressor.parent())) {
            var defines = compressor.option("global_defs");
            if (defines && defines.hasOwnProperty(self.name)) {
                return make_node_from_constant(compressor, defines[self.name], self);
            }
            switch (self.name) {
              case "undefined":
                return make_node(AST_Undefined, self);
              case "NaN":
                return make_node(AST_NaN, self).transform(compressor);
              case "Infinity":
                return make_node(AST_Infinity, self).transform(compressor);
            }
        }
        return self;
    });

    OPT(AST_Infinity, function (self, compressor) {
        return make_node(AST_Binary, self, {
            operator : '/',
            left     : make_node(AST_Number, self, {value: 1}),
            right    : make_node(AST_Number, self, {value: 0})
        });
    });

    OPT(AST_Undefined, function(self, compressor){
        if (compressor.option("unsafe")) {
            var scope = compressor.find_parent(AST_Scope);
            var undef = scope.find_variable("undefined");
            if (undef) {
                var ref = make_node(AST_SymbolRef, self, {
                    name   : "undefined",
                    scope  : scope,
                    thedef : undef
                });
                ref.reference();
                return ref;
            }
        }
        return self;
    });

    var ASSIGN_OPS = [ '+', '-', '/', '*', '%', '>>', '<<', '>>>', '|', '^', '&' ];
    OPT(AST_Assign, function(self, compressor){
        self = self.lift_sequences(compressor);
        if (self.operator == "="
            && self.left instanceof AST_SymbolRef
            && self.right instanceof AST_Binary
            && self.right.left instanceof AST_SymbolRef
            && self.right.left.name == self.left.name
            && member(self.right.operator, ASSIGN_OPS)) {
            self.operator = self.right.operator + "=";
            self.right = self.right.right;
        }
        return self;
    });

    OPT(AST_Conditional, function(self, compressor){
        if (!compressor.option("conditionals")) return self;
        if (self.condition instanceof AST_Seq) {
            var car = self.condition.car;
            self.condition = self.condition.cdr;
            return AST_Seq.cons(car, self);
        }
        var cond = self.condition.evaluate(compressor);
        if (cond.length > 1) {
            if (cond[1]) {
                compressor.warn("Condition always true [{file}:{line},{col}]", self.start);
                return maintain_this_binding(compressor.parent(), self, self.consequent);
            } else {
                compressor.warn("Condition always false [{file}:{line},{col}]", self.start);
                return maintain_this_binding(compressor.parent(), self, self.alternative);
            }
        }
        var negated = cond[0].negate(compressor);
        if (best_of(cond[0], negated) === negated) {
            self = make_node(AST_Conditional, self, {
                condition: negated,
                consequent: self.alternative,
                alternative: self.consequent
            });
        }
        var consequent = self.consequent;
        var alternative = self.alternative;
        if (consequent instanceof AST_Assign
            && alternative instanceof AST_Assign
            && consequent.operator == alternative.operator
            && consequent.left.equivalent_to(alternative.left)
            && !consequent.left.has_side_effects(compressor)
           ) {
            /*
             * Stuff like this:
             * if (foo) exp = something; else exp = something_else;
             * ==>
             * exp = foo ? something : something_else;
             */
            return make_node(AST_Assign, self, {
                operator: consequent.operator,
                left: consequent.left,
                right: make_node(AST_Conditional, self, {
                    condition: self.condition,
                    consequent: consequent.right,
                    alternative: alternative.right
                })
            });
        }
        if (consequent instanceof AST_Call
            && alternative.TYPE === consequent.TYPE
            && consequent.args.length == alternative.args.length
            && !consequent.expression.has_side_effects(compressor)
            && consequent.expression.equivalent_to(alternative.expression)) {
            if (consequent.args.length == 0) {
                return make_node(AST_Seq, self, {
                    car: self.condition,
                    cdr: consequent
                });
            }
            if (consequent.args.length == 1) {
                consequent.args[0] = make_node(AST_Conditional, self, {
                    condition: self.condition,
                    consequent: consequent.args[0],
                    alternative: alternative.args[0]
                });
                return consequent;
            }
        }
        // x?y?z:a:a --> x&&y?z:a
        if (consequent instanceof AST_Conditional
            && consequent.alternative.equivalent_to(alternative)) {
            return make_node(AST_Conditional, self, {
                condition: make_node(AST_Binary, self, {
                    left: self.condition,
                    operator: "&&",
                    right: consequent.condition
                }),
                consequent: consequent.consequent,
                alternative: alternative
            });
        }
        // y?1:1 --> 1
        if (consequent.is_constant(compressor)
            && alternative.is_constant(compressor)
            && consequent.equivalent_to(alternative)) {
            var consequent_value = consequent.constant_value();
            if (self.condition.has_side_effects(compressor)) {
                return AST_Seq.from_array([self.condition, make_node_from_constant(compressor, consequent_value, self)]);
            } else {
                return make_node_from_constant(compressor, consequent_value, self);
            }
        }

        // y?true:false --> !!y
        if (is_true(consequent) && is_false(alternative)) {
            if (self.condition.is_boolean()) {
                // boolean_expression ? true : false --> boolean_expression
                return self.condition;
            }
            self.condition = self.condition.negate(compressor);
            return make_node(AST_UnaryPrefix, self.condition, {
                operator: "!",
                expression: self.condition
            });
        }
        // y?false:true --> !y
        if (is_false(consequent) && is_true(alternative)) {
            return self.condition.negate(compressor)
        }
        return self;

        // AST_True or !0
        function is_true(node) {
            return node instanceof AST_True
                || (node instanceof AST_UnaryPrefix
                    && node.operator == "!"
                    && node.expression instanceof AST_Constant
                    && !node.expression.value);
        }
        // AST_False or !1
        function is_false(node) {
            return node instanceof AST_False
                || (node instanceof AST_UnaryPrefix
                    && node.operator == "!"
                    && node.expression instanceof AST_Constant
                    && !!node.expression.value);
        }
    });

    OPT(AST_Boolean, function(self, compressor){
        if (compressor.option("booleans")) {
            var p = compressor.parent();
            if (p instanceof AST_Binary && (p.operator == "=="
                                            || p.operator == "!=")) {
                compressor.warn("Non-strict equality against boolean: {operator} {value} [{file}:{line},{col}]", {
                    operator : p.operator,
                    value    : self.value,
                    file     : p.start.file,
                    line     : p.start.line,
                    col      : p.start.col,
                });
                return make_node(AST_Number, self, {
                    value: +self.value
                });
            }
            return make_node(AST_UnaryPrefix, self, {
                operator: "!",
                expression: make_node(AST_Number, self, {
                    value: 1 - self.value
                })
            });
        }
        return self;
    });

    OPT(AST_Sub, function(self, compressor){
        var prop = self.property;
        if (prop instanceof AST_String && compressor.option("properties")) {
            prop = prop.getValue();
            if (RESERVED_WORDS(prop) ? compressor.option("screw_ie8") : is_identifier_string(prop)) {
                return make_node(AST_Dot, self, {
                    expression : self.expression,
                    property   : prop
                }).optimize(compressor);
            }
            var v = parseFloat(prop);
            if (!isNaN(v) && v.toString() == prop) {
                self.property = make_node(AST_Number, self.property, {
                    value: v
                });
            }
        }
        return self;
    });

    OPT(AST_Dot, function(self, compressor){
        var prop = self.property;
        if (RESERVED_WORDS(prop) && !compressor.option("screw_ie8")) {
            return make_node(AST_Sub, self, {
                expression : self.expression,
                property   : make_node(AST_String, self, {
                    value: prop
                })
            }).optimize(compressor);
        }
        return self.evaluate(compressor)[0];
    });

    function literals_in_boolean_context(self, compressor) {
        if (compressor.option("booleans") && compressor.in_boolean_context() && !self.has_side_effects(compressor)) {
            return make_node(AST_True, self);
        }
        return self;
    };
    OPT(AST_Array, literals_in_boolean_context);
    OPT(AST_Object, literals_in_boolean_context);
    OPT(AST_RegExp, literals_in_boolean_context);

    OPT(AST_Return, function(self, compressor){
        if (self.value instanceof AST_Undefined) {
            self.value = null;
        }
        return self;
    });

})();

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

// a small wrapper around fitzgen's source-map library
function SourceMap(options) {
    options = defaults(options, {
        file : null,
        root : null,
        orig : null,

        orig_line_diff : 0,
        dest_line_diff : 0,
    });
    var generator = new MOZ_SourceMap.SourceMapGenerator({
        file       : options.file,
        sourceRoot : options.root
    });
    var orig_map = options.orig && new MOZ_SourceMap.SourceMapConsumer(options.orig);
    function add(source, gen_line, gen_col, orig_line, orig_col, name) {
        if (orig_map) {
            var info = orig_map.originalPositionFor({
                line: orig_line,
                column: orig_col
            });
            if (info.source === null) {
                return;
            }
            source = info.source;
            orig_line = info.line;
            orig_col = info.column;
            name = info.name || name;
        }
        generator.addMapping({
            generated : { line: gen_line + options.dest_line_diff, column: gen_col },
            original  : { line: orig_line + options.orig_line_diff, column: orig_col },
            source    : source,
            name      : name
        });
    };
    return {
        add        : add,
        get        : function() { return generator },
        toString   : function() { return JSON.stringify(generator.toJSON()); }
    };
};

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

(function(){

    var MOZ_TO_ME = {
        ExpressionStatement: function(M) {
            var expr = M.expression;
            if (expr.type === "Literal" && typeof expr.value === "string") {
                return new AST_Directive({
                    start: my_start_token(M),
                    end: my_end_token(M),
                    value: expr.value
                });
            }
            return new AST_SimpleStatement({
                start: my_start_token(M),
                end: my_end_token(M),
                body: from_moz(expr)
            });
        },
        TryStatement: function(M) {
            var handlers = M.handlers || [M.handler];
            if (handlers.length > 1 || M.guardedHandlers && M.guardedHandlers.length) {
                throw new Error("Multiple catch clauses are not supported.");
            }
            return new AST_Try({
                start    : my_start_token(M),
                end      : my_end_token(M),
                body     : from_moz(M.block).body,
                bcatch   : from_moz(handlers[0]),
                bfinally : M.finalizer ? new AST_Finally(from_moz(M.finalizer)) : null
            });
        },
        Property: function(M) {
            var key = M.key;
            var name = key.type == "Identifier" ? key.name : key.value;
            var args = {
                start    : my_start_token(key),
                end      : my_end_token(M.value),
                key      : name,
                value    : from_moz(M.value)
            };
            switch (M.kind) {
              case "init":
                return new AST_ObjectKeyVal(args);
              case "set":
                args.value.name = from_moz(key);
                return new AST_ObjectSetter(args);
              case "get":
                args.value.name = from_moz(key);
                return new AST_ObjectGetter(args);
            }
        },
        ObjectExpression: function(M) {
            return new AST_Object({
                start      : my_start_token(M),
                end        : my_end_token(M),
                properties : M.properties.map(function(prop){
                    prop.type = "Property";
                    return from_moz(prop)
                })
            });
        },
        SequenceExpression: function(M) {
            return AST_Seq.from_array(M.expressions.map(from_moz));
        },
        MemberExpression: function(M) {
            return new (M.computed ? AST_Sub : AST_Dot)({
                start      : my_start_token(M),
                end        : my_end_token(M),
                property   : M.computed ? from_moz(M.property) : M.property.name,
                expression : from_moz(M.object)
            });
        },
        SwitchCase: function(M) {
            return new (M.test ? AST_Case : AST_Default)({
                start      : my_start_token(M),
                end        : my_end_token(M),
                expression : from_moz(M.test),
                body       : M.consequent.map(from_moz)
            });
        },
        VariableDeclaration: function(M) {
            return new (M.kind === "const" ? AST_Const : AST_Var)({
                start       : my_start_token(M),
                end         : my_end_token(M),
                definitions : M.declarations.map(from_moz)
            });
        },
        Literal: function(M) {
            var val = M.value, args = {
                start  : my_start_token(M),
                end    : my_end_token(M)
            };
            if (val === null) return new AST_Null(args);
            switch (typeof val) {
              case "string":
                args.value = val;
                return new AST_String(args);
              case "number":
                args.value = val;
                return new AST_Number(args);
              case "boolean":
                return new (val ? AST_True : AST_False)(args);
              default:
                var rx = M.regex;
                if (rx && rx.pattern) {
                    // RegExpLiteral as per ESTree AST spec
                    args.value = new RegExp(rx.pattern, rx.flags).toString();
                } else {
                    // support legacy RegExp
                    args.value = M.regex && M.raw ? M.raw : val;
                }
                return new AST_RegExp(args);
            }
        },
        Identifier: function(M) {
            var p = FROM_MOZ_STACK[FROM_MOZ_STACK.length - 2];
            return new (  p.type == "LabeledStatement" ? AST_Label
                        : p.type == "VariableDeclarator" && p.id === M ? (p.kind == "const" ? AST_SymbolConst : AST_SymbolVar)
                        : p.type == "FunctionExpression" ? (p.id === M ? AST_SymbolLambda : AST_SymbolFunarg)
                        : p.type == "FunctionDeclaration" ? (p.id === M ? AST_SymbolDefun : AST_SymbolFunarg)
                        : p.type == "CatchClause" ? AST_SymbolCatch
                        : p.type == "BreakStatement" || p.type == "ContinueStatement" ? AST_LabelRef
                        : AST_SymbolRef)({
                            start : my_start_token(M),
                            end   : my_end_token(M),
                            name  : M.name
                        });
        }
    };

    MOZ_TO_ME.UpdateExpression =
    MOZ_TO_ME.UnaryExpression = function To_Moz_Unary(M) {
        var prefix = "prefix" in M ? M.prefix
            : M.type == "UnaryExpression" ? true : false;
        return new (prefix ? AST_UnaryPrefix : AST_UnaryPostfix)({
            start      : my_start_token(M),
            end        : my_end_token(M),
            operator   : M.operator,
            expression : from_moz(M.argument)
        });
    };

    map("Program", AST_Toplevel, "body@body");
    map("EmptyStatement", AST_EmptyStatement);
    map("BlockStatement", AST_BlockStatement, "body@body");
    map("IfStatement", AST_If, "test>condition, consequent>body, alternate>alternative");
    map("LabeledStatement", AST_LabeledStatement, "label>label, body>body");
    map("BreakStatement", AST_Break, "label>label");
    map("ContinueStatement", AST_Continue, "label>label");
    map("WithStatement", AST_With, "object>expression, body>body");
    map("SwitchStatement", AST_Switch, "discriminant>expression, cases@body");
    map("ReturnStatement", AST_Return, "argument>value");
    map("ThrowStatement", AST_Throw, "argument>value");
    map("WhileStatement", AST_While, "test>condition, body>body");
    map("DoWhileStatement", AST_Do, "test>condition, body>body");
    map("ForStatement", AST_For, "init>init, test>condition, update>step, body>body");
    map("ForInStatement", AST_ForIn, "left>init, right>object, body>body");
    map("DebuggerStatement", AST_Debugger);
    map("FunctionDeclaration", AST_Defun, "id>name, params@argnames, body%body");
    map("VariableDeclarator", AST_VarDef, "id>name, init>value");
    map("CatchClause", AST_Catch, "param>argname, body%body");

    map("ThisExpression", AST_This);
    map("ArrayExpression", AST_Array, "elements@elements");
    map("FunctionExpression", AST_Function, "id>name, params@argnames, body%body");
    map("BinaryExpression", AST_Binary, "operator=operator, left>left, right>right");
    map("LogicalExpression", AST_Binary, "operator=operator, left>left, right>right");
    map("AssignmentExpression", AST_Assign, "operator=operator, left>left, right>right");
    map("ConditionalExpression", AST_Conditional, "test>condition, consequent>consequent, alternate>alternative");
    map("NewExpression", AST_New, "callee>expression, arguments@args");
    map("CallExpression", AST_Call, "callee>expression, arguments@args");

    def_to_moz(AST_Directive, function To_Moz_Directive(M) {
        return {
            type: "ExpressionStatement",
            expression: {
                type: "Literal",
                value: M.value
            }
        };
    });

    def_to_moz(AST_SimpleStatement, function To_Moz_ExpressionStatement(M) {
        return {
            type: "ExpressionStatement",
            expression: to_moz(M.body)
        };
    });

    def_to_moz(AST_SwitchBranch, function To_Moz_SwitchCase(M) {
        return {
            type: "SwitchCase",
            test: to_moz(M.expression),
            consequent: M.body.map(to_moz)
        };
    });

    def_to_moz(AST_Try, function To_Moz_TryStatement(M) {
        return {
            type: "TryStatement",
            block: to_moz_block(M),
            handler: to_moz(M.bcatch),
            guardedHandlers: [],
            finalizer: to_moz(M.bfinally)
        };
    });

    def_to_moz(AST_Catch, function To_Moz_CatchClause(M) {
        return {
            type: "CatchClause",
            param: to_moz(M.argname),
            guard: null,
            body: to_moz_block(M)
        };
    });

    def_to_moz(AST_Definitions, function To_Moz_VariableDeclaration(M) {
        return {
            type: "VariableDeclaration",
            kind: M instanceof AST_Const ? "const" : "var",
            declarations: M.definitions.map(to_moz)
        };
    });

    def_to_moz(AST_Seq, function To_Moz_SequenceExpression(M) {
        return {
            type: "SequenceExpression",
            expressions: M.to_array().map(to_moz)
        };
    });

    def_to_moz(AST_PropAccess, function To_Moz_MemberExpression(M) {
        var isComputed = M instanceof AST_Sub;
        return {
            type: "MemberExpression",
            object: to_moz(M.expression),
            computed: isComputed,
            property: isComputed ? to_moz(M.property) : {type: "Identifier", name: M.property}
        };
    });

    def_to_moz(AST_Unary, function To_Moz_Unary(M) {
        return {
            type: M.operator == "++" || M.operator == "--" ? "UpdateExpression" : "UnaryExpression",
            operator: M.operator,
            prefix: M instanceof AST_UnaryPrefix,
            argument: to_moz(M.expression)
        };
    });

    def_to_moz(AST_Binary, function To_Moz_BinaryExpression(M) {
        return {
            type: M.operator == "&&" || M.operator == "||" ? "LogicalExpression" : "BinaryExpression",
            left: to_moz(M.left),
            operator: M.operator,
            right: to_moz(M.right)
        };
    });

    def_to_moz(AST_Object, function To_Moz_ObjectExpression(M) {
        return {
            type: "ObjectExpression",
            properties: M.properties.map(to_moz)
        };
    });

    def_to_moz(AST_ObjectProperty, function To_Moz_Property(M) {
        var key = (
            is_identifier(M.key)
            ? {type: "Identifier", name: M.key}
            : {type: "Literal", value: M.key}
        );
        var kind;
        if (M instanceof AST_ObjectKeyVal) {
            kind = "init";
        } else
        if (M instanceof AST_ObjectGetter) {
            kind = "get";
        } else
        if (M instanceof AST_ObjectSetter) {
            kind = "set";
        }
        return {
            type: "Property",
            kind: kind,
            key: key,
            value: to_moz(M.value)
        };
    });

    def_to_moz(AST_Symbol, function To_Moz_Identifier(M) {
        var def = M.definition();
        return {
            type: "Identifier",
            name: def ? def.mangled_name || def.name : M.name
        };
    });

    def_to_moz(AST_RegExp, function To_Moz_RegExpLiteral(M) {
        var value = M.value;
        return {
            type: "Literal",
            value: value,
            raw: value.toString(),
            regex: {
                pattern: value.source,
                flags: value.toString().match(/[gimuy]*$/)[0]
            }
        };
    });

    def_to_moz(AST_Constant, function To_Moz_Literal(M) {
        var value = M.value;
        if (typeof value === 'number' && (value < 0 || (value === 0 && 1 / value < 0))) {
            return {
                type: "UnaryExpression",
                operator: "-",
                prefix: true,
                argument: {
                    type: "Literal",
                    value: -value,
                    raw: M.start.raw
                }
            };
        }
        return {
            type: "Literal",
            value: value,
            raw: M.start.raw
        };
    });

    def_to_moz(AST_Atom, function To_Moz_Atom(M) {
        return {
            type: "Identifier",
            name: String(M.value)
        };
    });

    AST_Boolean.DEFMETHOD("to_mozilla_ast", AST_Constant.prototype.to_mozilla_ast);
    AST_Null.DEFMETHOD("to_mozilla_ast", AST_Constant.prototype.to_mozilla_ast);
    AST_Hole.DEFMETHOD("to_mozilla_ast", function To_Moz_ArrayHole() { return null });

    AST_Block.DEFMETHOD("to_mozilla_ast", AST_BlockStatement.prototype.to_mozilla_ast);
    AST_Lambda.DEFMETHOD("to_mozilla_ast", AST_Function.prototype.to_mozilla_ast);

    /* -----[ tools ]----- */

    function raw_token(moznode) {
        if (moznode.type == "Literal") {
            return moznode.raw != null ? moznode.raw : moznode.value + "";
        }
    }

    function my_start_token(moznode) {
        var loc = moznode.loc, start = loc && loc.start;
        var range = moznode.range;
        return new AST_Token({
            file    : loc && loc.source,
            line    : start && start.line,
            col     : start && start.column,
            pos     : range ? range[0] : moznode.start,
            endline : start && start.line,
            endcol  : start && start.column,
            endpos  : range ? range[0] : moznode.start,
            raw     : raw_token(moznode),
        });
    };

    function my_end_token(moznode) {
        var loc = moznode.loc, end = loc && loc.end;
        var range = moznode.range;
        return new AST_Token({
            file    : loc && loc.source,
            line    : end && end.line,
            col     : end && end.column,
            pos     : range ? range[1] : moznode.end,
            endline : end && end.line,
            endcol  : end && end.column,
            endpos  : range ? range[1] : moznode.end,
            raw     : raw_token(moznode),
        });
    };

    function map(moztype, mytype, propmap) {
        var moz_to_me = "function From_Moz_" + moztype + "(M){\n";
        moz_to_me += "return new U2." + mytype.name + "({\n" +
            "start: my_start_token(M),\n" +
            "end: my_end_token(M)";

        var me_to_moz = "function To_Moz_" + moztype + "(M){\n";
        me_to_moz += "return {\n" +
            "type: " + JSON.stringify(moztype);

        if (propmap) propmap.split(/\s*,\s*/).forEach(function(prop){
            var m = /([a-z0-9$_]+)(=|@|>|%)([a-z0-9$_]+)/i.exec(prop);
            if (!m) throw new Error("Can't understand property map: " + prop);
            var moz = m[1], how = m[2], my = m[3];
            moz_to_me += ",\n" + my + ": ";
            me_to_moz += ",\n" + moz + ": ";
            switch (how) {
                case "@":
                    moz_to_me += "M." + moz + ".map(from_moz)";
                    me_to_moz += "M." +  my + ".map(to_moz)";
                    break;
                case ">":
                    moz_to_me += "from_moz(M." + moz + ")";
                    me_to_moz += "to_moz(M." + my + ")";
                    break;
                case "=":
                    moz_to_me += "M." + moz;
                    me_to_moz += "M." + my;
                    break;
                case "%":
                    moz_to_me += "from_moz(M." + moz + ").body";
                    me_to_moz += "to_moz_block(M)";
                    break;
                default:
                    throw new Error("Can't understand operator in propmap: " + prop);
            }
        });

        moz_to_me += "\n})\n}";
        me_to_moz += "\n}\n}";

        //moz_to_me = parse(moz_to_me).print_to_string({ beautify: true });
        //me_to_moz = parse(me_to_moz).print_to_string({ beautify: true });
        //console.log(moz_to_me);

        moz_to_me = new Function("U2", "my_start_token", "my_end_token", "from_moz", "return(" + moz_to_me + ")")(
            exports, my_start_token, my_end_token, from_moz
        );
        me_to_moz = new Function("to_moz", "to_moz_block", "return(" + me_to_moz + ")")(
            to_moz, to_moz_block
        );
        MOZ_TO_ME[moztype] = moz_to_me;
        def_to_moz(mytype, me_to_moz);
    };

    var FROM_MOZ_STACK = null;

    function from_moz(node) {
        FROM_MOZ_STACK.push(node);
        var ret = node != null ? MOZ_TO_ME[node.type](node) : null;
        FROM_MOZ_STACK.pop();
        return ret;
    };

    AST_Node.from_mozilla_ast = function(node){
        var save_stack = FROM_MOZ_STACK;
        FROM_MOZ_STACK = [];
        var ast = from_moz(node);
        FROM_MOZ_STACK = save_stack;
        return ast;
    };

    function set_moz_loc(mynode, moznode, myparent) {
        var start = mynode.start;
        var end = mynode.end;
        if (start.pos != null && end.endpos != null) {
            moznode.range = [start.pos, end.endpos];
        }
        if (start.line) {
            moznode.loc = {
                start: {line: start.line, column: start.col},
                end: end.endline ? {line: end.endline, column: end.endcol} : null
            };
            if (start.file) {
                moznode.loc.source = start.file;
            }
        }
        return moznode;
    };

    function def_to_moz(mytype, handler) {
        mytype.DEFMETHOD("to_mozilla_ast", function() {
            return set_moz_loc(this, handler(this));
        });
    };

    function to_moz(node) {
        return node != null ? node.to_mozilla_ast() : null;
    };

    function to_moz_block(node) {
        return {
            type: "BlockStatement",
            body: node.body.map(to_moz)
        };
    };

})();

/***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.
  https://github.com/mishoo/UglifyJS2

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2012 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

"use strict";

function find_builtins() {
    var a = [];
    [ Object, Array, Function, Number,
      String, Boolean, Error, Math,
      Date, RegExp
    ].forEach(function(ctor){
        Object.getOwnPropertyNames(ctor).map(add);
        if (ctor.prototype) {
            Object.getOwnPropertyNames(ctor.prototype).map(add);
        }
    });
    function add(name) {
        push_uniq(a, name);
    }
    return a;
}

function mangle_properties(ast, options) {
    options = defaults(options, {
        reserved : null,
        cache : null,
        only_cache : false,
        regex : null
    });

    var reserved = options.reserved;
    if (reserved == null)
        reserved = find_builtins();

    var cache = options.cache;
    if (cache == null) {
        cache = {
            cname: -1,
            props: new Dictionary()
        };
    }

    var regex = options.regex;

    var names_to_mangle = [];
    var unmangleable = [];

    // step 1: find candidates to mangle
    ast.walk(new TreeWalker(function(node){
        if (node instanceof AST_ObjectKeyVal) {
            add(node.key);
        }
        else if (node instanceof AST_ObjectProperty) {
            // setter or getter, since KeyVal is handled above
            add(node.key.name);
        }
        else if (node instanceof AST_Dot) {
            if (this.parent() instanceof AST_Assign) {
                add(node.property);
            }
        }
        else if (node instanceof AST_Sub) {
            if (this.parent() instanceof AST_Assign) {
                addStrings(node.property);
            }
        }
    }));

    // step 2: transform the tree, renaming properties
    return ast.transform(new TreeTransformer(function(node){
        if (node instanceof AST_ObjectKeyVal) {
            node.key = mangle(node.key);
        }
        else if (node instanceof AST_ObjectProperty) {
            // setter or getter
            node.key.name = mangle(node.key.name);
        }
        else if (node instanceof AST_Dot) {
            node.property = mangle(node.property);
        }
        else if (node instanceof AST_Sub) {
            node.property = mangleStrings(node.property);
        }
        // else if (node instanceof AST_String) {
        //     if (should_mangle(node.value)) {
        //         AST_Node.warn(
        //             "Found \"{prop}\" property candidate for mangling in an arbitrary string [{file}:{line},{col}]", {
        //                 file : node.start.file,
        //                 line : node.start.line,
        //                 col  : node.start.col,
        //                 prop : node.value
        //             }
        //         );
        //     }
        // }
    }));

    // only function declarations after this line

    function can_mangle(name) {
        if (unmangleable.indexOf(name) >= 0) return false;
        if (reserved.indexOf(name) >= 0) return false;
        if (options.only_cache) {
            return cache.props.has(name);
        }
        if (/^[0-9.]+$/.test(name)) return false;
        return true;
    }

    function should_mangle(name) {
        if (regex && !regex.test(name)) return false;
        if (reserved.indexOf(name) >= 0) return false;
        return cache.props.has(name)
            || names_to_mangle.indexOf(name) >= 0;
    }

    function add(name) {
        if (can_mangle(name))
            push_uniq(names_to_mangle, name);

        if (!should_mangle(name)) {
            push_uniq(unmangleable, name);
        }
    }

    function mangle(name) {
        if (!should_mangle(name)) {
            return name;
        }

        var mangled = cache.props.get(name);
        if (!mangled) {
            do {
                mangled = base54(++cache.cname);
            } while (!can_mangle(mangled));
            cache.props.set(name, mangled);
        }
        return mangled;
    }

    function addStrings(node) {
        var out = {};
        try {
            (function walk(node){
                node.walk(new TreeWalker(function(node){
                    if (node instanceof AST_Seq) {
                        walk(node.cdr);
                        return true;
                    }
                    if (node instanceof AST_String) {
                        add(node.value);
                        return true;
                    }
                    if (node instanceof AST_Conditional) {
                        walk(node.consequent);
                        walk(node.alternative);
                        return true;
                    }
                    throw out;
                }));
            })(node);
        } catch(ex) {
            if (ex !== out) throw ex;
        }
    }

    function mangleStrings(node) {
        return node.transform(new TreeTransformer(function(node){
            if (node instanceof AST_Seq) {
                node.cdr = mangleStrings(node.cdr);
            }
            else if (node instanceof AST_String) {
                node.value = mangle(node.value);
            }
            else if (node instanceof AST_Conditional) {
                node.consequent = mangleStrings(node.consequent);
                node.alternative = mangleStrings(node.alternative);
            }
            return node;
        }));
    }

}

exports["Compressor"] = Compressor;
exports["DefaultsError"] = DefaultsError;
exports["Dictionary"] = Dictionary;
exports["JS_Parse_Error"] = JS_Parse_Error;
exports["MAP"] = MAP;
exports["OutputStream"] = OutputStream;
exports["SourceMap"] = SourceMap;
exports["TreeTransformer"] = TreeTransformer;
exports["TreeWalker"] = TreeWalker;
exports["base54"] = base54;
exports["defaults"] = defaults;
exports["mangle_properties"] = mangle_properties;
exports["merge"] = merge;
exports["parse"] = parse;
exports["push_uniq"] = push_uniq;
exports["string_template"] = string_template;
exports["is_identifier"] = is_identifier;
exports["SymbolDef"] = SymbolDef;


exports.sys = sys;
exports.MOZ_SourceMap = MOZ_SourceMap;
exports.UglifyJS = UglifyJS;
exports.array_to_hash = array_to_hash;
exports.slice = slice;
exports.characters = characters;
exports.member = member;
exports.find_if = find_if;
exports.repeat_string = repeat_string;
exports.DefaultsError = DefaultsError;
exports.defaults = defaults;
exports.merge = merge;
exports.noop = noop;
exports.MAP = MAP;
exports.push_uniq = push_uniq;
exports.string_template = string_template;
exports.remove = remove;
exports.mergeSort = mergeSort;
exports.set_difference = set_difference;
exports.set_intersection = set_intersection;
exports.makePredicate = makePredicate;
exports.all = all;
exports.Dictionary = Dictionary;
exports.DEFNODE = DEFNODE;
exports.AST_Token = AST_Token;
exports.AST_Node = AST_Node;
exports.AST_Statement = AST_Statement;
exports.AST_Debugger = AST_Debugger;
exports.AST_Directive = AST_Directive;
exports.AST_SimpleStatement = AST_SimpleStatement;
exports.walk_body = walk_body;
exports.AST_Block = AST_Block;
exports.AST_BlockStatement = AST_BlockStatement;
exports.AST_EmptyStatement = AST_EmptyStatement;
exports.AST_StatementWithBody = AST_StatementWithBody;
exports.AST_LabeledStatement = AST_LabeledStatement;
exports.AST_IterationStatement = AST_IterationStatement;
exports.AST_DWLoop = AST_DWLoop;
exports.AST_Do = AST_Do;
exports.AST_While = AST_While;
exports.AST_For = AST_For;
exports.AST_ForIn = AST_ForIn;
exports.AST_With = AST_With;
exports.AST_Scope = AST_Scope;
exports.AST_Toplevel = AST_Toplevel;
exports.AST_Lambda = AST_Lambda;
exports.AST_Accessor = AST_Accessor;
exports.AST_Function = AST_Function;
exports.AST_Defun = AST_Defun;
exports.AST_Jump = AST_Jump;
exports.AST_Exit = AST_Exit;
exports.AST_Return = AST_Return;
exports.AST_Throw = AST_Throw;
exports.AST_LoopControl = AST_LoopControl;
exports.AST_Break = AST_Break;
exports.AST_Continue = AST_Continue;
exports.AST_If = AST_If;
exports.AST_Switch = AST_Switch;
exports.AST_SwitchBranch = AST_SwitchBranch;
exports.AST_Default = AST_Default;
exports.AST_Case = AST_Case;
exports.AST_Try = AST_Try;
exports.AST_Catch = AST_Catch;
exports.AST_Finally = AST_Finally;
exports.AST_Definitions = AST_Definitions;
exports.AST_Var = AST_Var;
exports.AST_Const = AST_Const;
exports.AST_VarDef = AST_VarDef;
exports.AST_Call = AST_Call;
exports.AST_New = AST_New;
exports.AST_Seq = AST_Seq;
exports.AST_PropAccess = AST_PropAccess;
exports.AST_Dot = AST_Dot;
exports.AST_Sub = AST_Sub;
exports.AST_Unary = AST_Unary;
exports.AST_UnaryPrefix = AST_UnaryPrefix;
exports.AST_UnaryPostfix = AST_UnaryPostfix;
exports.AST_Binary = AST_Binary;
exports.AST_Conditional = AST_Conditional;
exports.AST_Assign = AST_Assign;
exports.AST_Array = AST_Array;
exports.AST_Object = AST_Object;
exports.AST_ObjectProperty = AST_ObjectProperty;
exports.AST_ObjectKeyVal = AST_ObjectKeyVal;
exports.AST_ObjectSetter = AST_ObjectSetter;
exports.AST_ObjectGetter = AST_ObjectGetter;
exports.AST_Symbol = AST_Symbol;
exports.AST_SymbolAccessor = AST_SymbolAccessor;
exports.AST_SymbolDeclaration = AST_SymbolDeclaration;
exports.AST_SymbolVar = AST_SymbolVar;
exports.AST_SymbolConst = AST_SymbolConst;
exports.AST_SymbolFunarg = AST_SymbolFunarg;
exports.AST_SymbolDefun = AST_SymbolDefun;
exports.AST_SymbolLambda = AST_SymbolLambda;
exports.AST_SymbolCatch = AST_SymbolCatch;
exports.AST_Label = AST_Label;
exports.AST_SymbolRef = AST_SymbolRef;
exports.AST_LabelRef = AST_LabelRef;
exports.AST_This = AST_This;
exports.AST_Constant = AST_Constant;
exports.AST_String = AST_String;
exports.AST_Number = AST_Number;
exports.AST_RegExp = AST_RegExp;
exports.AST_Atom = AST_Atom;
exports.AST_Null = AST_Null;
exports.AST_NaN = AST_NaN;
exports.AST_Undefined = AST_Undefined;
exports.AST_Hole = AST_Hole;
exports.AST_Infinity = AST_Infinity;
exports.AST_Boolean = AST_Boolean;
exports.AST_False = AST_False;
exports.AST_True = AST_True;
exports.TreeWalker = TreeWalker;
exports.KEYWORDS = KEYWORDS;
exports.KEYWORDS_ATOM = KEYWORDS_ATOM;
exports.RESERVED_WORDS = RESERVED_WORDS;
exports.KEYWORDS_BEFORE_EXPRESSION = KEYWORDS_BEFORE_EXPRESSION;
exports.OPERATOR_CHARS = OPERATOR_CHARS;
exports.RE_HEX_NUMBER = RE_HEX_NUMBER;
exports.RE_OCT_NUMBER = RE_OCT_NUMBER;
exports.OPERATORS = OPERATORS;
exports.WHITESPACE_CHARS = WHITESPACE_CHARS;
exports.PUNC_BEFORE_EXPRESSION = PUNC_BEFORE_EXPRESSION;
exports.PUNC_CHARS = PUNC_CHARS;
exports.REGEXP_MODIFIERS = REGEXP_MODIFIERS;
exports.UNICODE = UNICODE;
exports.is_letter = is_letter;
exports.is_digit = is_digit;
exports.is_alphanumeric_char = is_alphanumeric_char;
exports.is_unicode_digit = is_unicode_digit;
exports.is_unicode_combining_mark = is_unicode_combining_mark;
exports.is_unicode_connector_punctuation = is_unicode_connector_punctuation;
exports.is_identifier = is_identifier;
exports.is_identifier_start = is_identifier_start;
exports.is_identifier_char = is_identifier_char;
exports.is_identifier_string = is_identifier_string;
exports.parse_js_number = parse_js_number;
exports.JS_Parse_Error = JS_Parse_Error;
exports.js_error = js_error;
exports.is_token = is_token;
exports.EX_EOF = EX_EOF;
exports.tokenizer = tokenizer;
exports.UNARY_PREFIX = UNARY_PREFIX;
exports.UNARY_POSTFIX = UNARY_POSTFIX;
exports.ASSIGNMENT = ASSIGNMENT;
exports.PRECEDENCE = PRECEDENCE;
exports.STATEMENTS_WITH_LABELS = STATEMENTS_WITH_LABELS;
exports.ATOMIC_START_TOKEN = ATOMIC_START_TOKEN;
exports.parse = parse;
exports.TreeTransformer = TreeTransformer;
exports.SymbolDef = SymbolDef;
exports.base54 = base54;
exports.OutputStream = OutputStream;
exports.Compressor = Compressor;
exports.SourceMap = SourceMap;
exports.find_builtins = find_builtins;
exports.mangle_properties = mangle_properties;

exports.AST_Node.warn_function = function (txt) { if (typeof console != "undefined" && typeof console.warn === "function") console.warn(txt) }

exports.minify = function (files, options) {
    options = UglifyJS.defaults(options, {
        spidermonkey     : false,
        outSourceMap     : null,
        sourceRoot       : null,
        inSourceMap      : null,
        fromString       : false,
        warnings         : false,
        mangle           : {},
        mangleProperties : false,
        nameCache        : null,
        output           : null,
        compress         : {},
        parse            : {}
    });
    UglifyJS.base54.reset();

    // 1. parse
    var toplevel = null,
        sourcesContent = {};

    if (options.spidermonkey) {
        toplevel = UglifyJS.AST_Node.from_mozilla_ast(files);
    } else {
        if (typeof files == "string")
            files = [ files ];
        files.forEach(function(file, i){
            var code = options.fromString
                ? file
                : fs.readFileSync(file, "utf8");
            sourcesContent[file] = code;
            toplevel = UglifyJS.parse(code, {
                filename: options.fromString ? i : file,
                toplevel: toplevel,
                bare_returns: options.parse ? options.parse.bare_returns : undefined
            });
        });
    }
    if (options.wrap) {
      toplevel = toplevel.wrap_commonjs(options.wrap, options.exportAll);
    }

    // 2. compress
    if (options.compress) {
        var compress = { warnings: options.warnings };
        UglifyJS.merge(compress, options.compress);
        toplevel.figure_out_scope();
        var sq = UglifyJS.Compressor(compress);
        toplevel = toplevel.transform(sq);
    }

    // 3. mangle properties
    if (options.mangleProperties || options.nameCache) {
        options.mangleProperties.cache = UglifyJS.readNameCache(options.nameCache, "props");
        toplevel = UglifyJS.mangle_properties(toplevel, options.mangleProperties);
        UglifyJS.writeNameCache(options.nameCache, "props", options.mangleProperties.cache);
    }

    // 4. mangle
    if (options.mangle) {
        toplevel.figure_out_scope(options.mangle);
        toplevel.compute_char_frequency(options.mangle);
        toplevel.mangle_names(options.mangle);
    }

    // 5. output
    var inMap = options.inSourceMap;
    var output = {};
    if (typeof options.inSourceMap == "string") {
        inMap = fs.readFileSync(options.inSourceMap, "utf8");
    }
    if (options.outSourceMap) {
        output.source_map = UglifyJS.SourceMap({
            file: options.outSourceMap,
            orig: inMap,
            root: options.sourceRoot
        });
        if (options.sourceMapIncludeSources) {
            for (var file in sourcesContent) {
                if (sourcesContent.hasOwnProperty(file)) {
                    output.source_map.get().setSourceContent(file, sourcesContent[file]);
                }
            }
        }

    }
    if (options.output) {
        UglifyJS.merge(output, options.output);
    }
    var stream = UglifyJS.OutputStream(output);
    toplevel.print(stream);

    if (options.outSourceMap && "string" === typeof options.outSourceMap) {
        stream += "\n//# sourceMappingURL=" + options.outSourceMap;
    }

    var source_map = output.source_map;
    if (source_map) {
        source_map = source_map + "";
    }

    return {
        code : stream + "",
        map  : source_map
    };
};

exports.describe_ast = function () {
    var out = UglifyJS.OutputStream({ beautify: true });
    function doitem(ctor) {
        out.print("AST_" + ctor.TYPE);
        var props = ctor.SELF_PROPS.filter(function(prop){
            return !/^\$/.test(prop);
        });
        if (props.length > 0) {
            out.space();
            out.with_parens(function(){
                props.forEach(function(prop, i){
                    if (i) out.space();
                    out.print(prop);
                });
            });
        }
        if (ctor.documentation) {
            out.space();
            out.print_string(ctor.documentation);
        }
        if (ctor.SUBCLASSES.length > 0) {
            out.space();
            out.with_block(function(){
                ctor.SUBCLASSES.forEach(function(ctor, i){
                    out.indent();
                    doitem(ctor);
                    out.newline();
                });
            });
        }
    };
    doitem(UglifyJS.AST_Node);
    return out + "";
};
},{"source-map":94,"util":98}],96:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],97:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],98:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":97,"_process":77,"inherits":12}]},{},[2])