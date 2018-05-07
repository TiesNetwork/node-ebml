let schema = {
    "ModificationRequest": {
        "tag": "1e544945",
        "type": "m",
        "description": ""
    },
    "Consistency": {
        "context": ["ModificationRequest"],
        "tag": "c0",
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
        "type": "s",
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
        "context": ["Cheque"],
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
            let modifier = '';
            let p = schema[name];
            if(!p) {
                modifier = name.substr(0, 1);
                if(['^'].indexOf(modifier) >= 0) {
                    name = name.substr(1);
                    p = schema[name];
                }
            }
            if(!p)
                throw new Error('Tag ' + name + ' is referenced in tag ' + elem.name + ' but not found in scheme!');

            if(elem.parents[name])
                throw new Error('Tag ' + elem.name + ' has multiple references to parent ' + name);

            let rel = {modifier: modifier || undefined, parent: p};
            elem.parents[name] = rel;
            elem.hasFarParents = elem.hasFarParents || modifier === '^';

            createTree(p);
        }
    }

    function findTag(tag, path) {
        let ps = root.tagIndex[tag];
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

        throw new Error('Tag path is not in the scheme: ' + tag + ' - ' + path.reverse().map(e => e.name));

    }

    function comparePath(elem, path, pathStart) {
        if(!elem.parents)
            return true;
        pathStart = pathStart || 0;

        if(!path || pathStart >= (path.length || 0))
            return false;

        for (let idx = pathStart; idx < path.length; ++idx) {
            let i = path.length - idx - 1;
            let name = path[i].name;
            let rel = elem.parents[name];
            if(!rel){
                if(elem.hasFarParents){
                    continue; //Need to check far parents
                }else {
                    return false;
                }
            }

            if(idx > pathStart && rel.modifier !== '^')
                continue;

            if (comparePath(rel.parent, path, idx + 1))
                return true;
        }

        return false;
    }

    function indexTags() {
        let elem = root;
        elem.tagIndex = {};
        for(let i = 0; i < elem.context.length; ++i){
            let name = elem.context[i];
            let modifier = '';
            let p = schema[name];
            if(!p) {
                modifier = substr(name, 0, 1);
                if(['^'].indexOf(modifier) >= 0) {
                    name = substr(name, 1);
                    p = schema[name];
                }
            }
            if(!p)
                throw new Error('Tag ' + name + ' is referenced in tag ' + elem.name + ' but not found in scheme!');

            p.name = name;
            let ps = elem.tagIndex[p.tag];
            if(!ps){
                ps = p;
            }else if(Array.isArray(ps)){
                ps.push(p);
            }else{
                ps = [ps, p];
            }
            elem.tagIndex[p.tag] = ps;
        }
    }


    debugger;

    indexTags();
    createTree(root);

    this.findTag = findTag;
    this.findTagByName = function(name) {
        if(!schema[name])
            throw new Error('Tag named ' + name + ' not found in the schema!');
        return schema[name];
    }
}

module.exports = new Schema();
