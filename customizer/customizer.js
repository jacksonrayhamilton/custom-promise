'use strict';

var Emitter = require('tiny-emitter');
var extend = require('lodash/extend');
var forOwn = require('lodash/forOwn');
var mapValues = require('lodash/mapValues');

// Provides a UI for customizing the module and building it.
var createCustomizer = function (options) {

  var element = options.element;

  var customizer = {};

  extend(customizer, new Emitter());

  var featureChooserForm = element.querySelector('[data-customizer-feature-chooser]');
  var optionInputs = {
    catch: element.querySelector('[data-customizer-option-catch]'),
    resolve: element.querySelector('[data-customizer-option-resolve]'),
    reject: element.querySelector('[data-customizer-option-reject]'),
    all: element.querySelector('[data-customizer-option-all]'),
    race: element.querySelector('[data-customizer-option-race]'),
    ie: element.querySelector('[data-customizer-option-ie]'),
    node: element.querySelector('[data-customizer-option-node]'),
    task: element.querySelector('[data-customizer-option-task]')
  };
  var outputTextarea = element.querySelector('[data-customizer-output]');
  var statSpans = {
    uncompressed: element.querySelector('[data-customizer-stat-uncompressed]'),
    uglified: element.querySelector('[data-customizer-stat-uglified]'),
    uglifiedGzipped: element.querySelector('[data-customizer-stat-uglified-gzipped]')
  };

  var build = function () {
    var buildOptions = mapValues(optionInputs, function (input) {
      if (input.type === 'checkbox') {
        return input.checked;
      }
      return input.value;
    });
    customizer.emit('build', buildOptions);
  };

  featureChooserForm.addEventListener('submit', function (event) {
    event.preventDefault();
    build();
  });

  customizer.complete = function (results) {
    outputTextarea.value = results.output;
    forOwn(results.stats, function (value, name) {
      statSpans[name].textContent = value + ' bytes';
    });
  };

  return customizer;

};

module.exports = createCustomizer;
