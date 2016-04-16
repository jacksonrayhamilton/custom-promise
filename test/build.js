'use strict';

var assert = require('assert');
var build = require('../tools/build');
var esprima = require('esprima');
var get = require('lodash/get');
var walk = require('esprima-walk');

var hasTopLevelFunction = function (ast) {
  return (
    get(ast, 'body[0].type') === 'VariableDeclaration' &&
      get(ast, 'body[0].declarations[0].init.type') === 'FunctionExpression'
  );
};

var isNamedFunctionExpression = function (node) {
  return (
    node.type === 'VariableDeclarator' &&
      node.id.name === 'p' &&
      node.init.type === 'FunctionExpression' &&
      get(node, 'init.id.name') === 'p'
  );
};

var getTaskFunction = function (node) {
  return (
    node.type === 'VariableDeclarator' &&
      node.id.name === 'callCallbacks' &&
      get(node, 'init.body.body[1].body.body[0].expression.callee.name')
  );
};

var hasInlineThen = function (node) {
  return (
    node.type === 'VariableDeclarator' &&
      node.id.name === 'promise' &&
      get(node, 'init.properties[0].value.type') === 'FunctionExpression'
  );
};

var isThenReference = function (node) {
  return (
    node.type === 'VariableDeclarator' &&
      node.id.name === 'promiseThen'
  );
};

var hasCatch = function (node) {
  return (
    node.type === 'VariableDeclarator' &&
      node.id.name === 'promise' &&
      get(node, 'init.properties[1].value.type') === 'FunctionExpression'
  );
};

var hasQuotedCatch = function (node) {
  return (
    node.type === 'VariableDeclarator' &&
      node.id.name === 'promise' &&
      get(node, 'init.properties[1].key.raw') === '\'catch\''
  );
};

var hasResolveReference = function (node) {
  return (
    node.type === 'VariableDeclarator' &&
      node.id.name === 'pResolve'
  );
};

var hasExposed = function (node, method) {
  return (
    node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      get(node, 'left.object.name') === 'p' &&
      get(node, 'left.property.name') === method
  );
};

var hasExposedResolve = function (node) {
  return hasExposed(node, 'resolve');
};

var hasReject = function (node) {
  return hasExposed(node, 'reject');
};

var hasAll = function (node) {
  return hasExposed(node, 'all');
};

var hasRace = function (node) {
  return hasExposed(node, 'race');
};

var hasNodeModule = function (node) {
  return (
    node.type === 'AssignmentExpression' &&
      node.left.type === 'MemberExpression' &&
      get(node, 'left.object.name') === 'module' &&
      get(node, 'left.property.name') === 'exports'
  );
};

var examineCode = function (code) {
  var ast = esprima.parse(code);
  var report = {
    hasTopLevelFunction: false,
    hasNamedFunctionExpression: false,
    hasInlineThen: false,
    hasThenReference: false,
    hasCatch: false,
    hasQuotedCatch: false,
    hasResolveReference: false,
    hasExposedResolve: false,
    hasResolve: false,
    hasReject: false,
    hasAll: false,
    hasRace: false,
    hasNodeModule: false
  };
  if (hasTopLevelFunction(ast)) {
    report.hasTopLevelFunction = true;
  }
  walk(ast, function (node) {
    if (isNamedFunctionExpression(node)) {
      report.hasNamedFunctionExpression = true;
    }
    var taskFunction = getTaskFunction(node);
    if (taskFunction) {
      report.taskFunction = taskFunction;
    }
    if (hasInlineThen(node)) {
      report.hasInlineThen = true;
    }
    if (isThenReference(node)) {
      report.hasThenReference = true;
    }
    if (hasCatch(node)) {
      if (hasQuotedCatch(node)) {
        report.hasQuotedCatch = true;
      }
      report.hasCatch = true;
    }
    if (hasResolveReference(node)) {
      report.hasResolveReference = true;
      report.hasResolve = true;
    }
    if (hasExposedResolve(node)) {
      report.hasExposedResolve = true;
      report.hasResolve = true;
    }
    if (hasReject(node)) {
      report.hasReject = true;
    }
    if (hasAll(node)) {
      report.hasAll = true;
    }
    if (hasRace(node)) {
      report.hasRace = true;
    }
    if (hasNodeModule(node)) {
      report.hasNodeModule = true;
    }
  });
  return report;
};

var assertReport = function (actual, expected) {
  for (var key in expected) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      if (actual[key] !== expected[key]) {
        assert.fail(
          actual[key],
          expected[key],
          'Expected ' + key + ' to be ' + expected[key] + ' but it was ' + actual[key]
        );
      }
    }
  }
};

describe('build', function () {

  it('should generate a minimal build', function () {
    assertReport(examineCode(build()), {
      hasTopLevelFunction: true,
      hasNamedFunctionExpression: true,
      taskFunction: 'setTimeout',
      hasInlineThen: true,
      hasThenReference: false,
      hasCatch: false,
      hasResolve: false,
      hasReject: false,
      hasAll: false,
      hasRace: false,
      hasNodeModule: false
    });
  });

  it('should enable catch', function () {
    assertReport(examineCode(build({
      catch: true
    })), {
      hasInlineThen: false,
      hasThenReference: true,
      hasCatch: true,
      hasQuotedCatch: false
    });
  });

  it('should quote catch for ie', function () {
    assertReport(examineCode(build({
      catch: true,
      ie: true
    })), {
      hasCatch: true,
      hasQuotedCatch: true
    });
  });

});
