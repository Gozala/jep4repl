const {Cc, Ci, Cu} = require("chrome");
var systemPrincipal = Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal);
exports.Sandbox = function(options) {
    var context = options || Cu.Sandbox(systemPrincipal);
    context.evaluate = function(code, path) {
        return Cu.evalInSandbox(code, context, "1.8", path || "Anonymus", 0);
    }
    return context;
}