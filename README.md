jetpack repl
============

Jetpack [repl] provides a javascript shell with in the scope of a jetpack
module. This is a simple tool useful during development.

Usage
-----

  cd packages
  git clone git://github.com/Gozala/jep4repl.git
  cd jep4repl
  cfx run
  # to have access to the modules in your package
  # cfx run --extra-packages=myPackage 
  rlwrap telnet localhost 4242

[repl]:http://en.wikipedia.org/wiki/REPL

