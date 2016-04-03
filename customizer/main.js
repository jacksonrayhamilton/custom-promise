'use strict';

var createBuilder = require('./builder');
var createCustomizer = require('./customizer');

var builder = createBuilder();

var customizer = createCustomizer({
  element: document.body
});

customizer.on('build', function (options) {
  builder.cancel();
  builder.build(options);
});

builder.on('complete', function (results) {
  customizer.complete(results);
});
