const Record = require('./record');
const Field = require('./field');
const codec = require('./codec');
const Tag = codec.Tag;
const C = require('./constants')

class Builder {
    constructor (records) {
        this.consistency = C.Consistency.QUORUM;
        this.records = records || [];
    }

    addRecord(record) {
        this.records.push(record);
    }

    buildModification(pk, requestId) {
        let mr = new Tag('ModificationRequest');
        mr.addChild(new Tag({name: 'Consistency', value: this.consistency}));
        mr.addChild(new Tag({name: 'RequestId', value: requestId}));

        for(let record of this.records) {
            let entry = record.getEntry(pk);
            mr.addChild(entry);
        }

        return codec.encode(mr);
    }
}

module.exports = Builder;