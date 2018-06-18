const sqlParser = require('./sql.js');
const codec = require('../request/codec');
const Tag = codec.Tag;
const Field = require('../request/field');

function compile(sql){
    let ast;
    try {
        ast = sqlParser.parse(sql);
    }catch(e){
        if(e.JisonParserError)
            throw new Error(e.hash.errStr);
        throw e;
    }

    return ast;
}

function makeRequest(requestTag, ast, defaultTablespace) {
    if(ast.nodeType !== 'tql' || ast.value.nodeType !== 'SELECT')
        throw new Error('Invalid request');

    //Set FROM
    let from = ast.value.from;
    if(typeof from === 'string'){
        if(!defaultTablespace)
            throw new Error('No tablespace specified and no default tablespace set');
        requestTag.addChild("RecollectionTablespaceName", defaultTablespace);
        requestTag.addChild("RecollectionTableName", from);
    }else if(from.nodeType === 'QualifiedIdentifier') {
        requestTag.addChild("RecollectionTablespaceName", from.parent);
        requestTag.addChild("RecollectionTableName", from.value);
    }

    //Set COLUMNS to retrieve
    let columns = ast.value.columns;

    if(columns !== '*') {
        let columnTags = new Tag("RetrieveList");
        for (let col of columns) {
            if (typeof(col.value) === 'string') {
                //Column identifier
                columnTags.addChild("RetField", col.value);
            } else {
                //Function
                let tag = new Tag("RetCompute");
                if(col.alias)
                    tag.addChild("RetComputeAlias",col.alias);
                if(col.type)
                    tag.addChild("RetComputeType", col.type);
                makeFunction(tag, col.value);
                columnTags.addChild(tag);
            }
        }
        requestTag.addChild(columnTags);
    }

    //Set WHERE (Filters)
    let where = ast.value.where;
    if(where){
        let filters = new Tag("FilterList");
        for(let op of where){
            let filter = makeFilter(op);
            filters.addChild(filter);
        }
        requestTag.addChild(filters);
    }
}

function makeFilter(op) {
    if(typeof op.left !== 'string')
        throw new Error('Operator lvalue should be field identifier!');

    let filter = new Tag("Filter");
    filter.addChild("FilterField", op.left);
    switch(op.nodeType) {
        case 'OPERATOR_IN':
            filter.addChild("FunctionName", 'IN');
            for(let arg of op.right) {
                makeArgument(filter, arg);
            }
            break;
        case 'OPERATOR_COMPARE':
            filter.addChild("FunctionName", op.name);
            filter.makeArgument(op.right);
            break;
        default:
            throw new Error('Unknown operator: ' + op.nodeType);
    }

    return filter;
}

function makeFunction(tag, func) {
    if(func.nodeType === 'CAST') {
        tag.addChild("FunctionName", 'CAST');
        makeArgument(tag, func.expression);
        makeArgument(tag, {nodeType: 'STRING', value: func.dataType});
    }else if(func.nodeType === 'FUNCTION') {
        tag.addChild("FunctionName",func.name);
        if(func.args) for(let arg of func.args) {
            makeArgument(tag, arg);
        }
    }else{
        throw new Error('Unknown function ' + func.nodeType);
    }
}

function makeArgument(tag, expression) {
    if(typeof(expression) === 'string') {
        //Identifier
        tag.addChild("FunArgumentReference", expression);
    }else if(expression.nodeType === 'FUNCTION' || expression.nodeType === 'CAST') {
        let _tag = new Tag("FunArgumentFunction");
        makeFunction(_tag, expression);
        tag.addChild(_tag);
    }else if(['INTEGER', 'STRING', 'UUID', 'DECIMAL', 'BOOLEAN']) {
        let _tag = new Tag("FunArgumentStatic");
        fillStatic(_tag, expression);
        tag.addChild(_tag);
    }else {
        throw new Error('Unknown function argument: ' + expression.nodeType);
    }
}

function convertTypeToUUID(type, value){
    let buf = Field.encodeValue(type, value);
    if(buf.length > 16)
        buf = buf.slice(-16);
    if(buf.length < 16)
        buf = Buffer.concat([Buffer.alloc(16-buf.length, 0), buf]);
    return buf;

}

function fillStatic(tag, expression) {
    let type = expression.type && expression.type.toLowerCase();
    let buf;
    switch(expression.nodeType) {
        case 'INTEGER':
            if(!type)
                type = 'integer';
            if(['integer', 'long', 'bigint', 'float', 'double', 'decimal', 'time', 'duration', 'ascii', 'string', 'boolean'].indexOf(type) >= 0) {
                buf = Field.encodeValue(type, expression.value);
                break;
            }
            if(['binary'].indexOf(type) >= 0) {
                buf = Field.encodeValue('bigint', expression.value);
                break;
            }
            if(['uuid'].indexOf(type) >= 0) {
                buf = convertTypeToUUID('bigint', expression.value);
                break;
            }
            throw new Error('Can not convert INTEGER ' + expression.value + ' to type ' + type);
        case 'DECIMAL':
            if(!type)
                type = 'decimal';
            if(['integer', 'long', 'bigint', 'float', 'double', 'decimal', 'time', 'duration', 'ascii', 'string', 'boolean'].indexOf(type) >= 0) {
                buf = Field.encodeValue(type, expression.value);
                break;
            }
            if(['binary'].indexOf(type) >= 0) {
                buf = Field.encodeValue('decimal', expression.value);
                break;
            }
            if(['uuid'].indexOf(type) >= 0) {
                buf = convertTypeToUUID('decimal', expression.value);
                break;
            }
            throw new Error('Can not convert DECIMAL ' + expression.value + ' to type ' + type);
        case 'UUID':
            if(!type)
                type = 'uuid';
            if(['binary', 'uuid'].indexOf(type) >= 0) {
                buf = convertTypeToUUID('uuid', expression.value);
                break;
            }
            if(['ascii', 'string'].indexOf(type) >= 0) {
                buf = Field.encodeValue(type, expression.value);
            }
            throw new Error('Can not convert UUID ' + expression.value + ' to type ' + type);
        case 'BOOLEAN':
            if(!type)
                type = 'boolean';
            if(['boolean', 'string', 'ascii'].indexOf(type) >= 0) {
                buf = Field.encodeValue(type, expression.value);
                break;
            }
            if(['integer', 'long', 'bigint', 'float', 'double', 'decimal'].indexOf(type) >= 0) {
                buf = Field.encodeValue('boolean', expression.value);
                buf = Field.encodeValue(type, buf[0] || 0);
                break;
            }
            if(['binary'].indexOf(type) >= 0) {
                buf = Field.encodeValue('boolean', expression.value);
                break;
            }
            throw new Error('Can not convert BOOLEAN ' + expression.value + ' to type ' + type);
        case 'STRING':
            if(!type)
                type = 'string';
            if(type === 'binary') {
                buf = Buffer.from(expression.value, 'hex');
                break;
            }
            if(type === 'time') {
                let time = Date.parse(expression.value);
                if(time === NaN)
                    throw new Error('Can not parse ISO8601 TIME from ' + expression.value);
                buf = Field.encodeValue(type, time);
                break;
            }
            buf = Field.encodeValue(type, expression.value);
            break;
        default:
            throw new Error('Unknown static type: ' + expression.nodeType);
    }

    tag.addChild("ArgStaticType", type);
    tag.addChild("ArgStaticValue", buf);
}

module.exports = {
    compile: compile,
    makeRequest: makeRequest
};