/* You should use this class to provide your own schema for your ebml
   let schema = new ebml.Schema(schemaTagInfos);
   let decoder = new ebml.Decoder(null, schema);
 */

/**
 * Tag infos
 * @type TagInfo
 * @private
 */

/*
type is the data type.
    u: unsigned integer. Some of these are UIDs, coded as 128-bit numbers.
    i: signed integer.
    f: IEEE-754 floating point number.
    s: printable ASCII text string.
    8: printable utf-8 Unicode text string.
    d: a 64-bit signed timestamp, in nanoseconds after (or before) 2001-01-01T00:00UTC.
    b: binary data, otherwise uninterpreted.
 */
let _the_schema = {
    "ExampleTag": { //Free tag. Can be root or child of any tag
        "tag": "1e544945",
        "type": "m",
        "description": ""
    },
    "ExampleChildTag": { //Direct descendant of ModificationRequest tag
        "context": ["ModificationRequest"], //Direct or indirect parents of these tags
        "tag": "ee",
        "type": "u",
        "description": ""
    },
    "ExampleFreeTag": { //Indirect descendant of ModificationRequest tag
        "context": ["^ModificationRequest"], //Direct or indirect parents of these tags
        "tag": "fe",
        "type": "b",
        "description": ""
    },
};

/**
 * Schema interface:
 *      findTag(string hexLowercaseTag, TagInfo[] stack) - returns info about tag provided that it has parents - stack
 *      findTagByName(string name) - returns info about tag by its name
 *
 * Supports reusing of tag values under different parent hierarchy
 *
 * @param schema - dictionary of TagInfos
 * @constructor
 */
function Schema(schema) {
    if(!schema)
        schema = _the_schema;

    let root = {
        context: Object.keys(schema)
    };

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
        if(elem.tagIndex)
            return;

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


    indexTags();
    createTree(root);

    this.findTag = findTag;
    this.findTagByName = function(name) {
        if(!schema[name])
            throw new Error('Tag named ' + name + ' not found in the schema!');
        return schema[name];
    }
}

module.exports = Schema;
