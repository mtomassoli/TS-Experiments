// This file contains the code for the section
//     An Extensible Expression Evaluator
// in the file 
//     Writing Full-Fledged Type Programs in Typescript.md

/// <reference path="tests.ts" />

type SAMPLE_OBJ = {
    rec: 'rec';
    car: 'a car';
    tree: 'a tree';
    Tim: 'ok';
    whiteList: ['Tim', 'John', 'Luke', 'Luca', 'Stefano', 'Doe', 'Smith'];
    ifStartsWith: ['name', 'surname'];
    name1: 'Tim';
    name2: 'John';
    name3: 'Luca';
    name4: 'Luke';
    name5: 'Stefano';
    // name_invalid: 'Stephen';
    surname1: 'Doe';
    surname2: 'Smith';
    // surname_invalid: 'Rossi';
};

type SAMPLE_TEST = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                call('StartsWith', v'start', v'key')
            }) reduce 'any'
        ) else call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;

type SAMPLE_TEST2 = EvalExpr<SAMPLE_OBJ, `
    bool 'rec'
`>;

type SAMPLE_TEST3 = EvalExpr<SAMPLE_OBJ, `
    ('car' && 'Tim' && 'tree') || 'name5'
`>;

type SAMPLE_TEST4 = EvalExpr<SAMPLE_OBJ, `
    'truck' || '"Truck" not present'
`>;

type EvalBoolExpr<Obj, Expr> = EvalExpr<Obj, `bool (${Expr & string})`>;

type SAMPLE_TEST5 = EvalBoolExpr<SAMPLE_OBJ, `
    ('car' && 'Tim' && 'tree') || 'name5'
`>;

interface Funcs3<T1, T2, T3> {
    // T1 = {'op', 'mem'}
    INFIX2__and__PARSE: ['INFIX2__&&__', _EVAL_Skip<T2>, _EVAL_Skip<T3>];
    INFIX2__and__: 0;           // does nothing

    // T1 = {'op', 'mem'}
    INFIX2__or__PARSE: ['INFIX2__||__', _EVAL_Skip<T2>, _EVAL_Skip<T3>];
    INFIX2__or__: 0;            // does nothing
}

type SAMPLE_TEST6 = EvalExpr<SAMPLE_OBJ, `
    ('car' and 'Tim' and 'tree') or 'name5'
`>;

type SAMPLE_TEST7 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS'
`>;

interface Funcs1<T> {
    WrapInUnderscores: `_${T & string}_`;
}

type SAMPLE_TEST8 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('x' => {
        call('WrapInUnderscores', 
            call('WrapInUnderscores', v'x')
        )
    })
`>;

interface Funcs3<T1, T2, T3> {
    INFIX2__startsWith__: T2 extends `${T3 & string}${any}` ? true : false;
}

type SAMPLE_TEST9 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' filter ('x' => {
        v'x' startsWith 'name'
    })
`>;

// true
type SAMPLE_TEST10 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('x' => {
        v'x' startsWith 'name'
    }) reduce 'any'
`>;

// false
type SAMPLE_TEST11 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('x' => {
        v'x' startsWith 'name'
    }) reduce 'all'
`>;

interface Funcs2<T1, T2> {
    StartsWithThis: T2 extends `${T1 & string}${any}` ? true : false;
}

type SAMPLE_TEST12 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('StartsWithThis' bind 'name')
            reduce 'any'
`>;

// [
//    "LHS operand not supported by `bind`. Operands: ",
//    "StarXXXXXtsWithThis", "name"
// ]
type SAMPLE_TEST13 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('StarXXXXXtsWithThis' bind 'name')
            reduce 'any'
`>;
