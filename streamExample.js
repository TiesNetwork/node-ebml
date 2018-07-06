var ebml = require('./index.js');
const schema = require('./test/mkv_schema'); //Matroska schema for tests
var ebmlDecoder = new ebml.Decoder(null, schema);
var counts = {};
require('fs').createReadStream('test/media/test.webm').
    pipe(ebmlDecoder).
    on('data', function(chunk) {
    var name = chunk[1].name;
    if (!counts[name]) {
        counts[name] = 0;
    }
    counts[name] += 1;
    }).
    on('finish', function() {
    console.log(counts);
});
