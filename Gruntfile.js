/* eslint-env node */

'use strict';

var build = require('./tools/build');
var connectLivereload = require('connect-livereload');
var loadGruntTasks = require('load-grunt-tasks');
var merge = require('lodash/merge');

module.exports = function (grunt) {

  loadGruntTasks(grunt);

  var config = {};

  // Module

  merge(config, {
    clean: {
      module: ['modules/**']
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
    grunt.file.write('modules/p.script.js', build({
      catch: true,
      resolve: true,
      reject: true,
      all: true,
      race: true,
      ie: true
    }));
    grunt.file.write('modules/p.node.js', build({
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
    'web/bundle.js': 'customizer/main.js',
    'web/builder-worker.js': 'customizer/builder-worker.js'
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
      customizer: ['web/**'],
      postWeb: [
        'web/bundle.js',
        'web/node_modules/**'
      ]
    },
    connect: {
      customizer: {
        options: {
          port: 1024,
          base: ['web/'],
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
          'web/index.html': 'web/index.html'
        }
      }
    },
    sync: {
      customizer: {
        files: [{
          expand: true,
          cwd: 'customizer/',
          src: ['**', '!*.js'],
          dest: 'web/'
        }, {
          expand: true,
          src: ['node_modules/bootstrap/dist/**'],
          dest: 'web/'
        }]
      }
    },
    uglify: {
      customizer: {
        src: 'web/builder-worker.js',
        dest: 'web/builder-worker.js'
      }
    },
    usemin: {
      options: {
        assetsDirs: ['web/']
      },
      html: 'web/index.html'
    },
    useminPrepare: {
      options: {
        dest: 'web/'
      },
      html: 'web/index.html'
    },
    watch: {
      customizerSync: {
        // Have to use `**/*` due to issue #481.
        files: ['customizer/**/*'],
        tasks: ['sync:customizer']
      },
      customizerBuild: {
        files: ['web/**/*'],
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
    'usemin',
    'htmlmin:customizer',
    'clean:postWeb'
  ]);

  grunt.registerTask('web', ['customizer:web']);

  // QA

  merge(config, {
    eslint: {
      all: {
        src: [
          '*.js',
          'customizer/**.js',
          'test/**.js',
          'modules/**.js',
          '!modules/**.min.js'
        ]
      }
    },
    mochaTest: {
      all: {
        src: ['test/**.js'],
        options: {
          clearRequireCache: true
        }
      }
    }
  });

  grunt.registerTask('test', ['module', 'eslint', 'mochaTest']);

  // Development

  // Build the module and the customizer continuously.
  grunt.registerTask('serve', ['module', 'customizer:serve', 'watch']);

  // In tandem with `grunt serve`, run tests continuously.
  grunt.registerTask('tdd', function () {
    grunt.config('watch', {
      tdd: {
        files: ['modules/**.js', 'test/**.js'],
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
