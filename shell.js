/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint undef: true es5: true node: true devel: true globalstrict: true
         forin: true latedef: false supernew: true */
/*global define: true */


"use strict";

const { Cc, Ci } = require('chrome');
const { Loader } = require('@loader');
const options = require('@packaging');
require('./sandbox');

/* Narwhal shell module */

const EMPTY_MATCH = /^\s*$/,
      STATEMENT_MATCH = /^\s*;\s*$/,
      NORMAL_PS = 'js> ',
      UNFINISHED_PS = '   > ',
      FIN = String.fromCharCode(65533, 65533, 65533, 65533, 6)

function handleError(e) {
  let result = '', realException = e.cause || e

  if (realException) {
    result += e + '\nDetails:\n'
    for (let key in realException) {
      let content = '' + realException[key]
      if (content.indexOf('\n') != -1)
        content = '\n' + content.replace(/^(?!$)/gm, '    ')
      else content = ' ' + content
      result += '  ' + key + ':' + content.replace(/\s*\n$/m, '')
    }
    result += "\n"
  }
  return result
}

/**
 * Internal utility function that is used to generate
 * textual representation of things passed to it.
 */

function represent(thing) {
  let result
  switch (typeof (thing)) {
  case 'string':
    result = '"' + thing + '"'
    break
  case 'number':
    result = thing
    break
  case 'object':
    if (null === thing) {
      result = 'null'
      break
    }
    if (Array.isArray(thing)) {
      result = '[' + thing.map(represent).join(',') + ']'
      break
    }
    let names = []
    for (let name in thing) names.push(name)
    result = '/* ' + thing + ' */'
    if (names.length > 0) {
      result += ' \n{ '
      result += names.slice(0, 7).map(function (name) {
        let repr = name + ': '
        try {
          let $ = thing[name]
          repr += 'object' == typeof $ && null !== $ ? '{...}' : represent($)
        } catch (e) {
          repr += '[Exception!]'
        }
        return repr
      }).join('\n, ')
      if (names.length > 7) result += '\n, ....................'
      result += '\n}'
    }
    break
  case "function":
    result = thing.toString().split('\n').slice(0, 2).join('\n') + '...}'
    break
  default:
    result = '' + thing
  }
  return result
}

function Shell(stream) {
  let buffer = '', ps = NORMAL_PS, result, error
  let loader = Loader.new(options);
  let sandbox = Loader.require.call(loader, module.uri, './sandbox');
  let line = 1;

  let uri = Object.keys(loader.sandboxes).filter(function(uri) {
    return uri.substr(-1 * 'sandbox.js'.length) === 'sandbox.js'
  }).map(function(uri) uri)[0]
  let sandbox = loader.sandboxes[uri];
  Object.defineProperties(sandbox.sandbox, {
    _: { get: function () result },
    __: { get: function () error },
    require: { value: function require(id) {
      let parts = id.split('/')
      let uri = id[0] === '/' ? 'file://' + id :
                options.uriPrefix + parts.shift() + '-lib/' + parts.join('/')
      if (uri.slice(-3) !== '.js') uri = uri + '.js'

      console.log(uri)

      if (uri in loader.modules) {
        module = loader.modules[uri];
      } else {
        module = loader.modules[uri] = {
          uri: uri,
          id: id,
          exports: {},
          setExports: function setExports(exports) {
            this.exports = exports;
          }
        }
        loader.load(module)
        Object.freeze(module)
      }

      if (typeof(module) === 'function') module = module(this, requirer)
      return module.exports
    }},
    print: { value: function () print.apply(null, arguments) }
  });

  function print(text) stream.write(text + '\n')

  function repl() stream.write(Array.slice(arguments).join('\n' + ps) + '\n')

  function prompt() stream.write(ps)

  stream.on('data', function (data) {
    if (EMPTY_MATCH.test(data)) return prompt()
    if (FIN == data) return stream.end()
    let isStatement = STATEMENT_MATCH.test(data)
    buffer += data
    try {
      result = sandbox.evaluate(buffer, '@repl')
      if (undefined !== result) repl(represent(result))
      buffer = ''
      ps = NORMAL_PS
    } catch (e) {
      error = e
      if ('SyntaxError' == e.name && !isStatement) {
        ps = UNFINISHED_PS
      } else {
        print(handleError(e))
        buffer = ''
        ps = NORMAL_PS
      }
    }
    prompt()
  })
  print('Jetpack repl')
  prompt()
}
exports.Shell = Shell
