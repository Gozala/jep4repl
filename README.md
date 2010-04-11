jep4repl
========

jep4repl provides a javascript shell with in the scope of a jetpack module 
itself. This is a basic debugging tooling that can be very useful during
development.

Status
------

So far there is a lot of code and some of it is quite ugly and in some cases
reinvents `jetpack-core` modules. That is  because jetpack was ported from 
[narwhal-xulrunner] and most of the dependencies have been just copied over.
On the good side it works as it used on [narwhal-xulrunner].

Usage
-----

<pre class="console">
    cd packages
    git clone git://github.com/Gozala/jep4repl.git
    cd jep4repl
    cfx run -a firefox
    rlwrap telnet localhost 4242
</pre>

[narwhal-xulrunner]: http://github.com/gozala/narwhal-xulrunner