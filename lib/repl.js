"use strict";

const net = require('net/net')
  ,   { Shell } = require('./repl/shell')
  ,   { Cc, Ci } = require('chrome')

exports.main = function main(options, callbacks) {
  let server = net.createServer(function(stream) {
    stream.setEncoding('utf8')
    stream.on('close', function() {
      Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup).
      quit(Ci.nsIAppStartup.eAttemptQuit)
    })
    stream.on('error', function(e) console.error(e.message, e.stack ))
    Shell(stream)
    exports.stream = stream;
  })
  server.on('error', function(e) console.error(e.message, e.stack))
  server.listen(4242)
}

