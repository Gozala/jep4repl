"use strict";

const net = require('net')
,     { Shell } = require("./repl/shell")

exports.main = function main(options, callbacks) {
  let server = net.createServer(function(stream) {
    stream.setEncoding('utf8')
    stream.on('end', function() {
      console.log('>> end')
      stream.end('buy')
    })
    stream.on('error', function(e) console.error(e.message, e.stack ))
    Shell(stream)
    exports.stream = stream;
  })
  server.on('error', function(e) console.error(e.message, e.stack))
  server.listen(4242)
}

