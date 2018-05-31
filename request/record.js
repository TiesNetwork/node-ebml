const Field = require('./field');
const createKeccakHash = require('keccak');
const codec = require('./codec');
const Tag = codec.Tag;
const C = require('./constants');
const etu = require('ethereumjs-util');


class Record {
    constructor(tablespace, table) {
        this.fields = {};
        this.prevVersion = 0;
        this.prevHash = null;
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

    getEntry(pk) {
        let entry = new Tag('Entry');
        let entryHeader = new Tag('EntryHeader');
        entry.addChild(entryHeader);

        let fieldNames = this.getSortedFieldNames();
        let fldhash = this.getFieldsHash(fieldNames);

        entryHeader.addChild('Signer', etu.privateToAddress(pk));
        entryHeader.addChild('EntryTablespaceName', this.tablespace);
        entryHeader.addChild('EntryTableName', this.table);
        entryHeader.addChild('EntryType', this.prevVersion ? C.EntryType.UPDATE : C.EntryType.INSERT);
        entryHeader.addChild('EntryTimestamp', new Date());
        entryHeader.addChild('EntryVersion', this.prevVersion + 1);
        entryHeader.addChild('EntryFldHash', fldhash);
        if(this.prevHash)
            entryHeader.addChild('EntryOldHash', this.prevHash);
        entryHeader.addChild('EntryNetwork', C.Network.ETHEREUM);

        let hash = codec.computeHashOnData(entryHeader).digest();
        let sig = codec.sign(hash, pk);
        entryHeader.addChild('Signature', sig);

        let fl = this.getFieldList(fieldNames);
        entry.addChild(fl);

        return entry;
    }

    putFields(fields, types) {
        for (let f in fields) {
            let type = types[f];
            if(!type)
                throw new Error('No type for field ' + f);
            this.putField(f, new Field(f, type, fields[f]));
        }
    }

}

module.exports = Record;