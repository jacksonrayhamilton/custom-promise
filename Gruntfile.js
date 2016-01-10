/*jshint node: true */
'use strict';
module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  var config = {};
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
    config.concat['p-' + name] = {
      options: options,
      src: 'p.js',
      dest: 'build/p.' + name + '.js'
    };
  });
  config.mochaTest = {
    all: {
      src: ['tests.js']
    }
  };
  config.watch = {
    build: {
      files: ['p.js'],
      tasks: ['build']
    }
  };
  config.jshint = {
    all: {
      src: ['p.js']
    }
  };
  grunt.initConfig(config);
  grunt.registerTask('test:promises-aplus', function () {
    require('promises-aplus-tests')(require('./adapter'), this.async());
  });
  grunt.registerTask('test:extensions', ['mochaTest']);
  grunt.registerTask('build', ['concat']);
  grunt.registerTask('serve', ['build', 'watch']);
  grunt.registerTask('test', ['jshint', 'test:promises-aplus', 'test:extensions']);
};
