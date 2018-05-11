let ebml = require('../lib/ebml/index.js');
let schema = require('./schema.js');
let etu = require('ethereumjs-util');
var createKeccakHash = require('keccak');

let decoder = new ebml.Decoder(null, schema);
let encoder = new ebml.Encoder(null, schema);
let stack;
let encodedData;

function initStack() {
    stack = [{}];
}

class Tag {
    constructor(properties) {
        for(let p in properties)
            this[p] = properties[p];
        Object.defineProperty(this, '__childrenMap', {enumerable: false, configurable: true, writable: true});
    }

    getChild(name) {
        if(!this.children)
            return;
        if(typeof name === 'number')
            return this.children[name];
        let c = this.__childrenMap[name];
        return c && c[0];
    }

    getChildren(name) {
        if(!this.children)
            return;
        if(name)
            return this.__childrenMap[name];
        return this.children;
    }
}

function addChild(item, item1) {
    if(!item.children)
        item.children = [];

    if(!item.__childrenMap)
        item.__childrenMap = {};
    if(!item.__childrenMap[item1.name])
        item.__childrenMap[item1.name] = [];
    item.__childrenMap[item1.name].push(item1);

    item.children.push(item1);
}

decoder.on('data', function(chunk) {
    if(chunk[0] === 'start') {
        let item = stack[stack.length - 1];

        let data = chunk[1];
        let item1 = new Tag({
            name: data.name,
            type: data.type
        });

        addChild(item, item1);
        stack.push(item1);
    }else if(chunk[0] === 'tag') {
        let item = stack[stack.length - 1];

        let data = chunk[1];
        let item1 = new Tag({
            name: data.name,
            type: data.type,
            data: data.data,
            value: data.value
        });

        addChild(item, item1);
    }else{ //chunk[0] === 'end'
        stack.pop();
    }
});

encoder.on('data', function(chunk) {
    encodedData = chunk;
});

function decode(/*Buffer*/ data, myAddress) {
    initStack();
    decoder.write(data);

    let obj = stack[0].children[0];
    check(obj, myAddress);
    return obj;
}

function encode(raw, pk) {
    function encode(node){
        let info = encoder._schema.findTagByName(node.name);
        if(info.type === 'm'){
            encoder.write(['start', node]);
            for(let i=0; i<node.children.length; ++i){
                encode(node.children[i]);
            }
            encoder.write(['end', node]);
        }else{
            encoder.write(['tag', node]);
        }
    }

    encode(raw);
    return encodedData;
}

function check(obj, myAddress) {
    switch (obj.name) {
        case 'ModificationRequest':
            checkModificationRequest(obj);
            break;
    }
}

function checkModificationRequest(obj, myAddress){
    let entries = obj.getChildren('Entry');
    for(let i=0; i<entries.length; ++i){
        checkEntry(entries[i], myAddress);
    }
}

function checkEntry(entry, myAddress) {
    let header = entry.getChild('EntryHeader');
    let addr = getSigner(header);
    let signer = obj.getChild('Signer').data;
    if(Buffer.compare(addr, signer) != 0)
        throw new Error('Entry signature check is failed! Sig: ' + signature.toString('hex').substr(0, 20) + '...');

    checkFields(entry.getChild('FieldList'), header.getChild('EntryFldHash'));
    checkCheques(entry, myAddress);
}

function getSigner(obj) {
    let children = obj.getChildren();
    let signature = obj.getChild('Signature').data;
    let keccak = createKeccakHash('keccak256');
    for(let i=0; i<children.length; ++i){
        let child = children[i];
        if(child.name != 'Signature')
            computeHashOnData(obj, keccak);
    }

    let hash = keccak.digest();

    let pubk = etu.ecrecover(hash, signature[64], signature.slice(0, 32), signature.slice(32, 64));
    let addr = etu.pubToAddress(pubk);
    return addr;
}

function computeHashOnData(obj, hash) {
    if(obj.type == 'm') {
        let children = obj.getChildren();
        for(let i=0; i<children.length; ++i)
            computeHashOnData(children[i], hash);
    }else{
        hash.update(obj.data);
    }
}

function checkFields(list, hash){
    let fields = list.getChildren('Field');
    if(!fields)
        return;
    let keccakAllFields = createKeccakHash('keccak256');
    for(let i=0; i<fields.length; ++i) {
        let field = fields[i];
        let fldhash = field.getChild('FieldHash');
        if(fldhash){
            keccakAllFields.update(fldhash.data);
        }else {
            let keccakField = createKeccakHash('keccak256');
            keccakField.update(field.getChild('FieldName').data);
            keccakField.update(field.getChild('FieldValue').data);
            keccakAllFields.update(keccakField.digest());
        }
    }

    let hash = hash.getData();
    if(!Buffer.compare(hash, keccakAllFields.digest()))
        throw new Error('Fields hash does not match! Hash: ' + hash.toString('hex'));
}

function checkCheques(entry, myAddress) {
    let list = entry.getChild('ChequeList');
    if(!list)
        return;
    let cheques = list.getChildren('Cheque');
    for(let i=0; i<cheques.length; ++i) {
        let cheque = cheques[i];
        let addr = getSigner(cheque);

        if(Buffer.compare(addr, myAddress) != 0)
            throw new Error(`Cheque is not mine: ${cheque.getChild('ChequeRange').data.toString('hex')}-${cheque.getChild('ChequeRange').value}`);
    }
}

module.exports = {
    decode: decode,
    encode: encode
};