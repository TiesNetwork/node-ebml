const EBML = require('./index.js'); //You will use require('universal-ebml')
const util = require('util');

//Define document schema
let _the_schema = {
    "RootTag": {
        "tag": "1e544945", //Hex tags should be lowercase only
        "type": "m",
        "description": "Root tag"
    },
    "SubTag": {
        "context": ["RootTag"], //The tag can be only a direct child of RootTag
        "tag": "80",
        "type": "m",
        "description": "Sub tag"
    },
    "StringVal": {
        "context": ["SubTag", "ValueList"], //The tag can be only a direct child of SubTag or StringList
        "tag": "80", //The tags can duplicate as long as they can be differentiated by parent contexts
        "type": "8",
        "description": "Utf8 string"
    },
    "ValueList": {
        "context": ["SubTag"], //The tag can be only a direct child of SubTag
        "tag": "81",
        "type": "m",
        "description": "String list"
    },
    "IntVal": {
        "context": ["^SubTag"], //The tag can be only a direct or indirect child of SubTag
        "tag": "a0",
        "type": "i",
        "description": "Int value"
    },
    "UIntVal": {
        "context": ["^SubTag"], //The tag can be only a direct or indirect child of SubTag
        "tag": "a2",
        "type": "u",
        "description": "UInt value"
    },
    "DateVal": {
        "context": ["^SubTag"], //The tag can be only a direct or indirect child of SubTag
        "tag": "a1",
        "type": "d",
        "description": "Date value"
    }

};

let schema = new EBML.Schema(_the_schema);

//Create our document for serializing to EBML
let doc = {
    name: "RootTag",
    children: [
        {
            name: "SubTag",
            children: [
                {
                    name: "StringVal",
                    data: EBML.tools.toBinary("Some string", "8")
                },
                {
                    name: "ValueList",
                    children: [
                        {
                            name: "StringVal",
                            data: EBML.tools.toBinary("Another string", "8")
                        },
                        {
                            name: "IntVal",
                            data: EBML.tools.toBinary(42, "i")
                        },
                        {
                            name: "IntVal",
                            data: EBML.tools.toBinary(-42, "i")
                        },
                        {
                            name: "UIntVal",
                            data: EBML.tools.toBinary(554, "u")
                        },
                    ]
                }
            ]
        },
        {
            name: "SubTag",
            children: [
                {
                    name: "StringVal",
                    data: EBML.tools.toBinary("Yet another string", "8")
                },
                {
                    name: "DateVal",
                    data: EBML.tools.toBinary(new Date("2018-07-27T15:58:00"), "d")
                },
                {
                    name: "UIntVal",
                    data: EBML.tools.toBinary(-554, "u")
                },

            ]
        }
    ]
};

//Let us encode our doc
function encode(root, schema) {
    let encoder = new EBML.Encoder(null, schema);
    let encodedDoc;
    encoder.on("data", chunk => {
        encodedDoc = chunk;
    });

    function encodeInner(node){
        let info = schema.findTagByName(node.name);
        if(info.type === 'm'){
            encoder.write(['start', node]);
            for(let i=0; i<node.children.length; ++i){
                encodeInner(node.children[i]);
            }
            encoder.write(['end', node]);
        }else{
            encoder.write(['tag', node]);
        }
    }

    encodeInner(root);
    return encodedDoc;
}

let encodedDoc = encode(doc, schema);

//Now we have encoded DOC into EBML
console.log("EBML encoded doc: " + encodedDoc.toString('hex'));

//Let us now decode it back
function decode(buffer, schema) {
    let decoder = new EBML.Decoder(null, schema);
    let stack = [{children: []}];

    decoder.on('data', function(chunk) {
        if(chunk[0] === 'start') {
            let item = stack[stack.length - 1];

            let data = chunk[1];
            let item1 = {
                name: data.name,
                type: data.type,
                children: []
            };

            item.children.push(item1);
            stack.push(item1);
        }else if(chunk[0] === 'tag') {
            let item = stack[stack.length - 1];

            let data = chunk[1];
            let item1 = {
                name: data.name,
                type: data.type,
                data: data.data,
                value: data.value
            };

            item.children.push(item1);
        }else{ //chunk[0] === 'end'
            stack.pop();
        }
    });

    decoder.write(buffer);

    if(decoder._tag_stack.length)
        throw new Error('Failed to parse: ' + buffer.toString('hex'));

    return stack[0].children[0];
}

let new_doc = decode(encodedDoc, schema);

//Now we have decoded original doc
console.log("Decoded doc: ", util.inspect(new_doc, {showHidden: false, depth: null}));
