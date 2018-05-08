let ebml = require('../lib/ebml/index.js');
let schema = require('./schema.js');

let decoder = new ebml.Decoder(null, schema);
let encoder = new ebml.Encoder(null, schema);
let stack;
let encodedData;

function initStack() {
    stack = [{}];
}

decoder.on('data', function(chunk) {
    if(chunk[0] == 'start') {
        var item = stack[stack.length - 1];
        if(!item.children)
            item.children = [];

        var item1 = chunk[1];
        item.children.push(item1);
        stack.push(item1);
    }else if(chunk[0] == 'tag') {
        var item = stack[stack.length - 1];
        if(!item.children)
            item.children = [];
        stack[stack.length - 1].children.push(chunk[1]);
    }else{
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