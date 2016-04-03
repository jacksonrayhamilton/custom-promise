/* eslint-env worker */
/* eslint-disable camelcase */

'use strict';

var build = require('../tools/build');
var UglifyJS = require('uglify-js');
var zlib = require('zlib');

var running = false;
var canceled = false;

var startBuild = function (options) {

  running = true;

  var stats = {};

  var buildOutput = build(options);
  stats.uncompressed = buildOutput.length;

  var uglifyOutput = UglifyJS.minify(buildOutput, {
    fromString: true,
    mangle: {
      screw_ie8: !options.ie
    },
    output: {
      screw_ie8: !options.ie
    },
    compress: {
      screw_ie8: !options.ie
    }
  }).code;
  stats.uglified = uglifyOutput.length;

  var gzipOutput = zlib.gzipSync(uglifyOutput); // eslint-disable-line no-sync
  stats.uglifiedGzipped = gzipOutput.length;

  // Allow a cancelation event to fire.
  setTimeout(function () {
    if (canceled) {
      canceled = false;
    } else {
      postMessage({
        name: 'complete',
        output: buildOutput,
        stats: stats
      });
    }
    running = false;
  });

};

onmessage = function (event) {
  if (event.data.name === 'build') {
    startBuild(event.data.options);
  } else if (event.data.name === 'cancel') {
    if (running) {
      canceled = true;
    }
  }
};
