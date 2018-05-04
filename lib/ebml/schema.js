let schema = {
    "ModificationRequest": {
        "tag": "1e544945",
        "type": "m",
        "description": ""
    },
    "Consistency": {
        "tag": "c0",
        "type": "u",
        "description": ""
    },
    "Signature": {
        "tag": "fe",
        "type": "b",
        "description": ""
    },
    "Entry": {
        "tag": "ee",
        "type": "m",
        "description": ""
    },
    "EntryHeader": {
        "context": ["Entry"],
        "tag": "e0",
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
        "tag": "81",
        "type": "8",
        "description": ""
    },
    "EntryType": {
        "context": ["EntryHeader"],
        "tag": "82",
        "type": "u",
        "description": ""
    },
    "EntryTimestamp": {
        "context": ["EntryHeader"],
        "tag": "83",
        "type": "d",
        "description": ""
    },
    "EntryVersion": {
        "context": ["EntryHeader"],
        "tag": "84",
        "type": "u",
        "description": ""
    },
    "EntryOldHash": {
        "context": ["EntryHeader"],
        "tag": "85",
        "type": "b",
        "description": ""
    },
    "EntryFldHash": {
        "context": ["EntryHeader"],
        "tag": "86",
        "type": "b",
        "description": ""
    },
    "EntryNetwork": {
        "context": ["EntryHeader"],
        "tag": "87",
        "type": "u",
        "description": ""
    },

    "FieldList": {
        "context": ["Entry"],
        "tag": "fa",
        "type": "m",
        "description": ""
    },
    "Field": {
        "context": ["FieldList"],
        "tag": "f0",
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
        "tag": "81",
        "type": "8",
        "description": ""
    },
    "FieldHash": {
        "context": ["Field"],
        "tag": "82",
        "type": "b",
        "description": ""
    },
    "FieldValue": {
        "context": ["Field"],
        "tag": "83",
        "type": "b",
        "description": ""
    },

    "ChequeList": {
        "context": ["Entry"],
        "tag": "ca",
        "type": "m",
        "description": ""
    },
    "Cheque": {
        "context": ["ChequeList"],
        "tag": "c0",
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
        "tag": "81",
        "type": "u",
        "description": ""
    },
    "ChequeTimestamp": {
        "context": ["Cheque"],
        "tag": "82",
        "type": "d",
        "description": ""
    },
    "ChequeAmount": {
        "context": ["Cheque"],
        "tag": "83",
        "type": "u",
        "description": ""
    },

    "AddressList": {
        "context": ["Entry"],
        "tag": "aa",
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

let root = {
    context: Object.keys(schema)
};

function Schema() {

    function createTree(elem) {
        if(typeof (elem.parents) !== 'undefined') {
            return; // parents have already been initialized
        }

        if(!elem.context) {
            elem.parents = null;
            return;
        }

        elem.parents = {};
        for(let i = 0; i < elem.context.length; ++i){
            let name = elem.context[i];
            let p = schema[name];
            if(!p)
                throw new Error('Tag ' + name + ' is referenced in tag ' + elem.name + ' but not found in scheme!');

            p.name = name;
            let ps = elem.parents[p.tag];
            if(!ps){
                ps = p;
            }else if(Array.isArray(ps)){
                ps.push(p);
            }else{
                ps = [ps, p];
            }
            elem.parents[p.tag] = ps;
            createTree(p);
        }
    }

    function findTag(tag, path) {
        let ps = root.parents[tag];
        if (!ps) {
            throw new Error('Tag is not in the scheme: ' + tag);
        }

        if(!Array.isArray(ps))
            ps = [ps];

        for(let pi = 0; pi < ps.length; ++pi) {
            let p = ps[pi];
            if (comparePath(p, path, 0))
                return p;
        }

        throw new Error('Tag path is not in the scheme: ' + tag + ' - ' + path.map(e => e.tag));

    }

    function comparePath(elem, path, pathStart) {
        if(!elem.parents)
            return true;
        if(!path || !path.length)
            return false;

        for (let idx = (pathStart || 0); idx < path.length; ++idx) {
            let i = path.length - idx - 1;
            let tag = path[i].tag;
            let ps = elem.parents[tag];
            if(!ps)
                continue;
            if(!Array.isArray(ps))
                ps = [ps];

            for(let pi = 0; pi < ps.length; ++pi) {
                let p = ps[pi];
                if (comparePath(p, path, idx + 1))
                    return true;
            }
        }

        return false;
    }

    debugger;

    createTree(root);

    this.findTag = findTag;
    this.findTagByName = function(name) {
        if(!schema[name])
            throw new Error('Tag named ' + name + ' not found in the schema!');
        return schema[name];
    }
}

module.exports = new Schema();
