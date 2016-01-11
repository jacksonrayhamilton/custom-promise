/*jshint node: true */
'use strict';
module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  var config = {};
  config.compress = {
    all: {
      options: {
        mode: 'gzip'
      },
      files: {
        'build/p.min.js.gz': 'build/p.min.js',
        'build/p.micro.min.js.gz': 'build/p.micro.min.js'
      }
    }
  };
  var moduleTypes = [
    {
      name: 'commonjs',
      options: {
        footer: 'module.exports = p;'
      }
    }
  ];
  config.concat = {
    options: {
      separator: ''
    }
  };
  moduleTypes.forEach(function (moduleType) {
    var name = moduleType.name;
    var options = moduleType.options;
    config.concat[name] = {
      options: options,
      src: 'p.js',
      dest: 'build/p.' + name + '.js'
    };
  });
  config.jshint = {
    all: {
      src: ['p.js']
    }
  };
  config.mochaTest = {
    all: {
      src: ['tests.js']
    }
  };
  config.preprocess = {
    extra: {
      options: {
        context: {
          EXTRA: true
        }
      },
      src: 'p.js',
      dest: 'build/p.js'
    },
    micro: {
      src: 'p.js',
      dest: 'build/p.micro.js'
    }
  };
  config.uglify = {
    all: {
      files: {
        'build/p.min.js': 'build/p.js',
        'build/p.micro.min.js': 'build/p.micro.js'
      }
    }
  };
  config.watch = {
    build: {
      files: ['p.js'],
      tasks: ['build']
    }
  };
  grunt.initConfig(config);
  grunt.registerTask('build', ['preprocess', 'concat', 'uglify', 'compress']);
  grunt.registerTask('serve', ['build', 'watch']);
  grunt.registerTask('test', ['jshint', 'mochaTest']);
};
