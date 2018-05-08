var fs = require('fs');
var util = require('util');

var codec = require('./request/codec');

fs.readFile('ties-insert-new.proto', function(err, data) {
    if (err)
        throw err;
    var req = codec.decode(data);
    console.log(util.inspect(req, {showHidden: false, depth: null}));

    data = codec.encode(req);
    console.log(data.toString('hex'));

});