let ebml = require('../lib/ebml/index.js');
let schema = require('./schema.js');

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

function decode(/*Buffer*/ data) {
    initStack();
    decoder.write(data);

    let raw = stack[0].children[0];
    return raw;
}

function encode(raw) {
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

module.exports = {
    decode: decode,
    encode: encode
};