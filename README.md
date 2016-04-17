# custom-promise [![Build Status](https://travis-ci.org/jacksonrayhamilton/custom-promise.svg?branch=master)](https://travis-ci.org/jacksonrayhamilton/custom-promise)

A small, useful, secure and customizable A+ promise library.

- Small: About 500 bytes minified and gzipped with all features.  About 300
  bytes when built only for A+ compliance.
- Useful: `catch`, `resolve`, `reject`, `all`, `race`, old IE support.
- Secure: No private state exposed.
- Customizable: Include only what you need with the [Customizer][]!

## API

Access the custom-promise API through the exported function `p` and its methods.

### `p(executor)`

Create a promise.  The function `executor` is immediately called with `resolve`
and `reject` functions as arguments, which fulfill or reject the promise.

### `promise.then(onFulfilled, onRejected)`

Register callbacks to receive a promise's eventual value or the reason why it
cannot be fulfilled.

### `promise.catch(onRejected)`

Register just a rejection callback.

### `p.resolve(value)`

Create a promise fulfilled with `value`.  If `value` has a `then` method, it is
assumed to be a promise, and a new promise is returned inheriting the state of
`value`.

### `p.reject(reason)`

Create a promise rejected with `reason`.

### `p.all(collection)`

Create a promise resolving the values in `collection`.  If `collection` is
array-like (has a `length` property), the promise is resolved with an array,
else with an object.  Each value in `collection` must be fulfilled by
`p.resolve` before the promise is fulfilled.  If any value in `collection` is
rejected, the promise is rejected.

### `p.race(collection)`

Create a promise resolving with the first value to resolve in `collection` via
`p.resolve`.  If any value in `collection` is rejected, the promise is rejected.

## Examples

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

You can use `p.all` to await the completion of multiple promises:

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

When order is unimportant, you can pass an object to `p.all` instead:

```js
p.all({
  user: getUser(),
  friends: getFriends()
}).then(function (results) {
  var user = results.user;
  var friends = results.friends;
});
```

When only the value of one promise in a set of promises matters, you can use
`p.race` with an [array-like] object:

```js
p.race([
  takeRisk(),
  playItSafe()
]).then(function (result) {
  console.log('Did ' + result + ' as it was faster');
});
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
could reasonably substitute for `Promise` until it becomes ubiquitous.

[Customizer]: http://jacksonrayhamilton.github.io/custom-promise/
