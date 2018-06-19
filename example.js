var fs = require('fs');
var util = require('util');

var codec = require('./request/codec');
var Connection = require('./net/connection');
var uuidv4 = require('uuid/v4');
var bigdecimal = require("bigdecimal");
var Record = require("./request/record");

fs.readFile('myreq.proto', async function(err, data) {
    if (err)
        throw err;
    //var req = codec.decode(data, new Buffer("fafe9c9e7845f446d091c12c74d44c61a0923c00", "hex"));
    //console.log(util.inspect(req, {showHidden: false, depth: null}));

    //data = codec.encode(req);
    //console.log(data.toString('hex'));

    let types = {
        Id: 'uuid',
        fBinary: 'binary',
        fBoolean: 'boolean',
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
    let uuid = uuidv4();
    record.putFields({
        Id: uuid,
        fBinary: new Buffer("e0a61e5ad74f", 'hex'),
        fBoolean: false,
        fDecimal: new bigdecimal.BigDecimal("-1.235e-8"),
        fDouble: 158.234e200,
        fDuration: 20*86400,
        fFloat: -42803.234e-8,
        fInteger: 423424432,
        fLong: -278374928374,
        fString: "This is UTF-8 строка",
        fTime: new Date()
    }, types);

    //0xe0a61e5ad74fc154927e8412c7f03528134f755e7eb45554eb7a99c2744ac34e
    //0xAe65bAf610Bad3F0d71Aa3C3a8110c2d62cbEb19

    let c = new Connection();
    await c.connect('ws://192.168.1.44:8080/websocket');

    let response = await c.modify([record], Buffer.from('e0a61e5ad74fc154927e8412c7f03528134f755e7eb45554eb7a99c2744ac34e', 'hex'));

    let selresp = await c.retrieve(
        `SELECT 
            Id, 
            bigIntAsBlob(toUnixTimestamp(CAST(writeTime(fTime) AS date))) AS WriteTime, 
            intAsBlob(0x309) AS TestValue 
        FROM "client-dev.test"."all_types"
        WHERE
            Id IN (${uuid.toString()})`
    );

//    response = await c.modify([record], Buffer.from('e0a61e5ad74fc154927e8412c7f03528134f755e7eb45554eb7a99c2744ac34e', 'hex'));

    console.log(util.inspect(selresp, {showHidden: false, depth: null}));

    c.close();
    
});