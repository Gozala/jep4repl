var observer = require("observer-service");
var shell = require("./shell").shell;
var Server = require("./socket").ServerSocket;

exports.main = function main(options, callbacks) {
    console.log('started')
    var server = new Server();
    server.onopen = function onopen() {
        console.log("client connected");
        shell(this);
        this.onopen();
    };
    server.onclose = function onclose() {
        this.onclose();
        //callbacks.quit("OK");
    }
    console.log('server is ')
    server.listen("4242");
    console.log("jep4repl is listening...");
};

if (require.main == module) exports.main()