var fs = require('fs');
var util = require('util');

var codec = require('./request/codec');
var Connection = require('./net/connection');
var uuidv4 = require('uuid/v4');
var bigdecimal = require("bigdecimal");
var Record = require("./request/record");

fs.readFile('ties-insert-new.proto', function(err, data) {
    if (err)
        throw err;
    //var req = codec.decode(data, new Buffer("fafe9c9e7845f446d091c12c74d44c61a0923c00", "hex"));
    //console.log(util.inspect(req, {showHidden: false, depth: null}));

    //data = codec.encode(req);
    //console.log(data.toString('hex'));

    let types = {
        Id: 'uuid',
        fBinary: 'binary',
        fBoolen: 'boolean',
        fDecimal: 'decimal',
        fDouble: 'double',
        fDuration: 'duration',
        fFloat: 'float',
        fInteger: 'integer',
        fLong: 'long',
        fString: 'string',
        fTime: 'time'
    };

    let record = new Record('client-dev.test', 'all_types');
    record.putFields({
        Id: uuidv4(),
        fBinary: new Buffer(5),
        fBoolen: true,
        fDecimal: new bigdecimal.BigDecimal("123456.123456789012345678901234567890"),
        fDouble: 158.234e200,
        fDuration: 1000,
        fFloat: -42803.234e-8,
        fInteger: 423424432,
        fLong: -27837492837477482,
        fString: "This is UTF-8 строка",
        fTime: new Date()
    }, types);

    //0xe0a61e5ad74fc154927e8412c7f03528134f755e7eb45554eb7a99c2744ac34e
    //0xAe65bAf610Bad3F0d71Aa3C3a8110c2d62cbEb19

    let c = new Connection('ws://192.168.1.45:8080/websocket');
    c.modify([record], Buffer.from('e0a61e5ad74fc154927e8412c7f03528134f755e7eb45554eb7a99c2744ac34e', 'hex'))

    
});