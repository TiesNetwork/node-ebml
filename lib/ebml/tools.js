/* global Uint8Array, DataView, Buffer, TextDecoder */
var BN = require('bn.js');
var numberMax = new BN(Number.MAX_SAFE_INTEGER);
var numberMin = new BN(Number.MIN_SAFE_INTEGER);

function bn2numberIfPossible(bn){
    if(bn.lte(numberMax) && bn.gte(numberMin))
        return bn.toNumber();
    return bn;
}

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
    readUnsigned: function(buff, bnAlways) {
        if(bnAlways) {
            let bn = new BN(buff);
            return bn;
        }

        let b = new DataView(buff.buffer, buff.byteOffset, buff.byteLength);
        switch(buff.byteLength) {
        case 1:
            return b.getUint8(0);
        case 2:
            return b.getUint16(0);
        case 4:
            return b.getUint32(0);
        default:
        {
            let bn = tools.readUnsigned(buff, true);
            return bn2numberIfPossible(bn);
        }
        }
    },

    readSigned: function(buff, bnAlways) {
        if(bnAlways){
            let bn = new BN(buff);
            if(!bn.isZero() && bn.testn(buff.byteLength*8-1)) //if the highest bit is 1 make it negative
                bn.isub(new BN(0).bincn(buff.byteLength*8));
            return bn;
        }

        let b = new DataView(buff.buffer, buff.byteOffset, buff.byteLength);
        switch(buff.byteLength) {
        case 1:
            return b.getInt8(0);
        case 2:
            return b.getInt16(0);
        case 4:
            return b.getInt32(0);
        default:
        {
            let bn = tools.readSigned(buff, true);
            return bn2numberIfPossible(bn);
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

    toType: function(data, type) {
        let value;
        switch(type) {
            case "u":
                value = tools.readUnsigned(data);
                break;
            case "f":
                value = tools.readFloat(data);
                break;
            case "i":
                value = tools.readSigned(data);
                break;
            case "d":
                value = tools.readSigned(data, true);
                value.iadd(tools.UNIX_EPOCH_DELAY.muln(tools.DATE_SCALE));
                value = bn2numberIfPossible(value);
                break;
            case "s":
                value = String.fromCharCode.apply(null, data);
                break;
            case "8":
                value = tools.readUtf8(data);
                break;
            case "b":
                value = data;
                break;
            default:
                throw new Error('Unknown tag type: ' + type);
        }

        return value;

    },

    readDataFromTag: function(tagObj, data) {
        tagObj.data = data;
        if(!tools.LAZY_CONVERSION)
            tagObj.value = tools.toType(data, tagObj.type);
        return tagObj;
    },

    encodeSigned: function (value) {
        let bn;
        if(typeof value === 'string' && value.startsWith('0x')){
            bn = new BN(value.substr(2), 16);
        }else{
            bn = new BN(value);
        }

        let byteLength = bn.byteLength() || 1;
        if(bn.testn(byteLength*8-1) && !bn.isNeg())
            byteLength += 1;

        return bn.toTwos(byteLength*8).toBuffer('be', byteLength);
    },

    encodeUnsigned: function (value) {
        let buf = tools.encodeSigned(value);
        if(buf[0]&0x80)
            return Buffer.concat([Buffer.alloc(1), buf]);
        return buf;
    },

    encodeFloat: function (value) {
        let buf = Buffer.allocUnsafe(8);
        buf.writeDoubleBE(value, 0);
        return buf;
    },

    toBinary: function(value, type){
        let data;
        switch(type) {
            case "u":
                data = tools.encodeUnsigned(value);
                break;
            case "f":
                data = tools.encodeFloat(value);
                break;
            case "i":
                data = tools.encodeSigned(value);
                break;
            case "d":
                if(value instanceof Date)
                    value = new BN(+value).imuln(tools.DATE_SCALE); //If it is js date we need to make nanoseconds from milliseconds

                if(BN.isBN(value))
                    value = value.sub(tools.UNIX_EPOCH_DELAY.muln(tools.DATE_SCALE));
                else
                    value = new BN(+value).isub(tools.UNIX_EPOCH_DELAY.muln(tools.DATE_SCALE));
                data = tools.encodeSigned(value);
                break;
            case "s":
            case "8":
                data = Buffer.from("" + value);
                break;
            case "b":
                data = Buffer.isBuffer(value) ? value : Buffer.from(value);
                break;
            default:
                throw new Error('Unknown tag type: ' + type);

        }

        return data;

    },

    writeDataToTag: function(tagObj, value) {
        tagObj.value = value;
        tagObj.data = tools.toBinary(value, tagObj.type);

        return tagObj;
    },

    DATE_SCALE: 1000000, //Nanoseconds
    LAZY_CONVERSION: false, //Do not convert to JS type on decode
    UNIX_EPOCH_DELAY: new BN(978307200000), //In milliseconds,
};

module.exports = tools;
