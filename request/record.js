const Field = require('./field');
const createKeccakHash = require('keccak');
const codec = require('./codec');

class Record {
    constructor(tablespace, table) {
        this.fields = {};
        this.tablespace = tablespace;
        this.table = table;
    }

    putField(name, field) {
        this.fields[name] = field;
    }

    putBinaryValue(name, value, type) {
        this.fields[name] = new Field(name, type, {binaryValue: value});
    }

    putValue(name, value, type) {
        this.fields[name] = new Field(name, type, {value: value});
    }

    putHash(name, hash, type) {
        this.fields[name] = new Field(name, type, {hash: hash});
    }

    getField(name) {
        return this.fields[name];
    }

    getValue(name) {
        return this.fields[name] && this.fields[name].getValue();
    }

    getSortedFieldNames() {
        return Object.keys(this.fields).sort();
    }

    getFieldsHash(fieldNames) {
        if(!fieldNames)
            fieldNames = this.getSortedFieldNames();
        let keccak = createKeccakHash('keccak256');
        for (let name of fieldNames){
            let field = this.getField(name);
            keccak.update(field.getBinaryName());
            keccak.update(field.getHash());
        }

        return keccak.digest();
    }

    getFieldList(fieldNames) {
        let fl = new codec.Tag('FieldList');
        if(!fieldNames)
            fieldNames = this.getSortedFieldNames();
        for(let name of fieldNames) {
            let field = this.getField(name);
            let f = field.toTag();
            fl.addChild(f);
        }

    }

}