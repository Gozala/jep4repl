jetpack repl
============

Jetpack [repl] provides a javascript shell with in the scope of a jetpack
module. This is a simple tool useful during development.

Usage
-----

<pre class="console">
  cd packages
  git clone git://github.com/Gozala/jep4repl.git
  cd jep4repl
  cfx run -a firefox
  # to have access to the modules in your package
  # cfx run -a firefox --extra-packages=myPackage 
  rlwrap telnet localhost 4242
</pre>

[repl]:http://en.wikipedia.org/wiki/REPL

