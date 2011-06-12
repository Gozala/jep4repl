/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint undef: true es5: true node: true devel: true globalstrict: true
         forin: true latedef: false supernew: true */
/*global define: true */


"use strict";

const { Loader } = require('api-utils/cuddlefish')

/* Narwhal shell module */

const EMPTY_MATCH = /^\s*$/,
      STATEMENT_MATCH = /^\s*;\s*$/,
      NORMAL_PS = 'js> ',
      UNFINISHED_PS = '   > ',
      FIN = String.fromCharCode(65533, 65533, 65533, 65533, 6),
      globals = { packaging: packaging }

function handleError(e) {
  let result = '', realException = e.cause || e

  if (realException) {
    result += 'Details:\n'
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

  let sandbox = new Loader({
    console: console,
    globals: Object.create(globals),
    packaging: packaging,
    rootPaths: packaging.options.rootPaths,
    jetpackID: packaging.options.jetpackID,
    uriPrefix: packaging.options.uriPrefix,
    metadata: packaging.options.metadata,
    name: packaging.options.name
  }).findSandboxForModule('repl/sandbox')
  Object.defineProperties(sandbox._sandbox, {
    _: {
      get: function () result
    },
    __: {
      get: function () error
    },
    print: {
      value: function () {
        print.apply(null, arguments)
      }
    }
  })

  function print(text) stream.write(text + '\n')

  function repl() stream.write(Array.slice(arguments).join('\n' + ps) + '\n')

  function prompt() stream.write(ps)

  stream.on('data', function (data) {
    if (EMPTY_MATCH.test(data)) return prompt()
    if (FIN == data) return stream.end()
    let isStatement = STATEMENT_MATCH.test(data)
    buffer += data
    try {
      result = sandbox.evaluate(buffer)
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
