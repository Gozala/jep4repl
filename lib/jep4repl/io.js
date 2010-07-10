const {Cc, Ci, components} = require("chrome");
var CC = components.Constructor;
var Pipe = CC("@mozilla.org/pipe;1", "nsIPipe", "init");
var BinaryOutputStream = CC("@mozilla.org/binaryoutputstream;1", "nsIBinaryOutputStream", "setOutputStream");
var BinaryInputStream = CC("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream", "setInputStream");
var SeekableStream = Ci.nsISeekableStream;

var extensions = require("./global-commonjs");
Array.prototype.__proto__ = extensions.Array.prototype;
String.prototype.__proto__ = extensions.String.prototype;
var ByteString = require("./binary").ByteString;

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
};
IO.prototype = {
    _binaryInputStream: null,
    _binaryOutputStream: null,
    get binaryInputStream() {
        return this._binaryInputStream || (this._binaryInputStream = new BinaryInputStream(this.inputStream));
    },
    get binaryOutputStream() {
        return this._binaryOutputStream || (this._binaryOutputStream = new BinaryOutputStream(this.outputStream));
    },
    read: function(length) {
        var stream = this.binaryInputStream;
        var readAll = (arguments.length == 0);
        if (typeof length !== "number") length = 1024;
        var bytes = stream.readByteArray(readAll ? stream.available() : length);
        return new ByteString(bytes, 0, bytes.length);
    },
    copy: function(output, mode, options) {
        var stream = this.binaryInputStream;
        var length = stream.available();
        var bytes = stream.readByteArray(length);
        output.binaryOutputStream.writeByteArray(bytes, length);
        output.flush();
        return this;
    },
    write: function(object, charset) {
        if (object === null || object === undefined || typeof object.toByteString !== "function")
            throw new Error("Argument to IO.write must have toByteString() method: " + object);
        var binary = object.toByteString(charset);
        var offset = binary._offset;
        var bytes = binary._bytes;
        var length = (this.length = binary.length);
        this.binaryOutputStream.writeByteArray(bytes.slice(offset, offset + bytes.length), length);
        return this;
    },
    flush: function() {
        this.binaryOutputStream.flush();
        return this;
    },
    close: function() {
        if (this._binaryInputStream) this._binaryInputStream.close();
        if (this.inputStream) this.inputStream.close();
        if (this._binarOutputStream) this._binaryOutputStream.close();
        if (this.outputStream) this.outputStream.close();
    },
    isatty: function() {
        return false;
    },
    _seekable: false,
    _ensureSeekable: function() {
        if (this._seekable) return;
        if (this.inputStream) this.inputStream.QueryInterface(SeekableStream);
        if (this.outputStream) this.outputStream.QueryInterface(SeekableStream);
        this._seekable = true;
    },
    seek: function(opaqueCookie) {
        this._ensureSeekable();
        if (this.inputStream) {
            var offset = opaqueCookie.inputStream === undefined ? opaqueCookie : opaqueCookie.inputStream;
            var whence = offset < 0 ? SeekableStream.NS_SEEK_END : SeekableStream.NS_SEEK_SET;
            this.inputStream.seek(whence, offset);
        }
        if (this.outputStream) {
            var offset = opaqueCookie.outputStream === undefined ? opaqueCookie : opaqueCookie.outputStream;
            var whence = offset < 0 ? SeekableStream.NS_SEEK_END : SeekableStream.NS_SEEK_SET;
            this.outputStream.seek(whence, offset);
        }
        return this;
    },
    tell: function() {
        this._ensureSeekable();
        return {
            inputStream: this.inputStream ? this.inputStream.tell() : null,
            outputStream: this.outputStream ? this.outputStream.tell() : null
        };
    }
};