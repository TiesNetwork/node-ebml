/* description: Parses TQL (TiesDB SQL) */
/* :tabSize=4:indentSize=4:noTabs=true: */
%lex

%options case-insensitive

%%

[/][*](.|\n)*?[*][/]                             /* skip comments */
--.*                                             /* skip comments */
\s+                                              /* skip whitespace */

'SELECT'                                         return 'SELECT'
'FROM'                                           return 'FROM'
'WHERE'                                          return 'WHERE'
'DISTINCT'                                       return 'DISTINCT'
ORDER\s+BY\b                                     return 'ORDER_BY'
'LIMIT'                                          return 'LIMIT'
','                                              return 'COMMA'
'::'                                             return 'TYPE_HINT'
'*'                                              return 'STAR'
'='                                              return 'CMP_EQUALS'
'>='                                             return 'CMP_GREATEROREQUAL'
'>'                                              return 'CMP_GREATER'
'<='                                             return 'CMP_LESSOREQUAL'
'<'                                              return 'CMP_LESS'
'('                                              return 'LPAREN'
')'                                              return 'RPAREN'
'AS'                                             return 'AS'
'CONTAINS'                                       return 'CONTAINS'
CONTAINS\s+KEY\b                                 return 'CONTAINS_KEY'
'IN'                                             return 'IN'
'AND'                                            return 'AND'
'ASC'                                            return 'ASC'
'DESC'                                           return 'DESC'
'CAST'                                           return 'CAST'
N?['](\\.|[^'])*[']                              return 'STRING'
[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}           return 'UUID'
'NULL'                                           return 'NULL'
(true|false)\b                                   return 'BOOLEAN'
-?[0-9]+\.[0-9]*(e-?[1-9]+)?                      return 'DECIMAL'
[a-z_][a-z0-9_]*                           		 return 'DIRECT_IDENTIFIER'
["](""|[^"])*["]                     			 return 'QUOTED_IDENTIFIER'
[1-9]\d*									     return 'POSITIVE_INTEGER'
-[1-9]\d*									     return 'NEGATIVE_INTEGER'
0						                         return 'ZERO'
'.'												 return 'DOT'
<<EOF>>                							 return 'EOF'
.                                                return 'INVALID'

/lex

%start tql

%% /* language grammar */

tql
    : selectClause EOF { return {nodeType: 'tql', value: $1}; } 
    ;

compare
	: CMP_EQUALS CMP_GREATER CMP_GREATEROREQUAL CMP_LESS CMP_LESSOREQUAL
	;

IDENTIFIER
	: DIRECT_IDENTIFIER { $$ = $1 }
	| QUOTED_IDENTIFIER { $$ = $1.replace(/^"|"$/g, '').replace(/""/g, '"'); }
	;

selectClause
    : SELECT optDistinctClause selectExprList 
      FROM tableExpr
      optWhereClause optOrderByClause optLimitClause
      { $$ = {nodeType: 'Select', distinct: $2, columns: $3, from: $5, where:$6, orderBy:$7, limit:$8}; }
    ;

optDistinctClause
    : { $$ = false; }
    | DISTINCT { $$ = true; }
    ;

optWhereClause
    : { $$ = null; }
    | WHERE expressionCompareList { $$ = $2; }
    ;

optOrderByClause
    : { $$ = null; }
    | ORDER_BY orderByList { $$ = $2; }
    ;

orderByList
    : orderByList COMMA orderByListItem { $$ = $1; $1.push($3); }
    | orderByListItem { $$ = [$1]; }
    ;

orderByListItem
    : IDENTIFIER optOrderByOrder { $$ = {expression:$1, orderByOrder: $2}; }
    ;
    
optOrderByOrder
    : { $$ = ''; }
    | ASC { $$ = $1; }
    | DESC { $$ = $1; }
    ;

optLimitClause
    : { $$ = null; }
    | LIMIT POSITIVE_INTEGER { $$ = $2; }
    ;

selectExprList
    : STAR { $$ = $1; }
    | selectExprListX
    ;

selectExprListX
    : selectExpr { $$ = [$1]; } 
    | selectExprListX COMMA selectExpr { $$ = $1; $1.push($3); }
    ;

qualified_identifier
	: IDENTIFIER DOT IDENTIFIER { $$ = {nodeType: 'QualifiedIdentifier', parent: $1, value: $3}; }
	;

selectExpr
    : expressionUnary optColumnExprAlias { $$ = {nodeType: 'Column', value:$1, alias:$2}; }
    ;

optColumnExprAlias
    : { $$ = null; }
    | IDENTIFIER { $$ = {value: $1 }; }
    | AS IDENTIFIER { $$ = {value: $2, includeAs: 1}; }
    ;

tableExpr
    : IDENTIFIER
    | qualified_identifier
    ;

expressionUnary
    : expressionFunction
    | LPAREN expression RPAREN
    | specialConstruct
    | IDENTIFIER
    | literal
    ;

expressionCompare
	: IDENTIFIER compare expressionUnary { $$ = {'nodeType': 'OPERATOR_COMPARE', 'name': $2, 'left': $1, 'right': $3} }
    | IDENTIFIER IN LPAREN expressionUnaryList RPAREN  { $$ = {nodeType: 'OPERATOR_IN', left:$1, right:$4}; }
	;

expressionFunction
	: IDENTIFIER LPAREN expressionUnaryList RPAREN { $$ = {'nodeType': 'FUNCTION', 'name': $1, 'args': $3} }
	;

expressionUnaryList
	: expressionUnary { $$ = [$1] }
	| expressionUnaryList COMMA expressionUnary  { $$ = $1; $1.push($3) }
	;

expressionCompareList
	: expressionCompare { $$ = [$1] }
	| expressionCompareList AND expressionCompare  { $$ = $1; $1.push($3) }
	;

compare
    : CMP_EQUALS
    | CMP_NOTEQUALS
    | CMP_NOTEQUALS_BASIC
    | CMP_GREATER
    | CMP_GREATEROREQUAL
    | CMP_LESS
    | CMP_LESSOREQUAL
    ;

specialConstruct
    : CAST LPAREN expressionUnary AS dataType RPAREN { $$ = {nodeType: 'Cast', expression:$3, dataType:$5}; }
    ;

dataType
    : IDENTIFIER optDataTypeLength { $$ = {name: $1, len: $2}; }
    ;

optDataTypeLength
    : { $$ = null; }
    | LPAREN NUMERIC RPAREN { $$ = $2; }
    ;

numeric
	: integer { $$ = {nodeType: 'INTEGER', value: $1 } }
	| DECIMAL { $$ = {nodeType: 'DECIMAL', value: $1 } }
	;

integer
	: ZERO
	| POSITIVE_INTEGER
	| NEGATIVE_INTEGER
	;

literal
    : stringLiteral 
    | numeric
    | BOOLEAN { $$ = {nodeType: 'BOOLEAN', value:$1}; }
    | NULL { $$ = {nodeType: 'NULL', value:null}; }
    | UUID { $$ = {nodeType: 'UUID', value:$1}; }
    ;

stringValue
	: STRING { $$ = {nodeType: 'STRING', value:$1.replace(/^'|'$/g, '').replace(/\\(.)/g, '$1')}; }
	;

stringLiteral
	: stringValue
	| stringValue TYPE_HINT IDENTIFIER { $$ = $1; $1.type = $3; }
	;




