/* eslint-env node */

'use strict';

var build = require('./build');
var connectLivereload = require('connect-livereload');
var loadGruntTasks = require('load-grunt-tasks');
var path = require('path');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var config = {};

  var browserifyFiles = {
    'build/customizer/bundle.js': 'customizer/main.js',
    'build/customizer/builder-worker.js': 'customizer/builder-worker.js'
  };
  config.browserify = {
    options: {
      transform: ['brfs']
    },
    customizer: {
      files: browserifyFiles
    },
    customizerServe: {
      files: browserifyFiles,
      options: {
        watch: true,
        browserifyOptions: {
          debug: true
        }
      }
    }
  };

  config.clean = {
    module: ['build/module/**'],
    customizer: ['build/customizer/**'],
    postWeb: [
      'build/customizer/bundle.*.js',
      'build/customizer/node_modules/**'
    ]
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

  config.filerev = {
    build: {
      src: ['build/customizer/*.{css,js}']
    }
  };

  config.htmlmin = {
    build: {
      options: {
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        removeOptionalTags: true
      },
      files: {
        'build/customizer/index.html': 'build/customizer/index.html'
      }
    }
  };

  config.mochaTest = {
    all: {
      src: ['test/**.js']
    }
  };

  config.replace = {
    customizer: {
      src: ['build/customizer/*.js'],
      overwrite: true,
      replacements: [{
        from: 'builder-worker.js',
        to: function () {
          return path.basename(grunt.filerev.summary['build/customizer/builder-worker.js']);
        }
      }]
    }
  };

  config.sync = {
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

  config.uglify = {
    customizer: {
      src: 'build/customizer/builder-worker.js',
      dest: 'build/customizer/builder-worker.js'
    }
  };

  config.usemin = {
    options: {
      assetsDirs: ['build/customizer/']
    },
    html: 'build/customizer/index.html'
  };

  config.useminPrepare = {
    options: {
      dest: 'build/customizer/'
    },
    html: 'build/customizer/index.html'
  };

  // Have to use `**/*` due to issue #481.
  config.watch = {
    module: {
      files: ['templates/**/*'],
      tasks: ['module']
    },
    customizer: {
      files: ['customizer/**/*'],
      tasks: ['sync:customizer']
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
    grunt.file.write('build/module/p.node.js', build({
      catch: true,
      resolve: true,
      reject: true,
      all: true,
      race: true,
      node: true,
      task: 'process.nextTick'
    }));
  });

  grunt.registerTask('module', [
    'clean:module',
    'template:module'
  ]);

  grunt.registerTask('customizerBase', [
    'clean:customizer',
    'sync:customizer'
  ]);

  grunt.registerTask('customizer:serve', [
    'customizerBase',
    'browserify:customizerServe',
    'connect:customizer'
  ]);

  grunt.registerTask('customizer:web', [
    'customizerBase',
    'browserify:customizer',
    'useminPrepare',
    'concat:generated',
    'cssmin:generated',
    'uglify:generated',
    'uglify:customizer',
    'filerev',
    'replace:customizer',
    'usemin',
    'htmlmin',
    'clean:postWeb'
  ]);

  grunt.registerTask('web', ['customizer:web']);
  grunt.registerTask('serve', ['module', 'customizer:serve', 'watch']);
  grunt.registerTask('test', ['module', 'eslint', 'mochaTest']);

};
