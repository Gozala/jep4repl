"use strict";

const net = require('net')
,     { Shell } = require("./jep4repl/shell")

exports.main = function main(options, callbacks) {
  let server = net.createServer(function(stream) {
    stream.setEncoding('utf8')
    stream.on('close', function() stream.end())
    Shell(stream)
  }).listen(4343)
}

