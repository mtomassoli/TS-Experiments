/// <reference path="eval_new.ts" />
/// <reference path="user_defs.ts" />
/// <reference path="misc.ts" />

type MANY_NUMBERS = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
    70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
    80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
    90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
];

type USER_OBJ1 = {
    [K in MANY_NUMBERS[number] as `key${K & number}`]: `val${K}`;
};

interface Funcs1<T> {
    Add_a: `${T & string}a`;
}

type TEST_UMAP_FREE1_EXPR = `
    $'KEYS' map 'Add_a'
`;
type TEST_UMAP_SUBEXPR_EXPR = `
    $'KEYS' map ('x' => {
        'Add_a' apply v'x'
    })
`;

type TEST_UMAP_EVAL = AssertTrue<EQU<
    EvalExpr<USER_OBJ1, TEST_UMAP_FREE1_EXPR>,
    EvalExpr<USER_OBJ1, TEST_UMAP_SUBEXPR_EXPR>
>>;

type TEST_UFILTER_FREE1_EXPR = `
    $'KEYS' filter ('StartsWith' bind 'key3')
`;
type TEST_UFILTER_SUBEXPR_EXPR = `
    $'KEYS' filter ('x' => {
        'StartsWith' bind 'key3' apply v'x'
    })
`;

type TEST_UFILTER_EVAL = AssertTrue<EQU<
    EvalExpr<USER_OBJ1, TEST_UFILTER_FREE1_EXPR>,
    EvalExpr<USER_OBJ1, TEST_UFILTER_SUBEXPR_EXPR>
>>;

type BIGGER_OBJ = {
    rec: 'rec';
    car: 'a car';
    tree: 'a tree';
    Tim: 'ok';
    whiteList: ['Tim', 'John', 'Luke', 'Luca', 'Stefano', 'Doe'];
    ifStartsWith: ['name', 'surname'];
    name1: 'Tim';
    name2: 'John';
    name3: 'Luca';
    name4: 'Luke';
    name5: 'Tim';
    name6: 'John';
    name7: 'Luca';
    name8: 'Luke';
    name9: 'Tim';
    name10: 'John';
    name11: 'Luca';
    name12: 'Luke';
    name13: 'Tim';
    name14: 'John';
    name15: 'Luca';
    name16: 'Luke';
    name17: 'Tim';
    name18: 'John';
    name19: 'Luca';
    name20: 'Luke';
    name21: 'Tim';
    name22: 'John';
    name23: 'Luca';
    name24: 'Luke';
    name25: 'Stefano';
    // name_invalid: 'Stephen';
    surname1: 'Doe';
    // surname_invalid: 'Rossi';
} & {
    [K in MANY_NUMBERS[number] as `key${K & number}`]: 0
};

// -------------- Commented because SLOW! Uncomment to test. --------------
// type NumElements = UnionToList<keyof BIGGER_OBJ>['length'];      // 132
//
// NOTES:
// - TEST_Complex_1 and _2 each require more than 4096 cycles.
// - BIGGER_OBJ has NumElements elements (132 at the moment).
// - The number of cycles is O(`NumElements`).
//
// type TEST_Complex_1 = EvalExpr<BIGGER_OBJ,`
//     $'KEYS' filter ('key' => {
//         *'ifStartsWith' map ('x' => {
//             'StartsWith' bind v'x' apply v'key'
//         }) reduce 'any'
//     }) map ('x' => {
//         *v'x' in *'whiteList'
//     }) reduce 'all'
// `>;
//
// type TEST_Complex_2 = EvalExpr<BIGGER_OBJ, `
//     $'KEYS' filter ('key' => {
//         if 'ifStartsWith' then (
//             *'ifStartsWith' map ('start' => {
//                 'StartsWith' bind v'start' apply v'key'
//             }) reduce 'any'
//         ) else (
//             'StartsWith' bind 'name' apply v'key'
//         )
//     }) map ('x' => {
//         *v'x' in *'whiteList'
//     }) reduce 'all'
// `>;
//-------------------------------------------------------------------------

type USER_OBJ2 = {
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

// USER_OBJ2 without `ifStartsWith`.
type USER_OBJ2_NOSTART = {
    rec: 'rec';
    car: 'a car';
    tree: 'a tree';
    Tim: 'ok';
    whiteList: ['Tim', 'John', 'Luke', 'Luca', 'Stefano', 'Doe', 'Smith'];
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

type TEST_Complex_3 = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                'StartsWith' bind v'start' apply v'key'
            }) reduce 'any'
        ) else (
            'StartsWith' bind 'name' apply v'key'
        )
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;

class ListOfArgs<T> {#a?: T};

interface Funcs3<T1, T2, T3> {
    // T1 = CONTEXT
    'INFIX2__,__':
        T2 extends ListOfArgs<infer AS> ?
            //@ts-expect-error
            ListOfArgs<[...AS, T3]> :
        ListOfArgs<[T2, T3]>;
}

type TEST_COMMA_1 = EvalExpr<USER_OBJ2, `
    'a', 'b', 'c'
`>;

interface Funcs3<T1, T2, T3> {
    // T1 = CONTEXT
    'INFIX2__callWith__':
        T3 extends NotSubType<infer A, ListOfArgs<any>> ?
            T2 extends FREE1 ? APPLY1<T2, A> :
            ERROR<"callWith: 1st argument is not a FREE1"> :
        T3 extends ListOfArgs<[infer A1, infer A2]> ?
            T2 extends FREE2 ? APPLY2<T2, A1, A2> :
            ERROR<"callWith: 1st argument is not a FREE2"> :
        T3 extends ListOfArgs<[infer A1, infer A2, infer A3]> ?
            T2 extends FREE3 ? APPLY3<T2, A1, A2, A3> :
            ERROR<"callWith: 1st argument is not a FREE3"> :
        ERROR<"callWith: too many arguments?">;
}

type TEST_CALL_1 = EvalExpr<USER_OBJ2, `
    'StartsWith' callWith ('name', 'name123')
`>;

type TEST_Complex_3b = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                'StartsWith' callWith (v'start', v'key')
            }) reduce 'any'
        ) else (
            'StartsWith' callWith ('name', v'key')
        )
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;

type Call_FREE_Error<Args extends any[]> =
    ERROR<[
        `call: the first element is not a FREE${DecCount[Args['length']]}`,
        Args
    ]>;

interface Funcs2<T1, T2> {
    // T1 = CONTEXT
    'PREFIX1__call__':
        T2 extends ListOfArgs<[infer F, infer A]> ?
            F extends FREE1 ? APPLY1<F, A> :
            Call_FREE_Error<[F, A]> :
        T2 extends ListOfArgs<[infer F, infer A1, infer A2]> ?
            F extends FREE2 ? APPLY2<F, A1, A2> :
            Call_FREE_Error<[F, A1, A2]> :
        T2 extends ListOfArgs<[infer F, infer A1, infer A2, infer A3]> ?
            F extends FREE3 ? APPLY3<F, A1, A2, A3> :
            Call_FREE_Error<[F, A1, A2, A3]> :
        ERROR<"call: something is wrong">;
}

type TEST_Complex_3c = EvalExpr<USER_OBJ2_NOSTART, `
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

// Test EVAL Error Message
// [
//    "call: the first element is not a FREE2",
//    ["StaXXXXXXXrtsWith", "name", "ifStartsWith"]
// ]
type TEST_Complex_3EE = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                call('StaXXXXXXXrtsWith', v'start', v'key')
            }) reduce 'any'
        ) else call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;

// Test TOKEN Error Message
// msg: "Can't tokenize the remaining expression"
// expr: "callXXXXXX('StartsWith', v'start', v'key')..."
type TEST_Complex_3PE = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                callXXXXXX('StartsWith', v'start', v'key')
            }) reduce 'any'
        ) else call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;

interface Funcs3<T1, T2, T3> {
    // T1 = {'op', 'mem'}
    'INFIX2__:__PARSE':
        T1 extends {op: string; mem: any[]} ?
            T2 extends _EVAL_OperationPtr<infer OPN_PTR> ?
                ReadFromParseMem<T1['mem'], OPN_PTR> extends [
                    'INFIX2__?__', infer A1, infer A2
                ] ?
                    // The 3 arguments are A1, A2, T3.    
                    ['PREFIX3__if__', A1, _EVAL_Skip<A2>, _EVAL_Skip<T3>] :
                ERROR<'\`?\` branch expected'> :
            ERROR<'\`?\` branch expected'> :
        never;

    // If '?' wasn't replaced by the 'if then else', then there was an error.
    'INFIX2__?__': ERROR<'\`:\` branch expected'>;
    'INFIX2__:__': 0;           // never used
}

// Remember: all operators are Left-Associative.
type TEST_Simple_1 = EvalExpr<USER_OBJ2, `
    'recf' ? 'y' : ('car' ? 'y1' : 'y2')
`>;

// ERROR: "`:` branch expected"
type TEST_Simple_1E1 = EvalExpr<USER_OBJ2, `
    'recf' ? 'y'
`>;

// ERROR: "`?` branch expected"
type TEST_Simple_1E2 = EvalExpr<USER_OBJ2, `
    'recf' : 'car'
`>;

// ERROR: "`:` branch expected"
type TEST_Simple_1E3 = EvalExpr<USER_OBJ2, `
    'recf' ? 'x' ? 'y'
`>;

// Test short-circuit evaluation!
type TEST_Simple_1sce1 = EvalExpr<USER_OBJ2, `
    'rec' ? 'y' : *'error'
`>;

// Test short-circuit evaluation!
type TEST_Simple_1sce2 = EvalExpr<USER_OBJ2, `
    'recXXXX' ? *'error' : 'z'
`>;

// ERROR: ["Can't dereference given key:", "not present"]
type TEST_Simple_1E4 = EvalExpr<USER_OBJ2, `
    'rec' ? *'not present' : 'z'
`>;

type TEST_Complex_3d = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        'ifStartsWith' ? (
            *'ifStartsWith' map ('start' => {
                call('StartsWith', v'start', v'key')
            }) reduce 'any'
        ) : call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;

// What about a prefixed `?:` operator?

interface Funcs4<T1, T2, T3, T4> {
    // T1 = {op, mem}
    // T2 = condition
    // T3 = then expression
    // T4 = else expression
    'PREFIX3__?:__PARSE': ['PREFIX3__if__', T2, _EVAL_Skip<T3>, _EVAL_Skip<T4>]

    'PREFIX3__?:__': 0;         // only necessary to register '?:'
}

// Still working thanks to short-circuiting.
type TEST_Simple_2 = EvalExpr<USER_OBJ2, `
    ?: 'rec' 'x' *'not present'
`>;

interface Funcs4<T1, T2, T3, T4> {
    // No short-circuiting version of ?:
    'PREFIX3__?:NS__': ToBool<T1, T2> extends true ? T3 : T4;
}

type TEST_Simple_2NS1 = EvalExpr<USER_OBJ2, `
    ?:NS 'rec' 'x' 'y'
`>;

// Error because there's no short-circuit evaluation!
// ERROR: ["Can't dereference given key:", "not present"]
type TEST_Simple_2NS_E1 = EvalExpr<USER_OBJ2, `
    ?:NS 'rec' 'x' *'not present'
`>;

// All OK!
type TEST_Simple_2NS_NoE1 = EvalExpr<USER_OBJ2, `
    ?: 'rec' 'x' *'not present'
`>;

// Error because of no short-circuit evaluation in `?:NS`.
type TEST_Complex_3_NS_E1 = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        ?:NS
            'ifStartsWith' (
                *'ifStartsWith' map ('start' => {
                    call('StartsWith', v'start', v'key')
                }) reduce 'any'
            )
            call('StaXXXrtsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;

// All OK!
type TEST_Complex_3e = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        ?:
            'ifStartsWith' (
                *'ifStartsWith' map ('start' => {
                    call('StartsWith', v'start', v'key')
                }) reduce 'any'
            )
            call('StaXXXrtsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;
