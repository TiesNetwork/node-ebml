let _the_schema = {
    "ModificationRequest": {
        "tag": "1e544945",
        "type": "m",
        "description": ""
    },
    "Consistency": {
        "context": ["ModificationRequest"],
        "tag": "ee",
        "type": "u",
        "description": ""
    },
    "Signature": {
        "context": ["^ModificationRequest"],
        "tag": "fe",
        "type": "b",
        "description": ""
    },
    "Entry": {
        "context": ["ModificationRequest"],
        "tag": "e1",
        "type": "m",
        "description": ""
    },
    "EntryHeader": {
        "context": ["Entry"],
        "tag": "e1",
        "type": "m",
        "description": ""
    },
    "EntryTablespaceName": {
        "context": ["EntryHeader"],
        "tag": "80",
        "type": "8",
        "description": ""
    },
    "EntryTableName": {
        "context": ["EntryHeader"],
        "tag": "82",
        "type": "8",
        "description": ""
    },
    "EntryType": {
        "context": ["EntryHeader"],
        "tag": "84",
        "type": "u",
        "description": ""
    },
    "EntryTimestamp": {
        "context": ["EntryHeader"],
        "tag": "86",
        "type": "d",
        "description": ""
    },
    "EntryVersion": {
        "context": ["EntryHeader"],
        "tag": "88",
        "type": "u",
        "description": ""
    },
    "EntryOldHash": {
        "context": ["EntryHeader"],
        "tag": "8a",
        "type": "b",
        "description": ""
    },
    "EntryFldHash": {
        "context": ["EntryHeader"],
        "tag": "8c",
        "type": "b",
        "description": ""
    },
    "EntryNetwork": {
        "context": ["EntryHeader"],
        "tag": "8e",
        "type": "u",
        "description": ""
    },

    "FieldList": {
        "context": ["Entry"],
        "tag": "d1",
        "type": "m",
        "description": ""
    },
    "Field": {
        "context": ["FieldList"],
        "tag": "d1",
        "type": "m",
        "description": ""
    },
    "FieldName": {
        "context": ["Field"],
        "tag": "80",
        "type": "8",
        "description": ""
    },
    "FieldType": {
        "context": ["Field"],
        "tag": "82",
        "type": "s",
        "description": ""
    },
    "FieldHash": {
        "context": ["Field"],
        "tag": "84",
        "type": "b",
        "description": ""
    },
    "FieldValue": {
        "context": ["Field"],
        "tag": "86",
        "type": "b",
        "description": ""
    },

    "ChequeList": {
        "context": ["Entry"],
        "tag": "c1",
        "type": "m",
        "description": ""
    },
    "Cheque": {
        "context": ["ChequeList"],
        "tag": "c1",
        "type": "m",
        "description": ""
    },
    "ChequeRange": {
        "context": ["Cheque"],
        "tag": "80",
        "type": "b", // uuid
        "description": ""
    },
    "ChequeNumber": {
        "context": ["Cheque"],
        "tag": "82",
        "type": "u",
        "description": ""
    },
    "ChequeTimestamp": {
        "context": ["Cheque"],
        "tag": "84",
        "type": "d",
        "description": ""
    },
    "ChequeAmount": {
        "context": ["Cheque"],
        "tag": "86",
        "type": "u",
        "description": ""
    },

    "AddressList": {
        "context": ["Cheque"],
        "tag": "a1",
        "type": "m",
        "description": ""
    },
    "Address": {
        "context": ["AddressList"],
        "tag": "a0",
        "type": "b",
        "description": ""
    }
};

let Schema = require('../lib/ebml/schema');
let schema = new Schema(_the_schema);

module.exports = schema;
