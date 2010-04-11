var observer = require("observer-service");
var shell = require("./shell").shell;
var Server = require("./socket").ServerSocket;

exports.main = function main(options, callbacks) {
    observer.add("final-ui-startup", function (s,d) {
        var server = new Server();
        server.onopen = function onopen() {
            console.log("client connected");
            shell(this);
            this.onopen();
        };
        server.onclose = function onclose() {
            //callbacks.quit("OK");
            this.onclose();
        }
        server.listen("4242");
        console.log("jep4repl is listening...");
    });
};
