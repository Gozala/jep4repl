/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint undef: true es5: true node: true devel: true globalstrict: true
         forin: true latedef: false supernew: true */
/*global define: true */


"use strict";

const net = require('net/net')
const { Shell } = require('./shell')
const { Cc, Ci } = require('chrome')

exports.repl = function repl(options, callbacks) {
  let server = net.createServer(function (stream) {
    stream.setEncoding('utf8')
    stream.on('close', function close() {
      Cc['@mozilla.org/toolkit/app-startup;1'].
        getService(Ci.nsIAppStartup).quit(Ci.nsIAppStartup.eAttemptQuit)
    })
    stream.on('error', function (e) console.error(e.message, e.stack))
    Shell(stream)
  })
  server.on('error', function (e) console.error(e.message, e.stack))
  server.listen(4242)
}
exports.repl()
