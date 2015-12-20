# p.js

A small and secure A+ promise factory.

```js
var promise = p(function (resolve, reject) {
  setTimeout(resolve);
});
promise
  .then(function (value) { console.log(value); })
  .catch(function (error) { console.error(error); });
```
