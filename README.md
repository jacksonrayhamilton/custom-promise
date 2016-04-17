# p.js [![Build Status](https://travis-ci.org/jacksonrayhamilton/p.js.svg?branch=master)](https://travis-ci.org/jacksonrayhamilton/p.js)

A small, useful and secure A+ promise library.

- Small: About 500 bytes minified and gzipped.  About 300 bytes when built only
  for A+ compliance.
- Useful: `catch`, `resolve`, `reject`, `all`, `race`, old IE support.
- Secure: No private state exposed.

## Customize

You can build your own version of p.js with only the methods and environment
support that you want.  Take the [p.js Customizer][] for a spin!

[p.js Customizer]: http://jacksonrayhamilton.github.io/p.js/

## API

### `p(executor)`

Create a promise. `executor` is a function immediately executed with `resolve`
and `reject` functions as parameters, which fulfill or reject the promise.

### `promise.then(onFulfilled, onRejected)`

Register callbacks to receive a promise's eventual value or the reason why it
cannot be fulfilled.

### `promise.catch(onRejected)`

Shortcut method for registering just a rejection callback.

### `p.resolve(value)`

Create a promise fulfilled with `value`.  If `value` has a `then` method, it is
assumed to be a promise, and this function returns a promise inheriting the
state of `value`.

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

You can use `p.resolve` to create a promise and `then` to handle its
fulfillment:

```js
p.resolve('Hello World!').then(function (value) {
  console.log(value);
});
```

You can use `p()` to manage promises.  Here, a promise is created, it is
randomly fulfilled or rejected, and fulfillment and rejection handlers are
registered on the promise:

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

Most of the time, you probably won't need to manage promises, so you should
prefer `p.resolve` and `p.reject` for creating promises.

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
(However, you *can* customize the task function in a custom build.)  Other
promise libraries may be better suited for especially stressful scenarios.

This library does not provide a polyfill for the `Promise` constructor or its
methods.  However, being A+-compliant, the promises are interoperable.  Also,
`Promise` and `p` have approximately the same interface, so p.js could
reasonably substitute for `Promise` until it becomes ubiquitous.
