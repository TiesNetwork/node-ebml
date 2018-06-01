const createKeccakHash = require('keccak');
const BN = require('bn.js');
const BD = require('bigdecimal');
const tools = require('../lib/ebml/tools');
const codec = require('./codec');
const uuidParse = require('uuid-parse');

/*
Boolean - логический тип. Может принимать 2 возможных значения: true или false.
Integer - числовой тип, размером 32 бита. От -2147483648, до 2147483647.
Long - числовой тип, размером 64 бита. От -9223372036854775808 до 9223372036854775807.
Float - числовой тип с плавающей точкой, одинарной точности размером 32 бита.
Double - числовой тип с плавающей точкой, двойной точности размером 64 бита.
Decimal - числовой тип произвольной точности. Размер зависит от выбранного масштаба и точности.
String - строковый тип. Состоит из указанной кодировки символов и массива октетов закодированной текстовой строки.
Binary - бинарный тип. Массив октетов.
Time - временной тип, включающий дату. Размер зависит от выбранной точности.
Duration - временной тип отражающий промежуток времени. Размер зависит от выбранной точности.
Коллекции:
List - список элементов, с сохранением последовательности.
Bag - множество элементов. В зависимости от настроек может быть множеством уникальных элементов или мультимножеством.
Map - ассоциативный массив элементов с примитивным типом в качестве ключа. В будущем будет расширен до применения составных типов в качестве ключа.
Составные:
Structure - объект с фиксированным набором элементов. Доступ к элементам может производиться как в ассоциативном массиве по номеру или имени, если массив именованный.
 */

function bigIntToBuffer(bi) {
    let cnt = bi.bitLength();
    let zerobits = (8 - cnt%8);
    const signum = bi.signum();
    if(signum < 0){
        let big = BD.BigInteger.ZERO().setBit(cnt + zerobits);
        bi = big.add(bi);
    }

    let hex = bi.toString(16);
    if(signum > 0 && !(zerobits%8)) {
        //We need to prepend number with 0 byte
        hex = '00' + hex;
    }
    if(hex.length & 1)
        hex = '0' + hex;

    return Buffer.from(hex, 'hex');
}

function _encodeValue(type, value) {
    switch(type){
        case 'boolean':
            return this.value ? Buffer.alloc(0) : Buffer.alloc(1, 1, 'binary');
        case 'integer':
        case 'long':
            return tools.encodeInteger(value);
        case 'float':
        {
            let buf = Buffer.allocUnsafe(4);
            buf.writeFloatBE(value, 0);
            return buf;
        }
        case 'double':
        {
            let buf = Buffer.allocUnsafe(8);
            buf.writeDoubleBE(value, 0);
            return buf;
        }
        case 'duration':
        case 'decimal':
        {
            let bd = value;
            if(!(bd instanceof BD.BigDecimal))
                bd = new BD.BigDecimal(value);

            let scale = bd.scale();
            if(scale >= 0)
                scale *= 2;
            else
                scale = -scale*2 + 1;

            let unscaled = bd.unscaledValue();
            let scaleBuf = tools.writeVint(scale);
            let unscaledBuf = bigIntToBuffer(unscaled);
            let buf = Buffer.allocUnsafe(scaleBuf.length + unscaledBuf.length);
            scaleBuf.copy(buf, 0, 0, scaleBuf.length);
            unscaledBuf.copy(buf, scaleBuf.length, 0, unscaledBuf.length);
            return buf;
        }
        case 'string':
            return Buffer.from(value);
        case 'binary':
            return Buffer.isBuffer(value) ? value : Buffer.from(value);
        case 'time':
            return tools.encodeInteger(+value - tools.UNIX_EPOCH_DELAY);
        case 'uuid':
            if(typeof(value) === 'string')
                value = uuidParse.parse(value);
            if(!Buffer.isBuffer(value))
                value = Buffer.from(value);
            return value;
        default:
            throw new Error('Type ' + type + ' is unknown or not yet supported');
    }
}

function _decodeValue(type, buffer){
    switch(type){
        case 'boolean':
            return !!buffer[0];
        case 'integer':
        case 'long':
            return tools.readSigned(buffer);
        case 'float':
        case 'double':
            return tools.readFloat(buffer);
        case 'decimal':
        case 'duration':
        {
            let scale = tools.readVint(buffer, 0);
            let sgn = scale.value & 1;
            let scale_val = (scale.value - sgn)/2;
            if(sgn)
                scale_val = -scale_val;

            let bi = new BD.BigInteger(buffer.slice(scale.length));
            let bd = new BD.BigDecimal(bi, scale_val);
            return bd;
        }
        case 'string':
            return Buffer.toString();
        case 'binary':
            return buffer;
        case 'time':
            return new Date(tools.readSigned(buffer) + tools.UNIX_EPOCH_DELAY);
        case 'uuid':
            return uuidParse.unparse(buffer);
        default:
            throw new Error('Type ' + type + ' is unknown or not yet supported');
    }
}

class Field{
    constructor(name, type, values){
        this.name = name;
        this.type = type.toLowerCase();
        let vals = values || {};
        if(vals.binaryValue)
            this.setBinaryValue(vals.binaryValue);
        else if(vals.hash)
            this.setHash(vals.hash);
        else
            this.setValue(vals.value);
    }

    getValue() {
        if(!this.hasValue())
            throw new Error('The field ' + this.getName() + ' does not have value');
        if(typeof this.__value == 'undefined')
            this.decodeValue();
        return this.__value;
    }

    getBinaryValue() {
        if(!this.hasValue())
            throw new Error('The field ' + this.getName() + ' does not have value');
        if(!this.__binaryValue)
            this.encodeValue();
        return this.__binaryValue;
    }

    getName() {
        return this.name;
    }

    getBinaryName() {
        return Buffer.from(this.name);
    }

    getHash() {
        if(this.__hash)
            return this.__hash;
        if(!this.__binaryValue)
            this.encodeValue();
        this.__hash = createKeccakHash('keccak256').update(this.__binaryValue).digest();
        return this.__hash;
    }

    encodeValue() {
        this.__binaryValue = _encodeValue(this.type, this.__value);
        return this.__binaryValue;
    }

    decodeValue() {
        this.__value = _decodeValue(this.type, this.__binaryValue);
        return this.__value;
    }

    setValue(val) {
        this.__binaryValue = null;
        this.__hash = null;
        this.__value = val;
    }

    setBinaryValue(val) {
        this.__binaryValue = val;
        this.__hash = null;
        this.decodeValue();
    }

    setHash(val) {
        this.__hash = val;
        this.__value = undefined;
        this.__binaryValue = null;
    }

    hasValue() {
        return typeof this.__value !== 'undefined';
    }

    toTag() {
        let tag = new codec.Tag('Field');
        tag.addChild(new codec.Tag({name: 'FieldName', data: this.getBinaryName()}));
        tag.addChild(new codec.Tag({name: 'FieldType', data: Buffer.from(this.type)}));
        if(this.hasValue()){
            tag.addChild(new codec.Tag({name: 'FieldValue', data: this.getBinaryValue()}));
        }else{
            tag.addChild(new codec.Tag({name: 'FieldHash', data: this.getHash()}));
        }
        return tag;

    }


}

module.exports = Field;