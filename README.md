# custom-promise [![Build Status](https://travis-ci.org/jacksonrayhamilton/custom-promise.svg?branch=master)](https://travis-ci.org/jacksonrayhamilton/custom-promise)

A small, useful, secure and customizable A+ promise library.

- Small: About 500 bytes minified and gzipped.  About 300 bytes when built only
  for A+ compliance.
- Useful: `catch`, `resolve`, `reject`, `all`, `race`, old IE support.
- Secure: No private state exposed.
- Customizable: Include only necessary functionality with the [Customizer][]!

## Usage

Include the fully-featured library with `npm`:

```sh
npm install custom-promise
```

In Node, load it via `require`:

```js
var p = require('custom-promise');
```

In browsers, load it via `<script>`:

```html
<script src="node_modules/custom-promise/modules/p.script.js"></script>
```

Alternatively, create a custom build with the [Customizer][] or
`tools/build.js`.

## Promise API

Access the promise API through the exported function `p` and its methods.

### `p(executor)`

Returns a promise.  The function `executor` is immediately called with `resolve`
and `reject` functions as arguments.  Call `resolve` with one argument to
fulfill the promise with that value.  Call `reject` with one argument to reject
the promise with that reason.

### `promise.then(onFulfilled, onRejected)`

Registers callbacks to receive a promise's eventual value or the reason why it
cannot be fulfilled, and returns a promise resolving with the return value of
these callbacks.

### `promise.catch(onRejected)`

Registers just a rejection callback, and returns a promise resolving with the
return value of this callback.

### `p.resolve(value)`

Returns a promise fulfilled with `value`.  If `value` has a `then` method, it is
assumed to be a promise, and the returned promise inherits the state of `value`.

### `p.reject(reason)`

Returns a promise rejected with `reason`.

### `p.all(collection)`

Returns a promise resolving the values in `collection`.  If `collection` is
array-like (has a `length` property), the promise is fulfilled with an array,
otherwise it is fulfilled with an object.  Each value in `collection` must be
fulfilled (internally) by `p.resolve` before the returned promise is fulfilled.
If any value in `collection` is rejected, the returned promise is rejected.

### `p.race(collection)`

Returns a promise resolving with the first value to resolve in `collection` via
`p.resolve` (internally).  If any value in `collection` is rejected, the
returned promise is rejected.

### Examples

Use `p.resolve` to create a promise and `then` to handle its fulfillment:

```js
p.resolve('Hello World!').then(function (value) {
  console.log(value);
});
```

Manage promises with `p()`.  Here, a promise is created, then randomly fulfilled
or rejected, and fulfillment and rejection callbacks handle the outcome:

```js
p(function (resolve, reject) {
  setTimeout(function () {
    if (Math.random() < 0.5) {
      resolve(true);
    } else {
      reject(false);
    }
  });
}).then(function (value) {
  console.log(value);
}, function (reason) {
  console.error(reason);
});
```

Managing promises is often avoidable.  Prefer using promises returned by other
APIs, or use `p.resolve` and `p.reject` to create promises.

Use `p.all` to await the completion of multiple promises:

```js
p.all([
  doTheBoogie(),
  danceLikeYouMeanIt()
]).then(function (results) {
  results.forEach(function (result) {
    // Handle the crowd's excited response
  });
}).catch(function (error) {
  // Recover from a vegetable assault
});
```

When order is unimportant, pass an object to `p.all` instead:

```js
p.all({
  user: getUser(),
  friends: getFriends()
}).then(function (results) {
  var user = results.user;
  var friends = results.friends;
});
```

When only the value of one promise in a set of promises matters, use `p.race`
with an [array-like] object:

```js
p.race([
  takeRisk(),
  playItSafe()
]).then(function (result) {
  console.log('Did ' + result + ' as it was faster');
});
```

## Custom Build API

Programmatically make custom builds with `tools/build.js`.

### build(options)

Returns a customized implementation of `p` as a string.  The following options
are available:

- `catch`: Provide the `catch` method on promises.
- `resolve`, `reject`, `all`, `race`: Provide these methods on `p`.
- `task`: Customize the task function.  The default is `setTimeout`.
  Alternatives like `setImmediate` or `process.nextTick` may be used if they
  will be available globally in target environments.
- `ie`: Workaround old IE bugs.
- `node`: Export a Node.js module.

### Examples

Create a custom build with `catch` and `ie` support, and save it to
`build/p.custom.js`:

```js
var fs = require('fs');
var build = require('custom-promise/tools/build');
fs.writeFileSync('build/p.custom.js', build({
  catch: true,
  ie: true
}));
```

## Use cases

This library aims to provide reliable promises in as few bytes as possible.  It
is suited for situations where network latency is a concern (e.g. web browsers)
and for users concerned with behavioral correctness.  Its small size makes it a
good candidate for inclusion within other libraries.

This library is not concerned with competitive performance (minimizing task
delay, CPU cycles and memory), as that could cost bytes and compromise security.
(However, you *can* customize the task function with the [Customizer][].)  Other
promise libraries may be better suited for especially stressful scenarios.

This library does not provide a polyfill for the `Promise` constructor or its
methods.  However, being A+-compliant, the promises are interoperable.  Also,
`Promise` and `p` have approximately the same interface, so this implementation
could reasonably substitute for `Promise`.

[Customizer]: http://jacksonrayhamilton.github.io/custom-promise/
