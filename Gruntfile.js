/* eslint-env node */

'use strict';

var build = require('./build');
var connectLivereload = require('connect-livereload');
var loadGruntTasks = require('load-grunt-tasks');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var config = {};

  config.browserify = {
    customizer: {
      files: {
        'build/customizer/bundle.js': 'customizer/main.js',
        'build/customizer/builder-worker.js': 'customizer/builder-worker.js'
      },
      options: {
        transform: ['brfs'],
        watch: true,
        browserifyOptions: {
          debug: true
        }
      }
    }
  };

  config.clean = {
    module: ['build/module/**'],
    customizer: ['build/customizer/**']
  };

  config.compress = {
    module: {
      options: {
        mode: 'gzip'
      },
      files: [{
        expand: true,
        cwd: 'build/module/',
        src: ['*.min.js'],
        dest: 'build/module/',
        rename: function (dest, src) {
          return dest + src.replace('.min.js', '.min.js.gz');
        }
      }]
    }
  };

  config.connect = {
    customizer: {
      options: {
        port: 1024,
        base: ['build/customizer/'],
        middleware: function (connect, unused, middlewares) {
          middlewares.unshift(
            // Provide the middleware ourselves so the hostname will be dynamic.
            connectLivereload({
              port: 1025
            })
          );
          return middlewares;
        }
      }
    }
  };

  config.copy = {
    customizer: {
      files: [{
        expand: true,
        cwd: 'customizer/',
        src: ['**', '!*.js'],
        dest: 'build/customizer/'
      }, {
        expand: true,
        src: ['node_modules/bootstrap/dist/**'],
        dest: 'build/customizer/'
      }]
    }
  };

  config.eslint = {
    all: {
      src: [
        '*.js',
        'customizer/*.js',
        'build/module/*.js',
        '!build/module/*.min.js'
      ]
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
        cwd: 'build/module/',
        dest: 'build/module/',
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

  // Have to use `**/*` due to issue #481.
  config.watch = {
    module: {
      files: ['templates/**/*'],
      tasks: ['module']
    },
    customizer: {
      files: ['customizer/**/*'],
      tasks: ['copy:customizer']
    },
    customizerBuild: {
      files: ['build/customizer/**/*'],
      options: {
        livereload: 1025
      }
    }
  };

  grunt.initConfig(config);

  grunt.registerTask('template:module', function () {
    grunt.file.write('build/module/p.js', build({catch: 1, resolve: 1, reject: 1, all: 1, race: 1, ie: 1}));
    grunt.file.write('build/module/p.modern.js', build({catch: 1, resolve: 1, reject: 1, all: 1, race: 1}));
    grunt.file.write('build/module/p.catch.js', build({catch: 1, ie: 1}));
    grunt.file.write('build/module/p.catch.modern.js', build({catch: 1}));
    grunt.file.write('build/module/p.all.js', build({all: 1}));
    grunt.file.write('build/module/p.race.js', build({race: 1}));
    grunt.file.write('build/module/p.micro.js', build({ie: 1}));
    grunt.file.write('build/module/p.micro.modern.js', build());
    grunt.file.write('build/module/p.node.js', build({catch: 1, resolve: 1, reject: 1, all: 1, race: 1, node: 1}));
  });

  grunt.registerTask('module', [
    'clean:module',
    'template:module',
    'uglify',
    'compress:module'
  ]);

  grunt.registerTask('customizer', [
    'clean:customizer',
    'copy:customizer',
    'browserify:customizer',
    'connect:customizer'
  ]);

  grunt.registerTask('serve', ['module', 'customizer', 'watch']);
  grunt.registerTask('test', ['eslint', 'mochaTest']);
};
