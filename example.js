var fs = require('fs');
var util = require('util');

var codec = require('./request/codec');

fs.readFile('ties-insert-new.proto', function(err, data) {
    if (err)
        throw err;
    var req = codec.decode(data, new Buffer("fafe9c9e7845f446d091c12c74d44c61a0923c00", "hex"));
    console.log(util.inspect(req, {showHidden: false, depth: null}));

    data = codec.encode(req);
    console.log(data.toString('hex'));

});