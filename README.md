# EBML [![Build Status](https://travis-ci.org/themasch/node-ebml.png?branch=master)](https://travis-ci.org/themasch/node-ebml) [![NPM](https://nodei.co/npm/ebml.png?compact=true)](https://www.npmjs.com/package/ebml)

[![Greenkeeper badge](https://badges.greenkeeper.io/themasch/node-ebml.svg)](https://greenkeeper.io/)

[EBML](http://ebml.sourceforge.net/) stands for Extensible Binary Meta-Language
and is somewhat of a binary version of XML.
It's used for container formats like webm or [mkv](http://www.matroska.org/technical/specs/index.html).

This fork supports universal schema - you can create your own document structure specific to your project.

# install

```
npm install universal-ebml --save
```

# usage

The `Decoder(options, schema)` class is implemented as a [Node Transform stream](https://nodejs.org/api/stream.html#stream_class_stream_transform). As input it takes ebml. As output it emits a sequence of chunks: two-element arrays looking like this example.

```
[ "tag",
  { 
    name: "TimecodeScale",
    type: "u",
    value: 1000000 
   } 
 ]
```

The first element of the array is a short text string. For tags containing values, like this example, the string is `'tag'`. 
ebml also has nesting tags. The opening of those tags has the string `'start'` and the 
closing has the string `'end'`.

The second element of the array is an object with these members, among others:

* `name` is the [Matroska](https://matroska.org/technical/specs/index.html) Element Name. 
* `type` is the data type.
  * `u`: unsigned integer. Some of these are UIDs, coded as 128-bit numbers.
  * `i`: signed integer.
  * `f`: IEEE-754 floating point number.
  * `s`: printable ASCII text string.
  * `8`: printable utf-8 Unicode text string.
  * `d`: a 64-bit signed timestamp, in nanoseconds after (or before) `2001-01-01T00:00UTC`.
  * `b` binary data, otherwise uninterpreted.
* `value` is the value of the data in the element, represented as a number or a string.
Integers stored in 6 bytes or less are represented as numbers, and longer integers are represented as hexadecimal text strings.
* `data` is the binary data of the entire element stored in a [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).

# examples

This example reads a media file into memory and decodes it. The `decoder`
invokes its `data` event for each Element.

See more comprehensive example with custom schema at https://github.com/TiesNetwork/universal-ebml/blob/master/example.js .

```js
const ebml = require('./index.js');
const fs = require('fs');
const schema = require('./test/mkv_schema'); //Matroska schema for tests

const decoder = new ebml.Decoder(null, schema);
decoder.on('data', function(chunk) {
    console.log(chunk);
});
fs.readFile('test/media/test.webm', function(err, data) {
    if (err)
        throw err;
    decoder.write(data);
});
```

This example does the same thing, but by piping the file stream into the decoder (a Transform stream).

```js
const ebml = require('./index.js');
const ebmlDecoder = new ebml.Decoder(null, schema);
const schema = require('./test/mkv_schema'); //Matroska schema for tests
const counts = {};
require('fs').createReadStream('test/media/test.webm')
    .pipe(ebmlDecoder)
    .on('data', chunk => {
        console.log (chunk);
        const name = chunk[1].name;
        if (!counts[name]) counts[name] = 0;
        counts[name]++;
    })
    .on('finish', () => {
        console.log(counts);
    });
``` 

# state of this project

Parsing works, encoder works, user defined schema works. If anything doesn't, please create [an issue](https://github.com/themasch/node-ebml/issues/new).

# license

MIT

# contributors

(in alphabetical order)

* [Chris Price](https://github.com/chrisprice)
* [Davy Van Deursen](https://github.com/dvdeurse)
* [Ed Markowski](https://github.com/siphontv)
* [Manuel Wiedenmann](https://github.com/fsmanuel)
* [Mark Schmale](https://github.com/themasch)
* [Mathias Buus](https://github.com/mafintosh)
* [Max Ogden](https://github.com/maxogden)
* [Oliver Jones](https://github.com/OllieJones)
* [Oliver Walzer](https://github.com/owcd)
