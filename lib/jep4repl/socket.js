const { Cc, Ci, components } = require("chrome");
const CC = components.Constructor;
var IO = require("./IO").IO;

var Server = CC("@mozilla.org/network/server-socket;1", "nsIServerSocket", "init");
var TransportSevice = Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService);
var SocketTranport = Ci.nsISocketTransport;
var Pump = CC("@mozilla.org/network/input-stream-pump;1", "nsIInputStreamPump", "init");
var Pipe = CC("@mozilla.org/pipe;1", "nsIPipe", "init");

var CONNECTING = 0; //The connection has not yet been established
var OPEN = 1; //Socket connection is established and communication is possible
var CLOSED = 2; //The connection has been closed or could not be opened


var Socket = exports.Socket = function Socket() {};
Socket.prototype = new IO();
Socket.prototype.readyState = CONNECTING;
Socket.prototype.constructor = Socket;
Socket.prototype.__defineGetter__("host", function() {
    return this.__transport__ ? this.__transport__.host : undefined;
});
Socket.prototype.__defineGetter__("port", function() {
    return this.__transport__ ? this.__transport__.port : undefined;
});
Socket.prototype.open = function open(host, port) {
    ['Opens the socket for communication\
    @param host:String      The host to connect to\
    @param port:Number      The port on which to connect']
    var transport = this.__transport__ = this.__transport__ || TransportSevice.createTransport(null, 0, host, port, null);
    var stateSync = new StateSync(this);
    var pipe = new Pipe(true, true, 0, 0, null);
    var rawInput = transport.openInputStream(0, 0, 0);
    this._inputBuffer = new IO(rawInput, null);
    this._outputBuffer = new IO(null, pipe.outputStream);
    this.inputStream = pipe.inputStream;
    this.outputStream = transport.openOutputStream(/*Ci.nsITransport.OPEN_BLOCKING*/0, 0, 0);
    var pump = new Pump(rawInput, -1, -1, 0, 0, false);
    pump.asyncRead(new StreamBufferrer(this), null);
};
Socket.prototype.onopen = function onopen() {
    ['triggered when connection is established and communication is possible\
    this method is supposed to be overrided by socket server users']
};
Socket.prototype.onmessage = function onmessage() {
    ['triggered when new data is arrived from the peer\
    this method is supposed to be overrided by socket user']
};
Socket.prototype.close = function close() {
    ['Opens the socket for communication']
    IO.prototype.close.call(this);
    this._inputBuffer.close();
    this._outputBuffer.close();
    this.__transport__.close(0);
};
Socket.prototype.onclose = function onclose() {
    ['triggered when connection has been closed.\
    this method is supposed to be overrided by socket server users']
};

function StreamBufferrer(socket) {
    this.socket = socket;
}
StreamBufferrer.prototype = {
    constructor: StreamBufferrer,
    onStartRequest: function(request, context) {},
    onStopRequest: function(request, context, status) {
        var socket = this.socket;
        socket.readyState = CLOSED;
        socket.onclose();
    },
    onDataAvailable: function(request, context, stream, offset, count) {
        var socket = this.socket;
        socket._inputBuffer.copy(socket._outputBuffer);
        socket.onmessage();
    }
};
function StateSync(socket) {
    this.socket = socket;
    socket.__transport__.setEventSink(this, null);
}
StateSync.prototype = {
    constructor: StateSync,
    onTransportStatus: function(transport, status, progress, total) {
        var readyState, socket = this.socket;
        switch (status) {
            case SocketTranport.STATUS_RESOLVING:
            case SocketTranport.STATUS_CONNECTING_TO:
                readyState = CONNECTING;
                break;
            case SocketTranport.STATUS_CONNECTED_TO:
            case SocketTranport.STATUS_SENDING_TO:
            case SocketTranport.STATUS_WAITING_FOR:
            case SocketTranport.STATUS_RECEIVING_FROM:
                readyState = OPEN;
                break;
        }
        if (readyState == OPEN && socket.readyState == CONNECTING) {
            socket.readyState = OPEN;
            socket.onopen();
        }
    }
};

var ServerSocket = exports.ServerSocket = function ServerSocket() {
    if (!(this instanceof ServerSocket)) return new ServerSocket();
};
ServerSocket.prototype = {
    constructor: Server,
    listen: function listen(port, loopbackOnly, backLog) {
        ['server socket that can accept incoming connections.\
        @param String(port)=8080\
            The port of the server socket.\
        @param loopbackOnly:Boolean=true\
            If true, the server socket will only respond to connections on the\
            local loopback interface. Otherwise, it will accept connections\
            from any interface.  To specify a particular network interface.\
        @param ?backLog:Numeber']

        loopbackOnly = (loopbackOnly !== false);
        backLog = backLog || -1;
        var server = this;
        var __server__ = this.__server__ = new Server(port, loopbackOnly, backLog);
        console.log('1')
        __server__.asyncListen({
            onSocketAccepted: function(__server__, transport) {
                ['This method is called when a client connection is accepted.\
                Processes an incoming request coming in on the given socket and contained\
                in the given transport.\
                @param socket:nsIServerSocket           the socket request was served with\
                @param transport:nsISocketTransport     the transport for the request/response\
                @see nsIServerSocketListener.onSocketAccepted']

                var socket = new Socket();
                socket.onopen  = server.onopen;
                socket.onmessage = server.onmessage;
                socket.onclose = server.onclose;
                socket.__transport__ = transport;
                socket.readyState = OPEN;
                socket.open();
                socket.onopen();
            },
            onStopListening: function(server, socket) {
                ['This method is called when the listening socket stops for some reason.\n\
                The server socket is effectively dead after this notification.\
                @param {nsIServerSocket} server             The server socket.\
                @param {nsresult} status                    The reason why the\
                    server socket stopped listening.  If the server socket was\
                    manually closed, then this value will be NS_BINDING_ABORTED.']
            }
        });
    },
    onopen: Socket.prototype.onopen,
    onmessage: Socket.prototype.onmesssage,
    onclose: Socket.prototype.onclose,
    close: function() {
        ['Triggered when connection is stopped\
        @param {Connection} connection - stopped connection']
        this.__server__.close();
    },
};