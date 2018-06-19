let _the_schema = {
    "ModificationRequest": {
        "tag": "1e544945",
        "type": "m",
        "description": "INSERT/UPDATE query"
    },
    "ModificationResponse": {
        "tag": "1f544945",
        "type": "m",
        "description": "Response to ModificationRequest"
    },
    "RecollectionRequest": {
        "tag": "11544945",
        "type": "m",
        "description": "SELECT query"
    },
    "RecollectionResponse": {
        "tag": "12544945",
        "type": "m",
        "description": "Response to RecollectionRequest"
    },
    "RecollectionResult": {
        "context": ["RecollectionResponse"],
        "tag": "a1",
        "type": "m",
        "description": ""
    },
    "RecollectionEntry": {
        "context": ["RecollectionResult"],
        "tag": "e1",
        "type": "m",
        "description": ""
    },
    "RecollectionCompute": {
        "context": ["RecollectionResult"],
        "tag": "c1",
        "type": "m",
        "description": ""
    },
    "ComputeField": {
        "context": ["RecollectionCompute"],
        "tag": "c1",
        "type": "m",
        "description": ""
    },
    "ModificationResult": {
        "context": ["ModificationResponse"],
        "tag": "e1",
        "type": "m",
        "description": ""
    },
    "ModificationError": {
        "context": ["ModificationResponse"],
        "tag": "ef",
        "type": "m",
        "description": ""
    },
    "RecollectionTablespaceName": {
        "context": ["RecollectionRequest"],
        "tag": "80",
        "type": "8",
        "description": ""
    },
    "RecollectionTableName": {
        "context": ["RecollectionRequest"],
        "tag": "82",
        "type": "8",
        "description": ""
    },
    "RetrieveList": {
        "context": ["RecollectionRequest"],
        "tag": "83",
        "type": "m",
        "description": ""
    },
    "RetField": {
        "context": ["RetrieveList"],
        "tag": "d0",
        "type": "8",
        "description": ""
    },
    "RetCompute": {
        "context": ["RetrieveList"],
        "tag": "c1",
        "type": "m",
        "description": ""
    },
    "RetComputeAlias": {
        "context": ["RetCompute"],
        "tag": "a0",
        "type": "8",
        "description": ""
    },
    "RetComputeType": {
        "context": ["RetCompute"],
        "tag": "a2",
        "type": "s",
        "description": ""
    },
    "FunctionName": {
        "context": ["RetCompute", "FunArgumentFunction", "Filter"],
        "tag": "f0",
        "type": "8",
        "description": ""
    },
    "FunArgumentFunction": {
        "context": ["RetCompute", "FunArgumentFunction", "Filter"],
        "tag": "f3",
        "type": "m",
        "description": ""
    },
    "FunArgumentReference": {
        "context": ["RetCompute", "FunArgumentFunction", "Filter"],
        "tag": "f2",
        "type": "8",
        "description": ""
    },
    "FunArgumentStatic": {
        "context": ["RetCompute", "FunArgumentFunction", "Filter"],
        "tag": "f1",
        "type": "m",
        "description": ""
    },
    "ArgStaticType": {
        "context": ["FunArgumentStatic"],
        "tag": "80",
        "type": "s",
        "description": ""
    },
    "ArgStaticValue": {
        "context": ["FunArgumentStatic"],
        "tag": "82",
        "type": "b",
        "description": ""
    },
    "FilterList": {
        "context": ["RecollectionRequest"],
        "tag": "a3",
        "type": "m",
        "description": ""
    },
    "Filter": {
        "context": ["FilterList"],
        "tag": "f1",
        "type": "m",
        "description": ""
    },
    "FilterField": {
        "context": ["Filter"],
        "tag": "e0",
        "type": "8",
        "description": ""
    },

    "EntryHash": {
        "context": ["ModificationResult", "ModificationError"],
        "tag": "80",
        "type": "b",
        "description": ""
    },
    "Error": {
        "tag": "7fff",
        "type": "m",
        "description": ""
    },
    "ErrorMessage": {
        "context": ["Error", "ModificationError"],
        "tag": "e0",
        "type": "8",
        "description": ""
    },
    "Test": {
        "context": ["ModificationRequest"],
        "tag": "86",
        "type": "i",
        "description": ""
    },
    "Consistency": {
        "context": ["ModificationRequest","RecollectionRequest"],
        "tag": "ee",
        "type": "u",
        "description": ""
    },
    "MessageId": {
        "context": ["ModificationRequest","ModificationResponse","RecollectionRequest","RecollectionResponse","Error"],
        "tag": "ec",
        "type": "u",
        "description": "Request ID unique for a given connection"
    },
    "Signature": {
        "context": ["^ModificationRequest"],
        "tag": "fe",
        "type": "b",
        "description": ""
    },
    "Signer": {
        "context": ["^ModificationRequest"],
        "tag": "fc",
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
        "context": ["Entry", "RecollectionEntry"],
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
        "context": ["Entry", "RecollectionEntry"],
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
        "context": ["Field", "ComputeField"],
        "tag": "80",
        "type": "8",
        "description": ""
    },
    "FieldType": {
        "context": ["Field", "ComputeField"],
        "tag": "82",
        "type": "s",
        "description": ""
    },
    "FieldHash": {
        "context": ["Field", "ComputeField"],
        "tag": "84",
        "type": "b",
        "description": ""
    },
    "FieldValue": {
        "context": ["Field", "ComputeField"],
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
    },

};

let Schema = require('../lib/ebml/schema');
let schema = new Schema(_the_schema);

module.exports = schema;
