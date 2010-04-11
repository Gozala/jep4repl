var global = this;

['Narwhal shell module']
var Sandbox = require("./sandbox-engine").Sandbox;
var EMPTY_MATCH = /^\s*$/;
var STATEMENT_MATCH = /^\s*;\s*$/;
var buffer = "";
var NORMAL_PS = "js> ";
var UNFINISHED_PS = "   > ";

exports.shell = function shell(socket) {
    ['Shell service']
    // Stroing WebSocketHandler's onmessage method to redirect on non flash policy requests
    var buffer = "";
    var ps = NORMAL_PS;
    var sandbox = Sandbox(global);
    var print = sandbox.print = function print(text) {
        socket.write(text + "\n");
    }
    function repl() {
        socket.write(Array.prototype.slice.call(arguments).join("\n" + ps) + "\n");
    }
    function prompt() {
        socket.write(ps);
    }
    function handleError(e) {
        var result = "";
        var realException = e.cause || e;
        if (realException) {
            result += "Details:\n";
            for (var key in realException) {
                var content = String(realException[key]);
                if (content.indexOf('\n') != -1) content = '\n' + content.replace(/^(?!$)/gm, '    ');
                else content = ' ' + content;
                result += '  ' + key + ':' + content.replace(/\s*\n$/m, '');
            }
            result += "\n"
        }
        return result;
    }
    function represent(thing) {
        var result;
        switch(typeof(thing)) {
            case "string":
                result = '"' + thing + '"';
                break;
            case "number":
                result = thing;
                break;
            case "object":
                var names = [];
                for(var name in thing) names.push(name);
                result = thing;
                if (names.length > 0) {
                    result += " - {";
                    result += names.slice(0, 7).map(function(n) {
                        var repr = n + ": ";
                        try {
                            repr += (typeof(thing[n]) == "object" ? "{...}" : represent(thing[n]));
                        } catch(e) {
                            repr += "[Exception!]";
                        }
                        return repr;
                    }).join(", ");
                    if (names.length > 7) result += ", ...";
                    result += "}";
                }
                break;
            case "function":
                var source = thing.toString();
                result = source.substr(0, source.indexOf("\n")) + "...}";
                break;
            default:
                result = thing;
        }
        return result;
    }
    socket.onopen = function() {
       print("Narwhal Shell 0.1");
       prompt();
    };
    socket.onmessage = function() {
        var chunk = this.read().decodeToString();
        if (EMPTY_MATCH.test(chunk)) return prompt();
        var isStatement = STATEMENT_MATCH.test(chunk);
        buffer += chunk;
        try {
            var result = sandbox._ = sandbox.evaluate(buffer);
            if (undefined !== result) repl(represent(result));
            buffer = "";
            ps = NORMAL_PS;
        } catch(e) {
            sandbox.__ = e;
            if (e.name == "SyntaxError" && !isStatement) {
                ps = UNFINISHED_PS;
            } else {
                print(handleError(e));
                buffer = "";
                ps = NORMAL_PS;
            }
        }
        prompt();
    };
    socket.onclose = function() {}
};