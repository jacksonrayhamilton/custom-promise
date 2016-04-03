/* eslint-env node */

'use strict';

var build = require('./tools/build');
var connectLivereload = require('connect-livereload');
var loadGruntTasks = require('load-grunt-tasks');
var merge = require('lodash/merge');
var path = require('path');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var config = {};

  // Module

  merge(config, {
    clean: {
      module: ['build/module/**']
    },
    watch: {
      module: {
        // Have to use `**/*` due to issue #481.
        files: ['templates/**/*'],
        tasks: ['module']
      }
    }
  });

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

  // Customizer / Web

  var browserifyFiles = {
    'build/customizer/bundle.js': 'customizer/main.js',
    'build/customizer/builder-worker.js': 'customizer/builder-worker.js'
  };

  merge(config, {
    browserify: {
      options: {
        transform: ['brfs']
      },
      customizerWeb: {
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
    },
    clean: {
      customizer: ['build/customizer/**'],
      postWeb: [
        'build/customizer/bundle.*.js',
        'build/customizer/node_modules/**'
      ]
    },
    connect: {
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
    },
    filerev: {
      customizer: {
        src: ['build/customizer/*.{css,js}']
      }
    },
    htmlmin: {
      customizer: {
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
    },
    replace: {
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
    },
    sync: {
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
    },
    uglify: {
      customizer: {
        src: 'build/customizer/builder-worker.js',
        dest: 'build/customizer/builder-worker.js'
      }
    },
    usemin: {
      options: {
        assetsDirs: ['build/customizer/']
      },
      html: 'build/customizer/index.html'
    },
    useminPrepare: {
      options: {
        dest: 'build/customizer/'
      },
      html: 'build/customizer/index.html'
    },
    watch: {
      customizerSync: {
        // Have to use `**/*` due to issue #481.
        files: ['customizer/**/*'],
        tasks: ['sync:customizer']
      },
      customizerBuild: {
        files: ['build/customizer/**/*'],
        options: {
          livereload: 1025
        }
      }
    }
  });

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
    'browserify:customizerWeb',
    'useminPrepare',
    'concat:generated',
    'cssmin:generated',
    'uglify:generated',
    'uglify:customizer',
    'filerev:customizer',
    'replace:customizer',
    'usemin',
    'htmlmin:customizer',
    'clean:postWeb'
  ]);

  grunt.registerTask('web', ['customizer:web']);

  // QA

  config.eslint = {
    all: {
      src: [
        '*.js',
        'customizer/**.js',
        'test/**.js',
        'build/module/**.js',
        '!build/module/**.min.js'
      ]
    }
  };

  config.mochaTest = {
    all: {
      src: ['test/**.js'],
      options: {
        clearRequireCache: true
      }
    }
  };

  grunt.registerTask('test', ['module', 'eslint', 'mochaTest']);

  // Development

  // Build the module and the customizer continuously.
  grunt.registerTask('serve', ['module', 'customizer:serve', 'watch']);

  // In tandem with `grunt serve`, run tests continuously.
  grunt.registerTask('tdd', function () {
    grunt.config('watch', {
      tdd: {
        files: ['build/module/**.js', 'test/**.js'],
        tasks: ['eslint', 'mochaTest'],
        options: {
          spawn: false
        }
      }
    });
    grunt.task.run(['watch']);
  });

  // Initialization

  grunt.initConfig(config);

};
