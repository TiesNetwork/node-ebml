/* global Uint8Array, Buffer, TextDecoder */
var Transform = require('stream').Transform,
    tools = require('./tools.js'),
    debug = require('debug')('ebml:decoder');

var STATE_TAG = 1,
    STATE_SIZE = 2,
    STATE_CONTENT = 3;


function EbmlDecoder(options, schema) {
    options = options || {};
    options.readableObjectMode = true;
    Transform.call(this, options);

    this._buffer = null;
    this._tag_stack = [];
    this._path = [];
    this._state = STATE_TAG;
    this._cursor = 0;
    this._total = 0;
    this._schema = schema;
}

require('util').inherits(EbmlDecoder, Transform);

EbmlDecoder.prototype._transform = function(chunk, enc, done) {

    if(this._buffer === null) {
        this._buffer = new Uint8Array(chunk);
    } else {
        this._buffer = tools.concatenate(this._buffer, new Uint8Array(chunk));
    }

    while(this._cursor < this._buffer.length) {
        if(this._state === STATE_TAG && !this.readTag()) {
            break;
        }
        if(this._state === STATE_SIZE && !this.readSize()) {
            break;
        }
        if(this._state === STATE_CONTENT && !this.readContent()) {
            break;
        }
    }

    done();
};

EbmlDecoder.prototype.getSchemaInfo = function(tagStr, path) {
    return this._schema.findTag(tagStr, path);
};

EbmlDecoder.prototype.readTag = function() {

    debug('parsing tag');

    if(this._cursor >= this._buffer.length) {
        debug('waiting for more data');
        return false;
    }

    var start = this._total;
    var tag = tools.readVint(this._buffer, this._cursor);

    if(tag == null) {
        debug('waiting for more data');
        return false;
    }

    var tagStr = tools.readHexString(this._buffer, this._cursor, this._cursor + tag.length);

    this._cursor += tag.length;
    this._total += tag.length;
    this._state = STATE_SIZE;

    var info = this.getSchemaInfo(tagStr, this._path);

    var tagObj = {
        tag: tag.value,
        tagStr: tagStr,
        type: info.type,
        name: info.name,
        start: start,
        end: start + tag.length
    };

    this._tag_stack.push(tagObj);
    this._path.push(info);
    debug('read tag: ' + tagStr);

    return true;
};

EbmlDecoder.prototype.readSize = function() {

    var tagObj = this._tag_stack[this._tag_stack.length - 1];

    debug('parsing size for tag: ' + tagObj.tag.toString(16));

    if(this._cursor >= this._buffer.length) {
        debug('waiting for more data');
        return false;
    }


    var size = tools.readVint(this._buffer, this._cursor);

    if(size === null) {
        debug('waiting for more data');
        return false;
    }

    this._cursor += size.length;
    this._total += size.length;
    this._state = STATE_CONTENT;
    tagObj.dataSize = size.value;

    // unknown size
    if(size.value === -1) {
        tagObj.end = -1;
    } else {
        tagObj.end += size.value + size.length;
    }

    debug('read size: ' + size.value);

    return true;
};

EbmlDecoder.prototype.readContent = function() {

    let tagObj = this._tag_stack[this._tag_stack.length - 1];

    debug('parsing content for tag: ' + tagObj.tag.toString(16))

    if(tagObj.type === 'm') {
        debug('content should be tags');
        this.push(['start', tagObj]);
        this._state = STATE_TAG;
        if(tagObj.dataSize) //Account for empty meta tags
            return true;    //Do not return if there are no inner tags
    }

    if(this._buffer.length < this._cursor + tagObj.dataSize) {
        debug('got: ' + this._buffer.length);
        debug('need: ' + (this._cursor + tagObj.dataSize));
        debug('waiting for more data');
        return false;
    }

    if(tagObj.type !== 'm') {
        let data = this._buffer.subarray(this._cursor, this._cursor + tagObj.dataSize);
        this._total += tagObj.dataSize;
        this._state = STATE_TAG;
        this._buffer = this._buffer.subarray(this._cursor + tagObj.dataSize);
        this._cursor = 0;

        this._tag_stack.pop(); // remove the object from the stack
        this._path.pop();


        this.push(['tag', tools.readDataFromTag(tagObj, Buffer.from(data))]);
        debug('read data: ' + data.toString('hex'));
    }

    while(this._tag_stack.length > 0) {
        let topEle = this._tag_stack[this._tag_stack.length - 1];
        if(this._total < topEle.end || topEle.end === -1) {
            break;
        }
        this.push(['end', topEle]);
        this._tag_stack.pop();
        this._path.pop();
    }

    return true;
};

module.exports = EbmlDecoder;
