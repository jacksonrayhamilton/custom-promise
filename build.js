/* eslint-env node */
/* eslint-disable no-sync */

'use strict';

var fs = require('fs');
var template = require('lodash/string/template');
var pTemplate = template(fs.readFileSync('src/p', 'utf8'));
var then = fs.readFileSync('src/then', 'utf8');

var getIndentation = function (level) {
  var indentation = '';
  for (var i = 0; i < level; i += 1) {
    indentation += '  ';
  }
  return indentation;
};

// Increase every line of `code` after the first by `levels` of indentation.
var indentCode = function (code, levels) {
  return code.replace(new RegExp('\\n', 'g'), '\n' + getIndentation(levels));
};

// Decrease every line of `code` after the first by `levels` of indentation.
var dedentCode = function (code, levels) {
  return code.replace(new RegExp('\\n' + getIndentation(levels), 'g'), '\n');
};

// Determine flags to set on the program template and return generated code.
var build = function (options) {
  options = options || {};

  var node = Boolean(options.node);

  var task =
      options.task ? options.task
      : node ? 'process.nextTick'
      : 'setTimeout';
  var globals = options.globals || (
      (options.task || node) ? []
      : ['setTimeout']
  );

  var exposeCatch = Boolean(options.catch);
  var exposeResolve = Boolean(options.resolve);
  var exposeReject = Boolean(options.reject);
  var exposeAll = Boolean(options.all);

  var includeCatch = exposeCatch;
  var includeReject = exposeReject;
  var includeAll = exposeAll;
  var includeResolve = exposeResolve || includeReject || includeAll;

  var referenceResolve = includeReject;

  var ie = Boolean(options.ie);
  var catchKey = ie ? '\'catch\'' : 'catch';
  var catchKeyComment = ie ? ' // Quotes for old IE' : '';

  var wrap =
      ((includeResolve || includeReject || includeAll) && !node) ||
      ie; // IE has named function expression bugs.

  // Use a named function expression to maintain a reference to `p` regardless
  // of global variable tampering.
  var nfe = !wrap && !node;

  var envs = options.envs || [];

  if (node) {
    envs.push('node');
  }

  var envSettings = envs.length > 0 ? '/* eslint-env ' + envs.join(',') + ' */\n' : '';
  var globalSettings = globals.length > 0 ? '/* global ' + globals.join(',') + ' */\n' : '';

  var code = pTemplate({
    indentCode: indentCode,
    envSettings: envSettings,
    globalSettings: globalSettings,
    then: then,
    task: task,
    exposeCatch: exposeCatch,
    exposeResolve: exposeResolve,
    exposeReject: exposeReject,
    exposeAll: exposeAll,
    includeCatch: includeCatch,
    includeResolve: includeResolve,
    includeReject: includeReject,
    includeAll: includeAll,
    referenceResolve: referenceResolve,
    wrap: wrap,
    nfe: nfe,
    ie: ie,
    node: node,
    catchKey: catchKey,
    catchKeyComment: catchKeyComment
  });

  if (!wrap) {
    code = dedentCode(code, 1);
  }

  return code;
};

module.exports = build;
