# p.js

A small and secure A+ promise library.

Besides A+, promises have a `catch` method, and there are `resolve` and `reject`
functions. Minified and gzipped the library is less than 500 bytes.

```js
var deferred = p.defer();
if (Math.random() < 0.5) {
  deferred.resolve();
} else {
  deferred.reject();
}
deferred.promise.then(function (value) {
  console.log(value);
}).catch(function (reason) {
  console.error(reason);
});
```
