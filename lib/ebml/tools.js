/* global Uint8Array, DataView, Buffer, TextDecoder */
var BN = require('bn.js');
var numberMax = new BN(Number.MAX_SAFE_INTEGER);
var numberMin = new BN(Number.MIN_SAFE_INTEGER);

var tools = {

    /**
     * read variable length integer per https://www.matroska.org/technical/specs/index.html#EBML_ex
     * @param {Uint8Array} buffer containing input
     * @param {Number} start position in buffer
     * @returns {*}  value / length object
     */
    readVint: function(buffer, start) {
        start = start || 0;
        for(var length = 1; length <= 8; length++) {
            if(buffer[start] >= Math.pow(2, 8 - length)) {
                break;
            }
        }
        if(length > 8) {
            throw new Error("Unrepresentable length: " + length + " " +
                tools.readHexString(buffer, start, start + length));
        }
        if(start + length > buffer.length) {
            return null;
        }
        var value = buffer[start] & (1 << (8 - length)) - 1;
        for(var i = 1; i < length; i++) {
            if(i === 7) {
                if(value >= Math.pow(2, 53 - 8) && buffer[start + 7] > 0) {
                    return {
                        length: length,
                        value: -1
                    };
                }
            }
            value *= Math.pow(2, 8);
            value += buffer[start + i];
        }
        return {
            length: length,
            value: value
        };
    },

    /**
     * write variable length integer
     * @param {Number} value to store into buffer
     * @returns {Buffer} containing the value
     */
    writeVint: function(value) {
        if(value < 0 || value > Math.pow(2, 53)) {
            throw new Error("Unrepresentable value: " + value);
        }
        for(var length = 1; length <= 8; length++) {
            if(value < Math.pow(2, 7 * length) - 1) {
                break;
            }
        }
        var buffer = new Buffer(length);
        for(var i = 1; i <= length; i++) {
            var b = value & 0xFF;
            buffer[length - i] = b;
            value -= b;
            value /= Math.pow(2, 8);
        }
        buffer[0] = buffer[0] | (1 << (8 - length));
        return buffer;
    },

    /**
     * *
     * concatenate two arrays of bytes
     * @param {Uint8Array} a1  First array
     * @param {Uint8Array} a2  Second array
     * @returns  {Uint8Array} concatenated arrays
     */
    concatenate: function(a1, a2) {
        if(!a1 || a1.byteLength === 0) {
            return a2;
        }
        if(!a2 || a2.byteLength === 0) {
            return a1;
        }
        var result = new Uint8Array(a1.byteLength + a2.byteLength);
        result.set(a1, 0);
        result.set(a2, a1.byteLength);
        a1 = null;
        a2 = null;
        return result;
    },

    /**
     * get a hex text string from Buff[start,end)
     * @param {Uint8Array} buff from which to read the string
     * @param {Number} start, default 0
     * @param {Number} end, default the whole buffer
     * @returns {string} the hex string
     */
    readHexString: function(buff, start, end) {
        var result = '';

        if(!start) {
            start = 0;
        }
        if(!end) {
            end = buff.byteLength;
        }

        for(var p = start; p < end; p++) {
            var q = Number(buff[p] & 0xff);
            result += ("00" + q.toString(16)).substr(-2);
        }
        return result;
    },
    readUtf8: function(buff) {
        if(typeof window === 'undefined') {
            return Buffer.from(buff).toString("utf8");
        }
        try {

            /* redmond Middle School science projects don't do this. */
            if(typeof TextDecoder !== "undefined") {
                return new TextDecoder("utf8").decode(buff);
            }
            return null;
        } catch(exception) {
            return null;
        }
    },

    /**
     * get an unsigned number from a buffer
     * @param {Uint8Array} buff from which to read variable-length unsigned number
     * @returns {number} result (in hex for lengths > 6)
     */
    readUnsigned: function(buff) {
        var b = new DataView(buff.buffer, buff.byteOffset, buff.byteLength);
        switch(buff.byteLength) {
        case 1:
            return b.getUint8(0);
        case 2:
            return b.getUint16(0);
        case 4:
            return b.getUint32(0);
        default:
        {
            let bn = new BN(new Uint8Array(buff.buffer, buff.byteOffset, buff.byteLength));
            if(bn.lte(numberMax))
                return bn.toNumber();
            return bn;
        }
        }
    },
    readSigned: function(buff) {
        var b = new DataView(buff.buffer, buff.byteOffset, buff.byteLength);
        switch(buff.byteLength) {
        case 1:
            return b.getInt8(0);
        case 2:
            return b.getInt16(0);
        case 4:
            return b.getInt32(0);
        default:
        {
            let bn = new BN(new Uint8Array(buff.buffer, buff.byteOffset, buff.byteLength));
            if(!bn.isZero() && bn.testn(buff.byteLength*8-1)) //if the highest bit is 1 make it negative
                bn.isub(new BN(0).bincn(buff.byteLength*8).subn(1));
            if(bn.lte(numberMax) && bn.gte(numberMin))
                return bn.toNumber();
            return bn;
        }
        }

    },
    readFloat: function(buff) {
        var b = new DataView(buff.buffer, buff.byteOffset, buff.byteLength);
        switch(buff.byteLength) {
        case 4:
            return b.getFloat32(0);
        case 8:
            return b.getFloat64(0);
        default:
            return NaN;
        }
    },

    readDataFromTag: function(tagObj, data) {
        const UNIX_EPOCH_DELAY = 978307200000;

        tagObj.data = data;
        switch(tagObj.type) {
        case "u":
            tagObj.value = tools.readUnsigned(data);
            break;
        case "f":
            tagObj.value = tools.readFloat(data);
            break;
        case "i":
            tagObj.value = tools.readSigned(data);
            break;
        case "d":
            tagObj.value = tools.readUnsigned(data) + UNIX_EPOCH_DELAY;
            break;
        case "s":
            tagObj.value = String.fromCharCode.apply(null, data);
            break;
        case "8":
            tagObj.value = tools.readUtf8(data);
            break;
        case "b":
            tagObj.value = data;
            break;
        default:
            break;
        }

        return tagObj;
    }
};

module.exports = tools;
