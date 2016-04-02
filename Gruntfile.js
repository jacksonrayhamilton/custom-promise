/* eslint-env node */

'use strict';

var build = require('./build');
var loadGruntTasks = require('load-grunt-tasks');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var config = {};

  config.clean = {
    build: ['build/**']
  };

  config.compress = {
    all: {
      options: {
        mode: 'gzip'
      },
      files: [{
        expand: true,
        cwd: 'build/',
        src: ['*.min.js'],
        dest: 'build/',
        rename: function (dest, src) {
          return dest + src.replace('.min.js', '.min.js.gz');
        }
      }]
    }
  };

  config.eslint = {
    all: {
      src: ['*.js', 'build/*.js', '!build/*.min.js']
    }
  };

  config.mochaTest = {
    all: {
      src: ['test/**.js']
    }
  };

  var getBaseUglifyConfig = function () {
    return {
      files: [{
        expand: true,
        cwd: 'build/',
        dest: 'build/',
        rename: function (dest, src) {
          return dest + src.replace('.js', '.min.js');
        }
      }]
    };
  };

  config.uglify = {
    ie: (function () {
      var uglifyConfig = getBaseUglifyConfig();
      uglifyConfig.files[0].src = ['*.js', '!*.modern.js', '!*.min.js'];
      return uglifyConfig;
    }()),
    modern: (function () {
      var uglifyConfig = getBaseUglifyConfig();
      uglifyConfig.options = {
        screwIE8: true
      };
      uglifyConfig.files[0].src = ['*.modern.js', '!*.min.js'];
      return uglifyConfig;
    }())
  };

  config.watch = {
    build: {
      files: ['src/**'],
      tasks: ['build']
    }
  };

  grunt.initConfig(config);

  grunt.registerTask('template', function () {
    grunt.file.write('build/p.js', build({catch: 1, resolve: 1, reject: 1, all: 1, ie: 1}));
    grunt.file.write('build/p.modern.js', build({catch: 1, resolve: 1, reject: 1, all: 1}));
    grunt.file.write('build/p.catch.js', build({catch: 1, ie: 1}));
    grunt.file.write('build/p.catch.modern.js', build({catch: 1}));
    grunt.file.write('build/p.micro.js', build({ie: 1}));
    grunt.file.write('build/p.micro.modern.js', build());
    grunt.file.write('build/p.node.js', build({catch: 1, resolve: 1, reject: 1, all: 1, node: 1}));
  });

  grunt.registerTask('build', ['clean', 'template', 'uglify', 'compress']);
  grunt.registerTask('serve', ['build', 'watch']);
  grunt.registerTask('test', ['eslint', 'mochaTest']);
};
