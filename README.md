# jetpack repl #

Jetpack [repl] provides a javascript shell with in the scope of a jetpack
module. This is a simple tool useful during development.


## Install ##

    # cd to packages directory in addon-sdk folder.
    cd packages
    # clone this project
    git clone https://github.com/Gozala/jep4repl.git
    # clone dependency
    git clone https://github.com/Gozala/jetpack-net.git

## Usage ##

    cd jep4repl
    cfx run
    # To have access to the modules in foo and bar packages use this instead:
    # cfx run --extra-packages=foo,bar

    # connect to the repl server
    rlwrap telnet localhost 4242

[repl]:http://en.wikipedia.org/wiki/REPL
