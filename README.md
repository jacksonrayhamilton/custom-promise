# p.js

A small, useful and secure A+ promise library.

- Small: About 600 bytes minified and gzipped.
- Useful: A+ compliance, `catch`, `resolve`, `reject`, `all`, old IE support.
- Secure: No private state exposed.

## API

### `p.defer()`

Create a deferred object with these properties:

- `promise`: A promise.
- `resolve`, `reject`: Methods to fulfill or reject the promise.

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

Create a promise resolving with values from `collection`.  Each value in
`collection` must be fulfilled by `p.resolve` before the promise is fulfilled.
If any value in `collection` is rejected, the promise is rejected. `collection`
can be an array or an object.

## Examples

Create a promise and print its value:

```js
p.resolve('Hello World!').then(function (value) {
  console.log(value);
});
```

You can use `p.defer` to manage promises.  In the following example, a promise
is created, it is randomly fulfilled or rejected, and fulfillment and rejection
handlers are registered on the promise:

```js
var deferred = p.defer();
setTimeout(function () {
  if (Math.random() < 0.5) {
    deferred.resolve(true);
  } else {
    deferred.reject(false);
  }
});
deferred.promise.then(function (value) {
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
