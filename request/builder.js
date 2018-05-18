const Record = require('./record');
const Field = require('./field');
const codec = require('./codec');
const Tag = codec.Tag;
const C = require('./constants')

class Builder {
    constructor () {
        this.consistency = C.Consistency.QUORUM;
        this.records = [];
    }

    addRecord(record) {
        this.records.push(record);
    }

    build() {
        let mr = new Tag('ModificationRequest');
        mr.addChild(new Tag({name: 'Consistency', value: this.consistency}));

        for(let record of this.records) {
            let entry = record.getEntry(pk);
            mr.addChild(entry);
        }

        return codec.encode(mr);
    }
}