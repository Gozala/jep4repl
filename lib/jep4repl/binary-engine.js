const { Cc, Ci } = require("chrome");

exports.B_LENGTH = function(bytes) {
    return bytes.length;
};

exports.B_ALLOC = function(length) {
    var bytes = new Array(length);
    for (var i = 0; i < length; i++)
        bytes[i] = 0;
    return bytes;
};

exports.B_FILL = function(bytes, from, to, value) {
    for (var i = from; i < to; i++)
        bytes[i] = value;
};

exports.B_COPY = function(src, srcOffset, dst, dstOffset, length) {
    for (var i = 0; i < length; i++)
        dst[dstOffset+i] = src[srcOffset+i];
};

exports.B_GET = function(bytes, index) {
    var b = bytes[index];
    return (b >= 0) ? b : -1 * ((b ^ 0xFF) + 1);
};

exports.B_SET = function(bytes, index, value) {
    return bytes[index] = (value < 128) ? value : -1 * ((value ^ 0xFF) + 1);
};

exports.B_DECODE = function(bytes, offset, length, codec) {
    var Converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Ci.nsIScriptableUnicodeConverter);
    Converter.charset = codec;
    return Converter.convertFromByteArray(bytes.slice(offset, offset + length), length)
};

exports.B_DECODE_DEFAULT = function(bytes, offset, length) {
    return exports.B_DECODE(bytes, offset, length, "UTF-8");
};

exports.B_ENCODE = function(string, codec) {
    var Converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Ci.nsIScriptableUnicodeConverter);
    Converter.charset = codec;
    return Converter.convertToByteArray(string, {});
};

exports.B_ENCODE_DEFAULT = function(string) {
    return exports.B_ENCODE(string, "UTF-8");
};

exports.B_TRANSCODE = function(bytes, offset, length, sourceCodec, targetCodec) {
    return exports.B_ENCODE(exports.B_DECODE(bytes, offset, length, sourceCodec), targetCodec);
};