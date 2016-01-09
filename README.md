# p.js

A small and secure A+ promise library.

It only implements A+; absolutely nothing more. Minified and gzipped it is less
than 450 bytes.

```js
var deferred = p.defer();
if (Math.random() < 0.5) {
  deferred.resolve();
} else {
  deferred.reject();
}
deferred.promise.then(function (value) {
  console.log(value);
}, function (reason) {
  console.error(reason);
});
```
