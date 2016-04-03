'use strict';

var Emitter = require('tiny-emitter');
var extend = require('lodash/extend');

// Builds the module.
var createBuilder = function () {

  var builder = {};

  extend(builder, new Emitter());

  var worker = new Worker('builder-worker.js');

  builder.build = function (options) {
    worker.postMessage({
      name: 'build',
      options: options
    });
  };

  builder.cancel = function () {
    worker.postMessage({
      name: 'cancel'
    });
  };

  worker.onmessage = function (event) {
    if (event.data.name === 'complete') {
      builder.emit('complete', event.data);
    }
  };

  return builder;

};

module.exports = createBuilder;
