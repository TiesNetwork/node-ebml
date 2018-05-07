var ebml = require('./index.js');
var fs = require('fs');
var util = require('util');

var decoder = new ebml.Decoder();
var stack = [{}];

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

decoder.on('finish', function() {
    console.log(util.inspect(stack[0].children[0], {showHidden: false, depth: null}));
});

fs.readFile('ties-update.proto', function(err, data) {
    if (err)
        throw err;
    decoder.end(data);
});