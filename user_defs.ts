/// <reference path="eval_new.ts" />

class SubExprFuncDesc<ArgName extends string, Parsed> {#a?: [ArgName, Parsed]}

// T1 = CONTEXT
interface Funcs2<T1, T2> {
    // T2 = literal to dereference
    'PREFIX1__*__':
        //@ts-expect-error
        T2 extends keyof T1['obj'] ? T1['obj'][T2] :
        ERROR<["Can't dereference given key:", T2]>;

    // T2 = variable key
    'PREFIX1__v__':
        //@ts-expect-error
        T2 extends keyof T1['env'] ? T1['env'][T2] :
        ERROR<["Can't find variable:", T2]>;

    // This is like `v` above, but wraps the value in an array.
    // T2 = variable key
    'PREFIX1__v__FOR_FMAP__':
        //@ts-expect-error
        T2 extends keyof T1['env'] ? [T1['env'][T2]] :
        ERROR<["Can't find variable:", T2]>;
}

// Note:
//  This distributes over Union, so it returns
//    `false` when Elem is not in Union,
//    `true` when Union contains Elem and only Elem,
//    `boolean` otherwise.
type IsElemInUnion<Elem, Union> =
    Union extends any ? EQU<Elem, Union> : never;

interface Funcs3<T1, T2, T3> {
    // Tells whether T2 is in the list T3.
    // T1 = CONTEXT
    // T2 = val to search for
    // T3 = list where to search
    //
    // Implementation Notes:
    //  Passing T3[number] to IsInList keeps the single elements separated,
    //  i.e., e.g., [true, false] is passed as two separate elements, instead
    //  of as the single element `boolean`.
    INFIX2__in__:
        //@ts-expect-error
        true extends IsElemInUnion<T2, T3[number]> ? true : false;
}

type TEST_in_0 = [0, 1, true, false];
type TEST_in_1 = AssertTrue<APPLY3<'INFIX2__in__', never, 0, TEST_in_0>>;
type TEST_in_2 = AssertFalse<APPLY3<'INFIX2__in__', never, 'p', TEST_in_0>>;
type TEST_in_3 = AssertTrue<APPLY3<'INFIX2__in__', never, true, TEST_in_0>>;
type TEST_in_4 = AssertFalse<APPLY3<'INFIX2__in__', never, boolean, TEST_in_0>>

interface Funcs3<T1, T2, T3> {
    // T2 = FREE with at least 2 missing arguments
    // T3 = argument to bind
    INFIX2__bind__:
        T2 extends FREE_FROM2 ? BIND1<T2, T3> :
    ERROR<["LHS operand not supported by `bind`. Operands: ", T2, T3]>;
}

interface Funcs2<T1, T2> {
    // returns the value of special symbols
    // T1 = CONTEXT
    // T2 = symbol name (without the prefix '$'; e.g., KEYS instead of $KEYS)
    PREFIX1__$__:
        T2 extends 'KEYS' ?
            //@ts-expect-error
            _EVAL_Call<'UnionToList_STEP', [keyof T1['obj']]> :
        ERROR<"Error in __$__">;
}

interface Funcs3<T1, T2, T3> {
    // T2 = list of booleans
    // T3 = 'all' or 'any'
    INFIX2__reduce__:
        T3 extends 'all' ?          // only `true` allowed
            T2 extends true[] ? true : false :
        T3 extends 'any' ?          // at least one `true` required
            //@ts-expect-error
            true extends T2[number] ? true : false :
        ERROR<["Unrecognized reduce operation:", T3]>;
}

type TEST_OBJ = { a: 1, b: 2, c: 3 };

type TEST_reduce_1 = AssertFalse<APPLY3<
    'INFIX2__reduce__', TEST_OBJ, [false, true, false], 'all'>>;
type TEST_reduce_2 = AssertFalse<APPLY3<
    'INFIX2__reduce__', TEST_OBJ, [false], 'all'>>;
type TEST_reduce_3 = AssertTrue<APPLY3<
    'INFIX2__reduce__', TEST_OBJ, [true, true, true], 'all'>>;
type TEST_reduce_4 = AssertTrue<APPLY3<
    'INFIX2__reduce__', TEST_OBJ, [], 'all'>>;

type TEST_reduce_5 = AssertFalse<APPLY3<
    'INFIX2__reduce__', TEST_OBJ, [false, false], 'any'>>;
type TEST_reduce_6 = AssertTrue<APPLY3<
    'INFIX2__reduce__', TEST_OBJ, [false, true], 'any'>>;
type TEST_reduce_7 = AssertFalse<APPLY3<
    'INFIX2__reduce__', TEST_OBJ, [], 'any'>>;

interface Funcs2<T1, T2> {
    // T1 = prefix to look for
    // T2 = literal
    StartsWith: T2 extends `${T1 & string}${any}` ? true : false;
}

interface Funcs3<T1, T2, T3> {
    // Returns a subexpression function.
    // T2 = arg name
    // T3 = expression
    'INFIX2__=>__':
        T3 extends _EVAL_SubExpr<infer E> ?
            SubExprFuncDesc<T2 & string, E> :
        ERROR<[
            "RHS operand of `=>` must be an expression. Operands: ", T2, T3
        ]>;
}

interface Funcs3<T1, T2, T3> {
    INFIX2__apply__:
        T2 extends FREE1 ? APPLY1<T2, T3> :
        ERROR<["LHS operand not supported by `apply`. Operands: ", T2, T3]>;
}

interface Funcs4<T1, T2, T3, T4> {
    // T1 = {op, mem}
    // T2 = condition
    // T3 = then expression
    // T4 = else expression
    PREFIX3__if__PARSE:
        T3 extends NotSubType<infer _, _EVAL_OperationPtr<any>> ?
            ERROR<'`then` branch expected in `if` expression'> :
        T4 extends NotSubType<infer _, _EVAL_OperationPtr<any>> ?
            ERROR<'`else` branch expected in `if` expression'> :
        [
            //@ts-expect-error
            ReadFromParseMem<T1['mem'], GetOpnPtrPtr<T3>>,
            //@ts-expect-error
            ReadFromParseMem<T1['mem'], GetOpnPtrPtr<T4>>
        ] extends [
            ["PREFIX1__then__", infer Then_OPND],
            ["PREFIX1__else__", infer Else_OPND]
        ] ?
            //@ts-expect-error
            [T1['op'], T2, _EVAL_Skip<Then_OPND>, _EVAL_Skip<Else_OPND>] :
        ERROR<'Unknown error with `if` expression'>;

    // T1 = CONTEXT
    PREFIX3__if__:
        ToBool<T1, T2> extends true ? UnskipValue<T3> : UnskipValue<T4>;
}

interface Funcs2<T1, T2> {
    // These operators are only used as part of the `if` syntax, checked in
    // `PREFIX3__if__PARSE`, and then removed.
    PREFIX1__then__: never;
    PREFIX1__else__: never;
}

// Extends Env with {[Name]: Val} overwriting an eventual preexisting `Name`.
type AddToEnv<Env extends {}, Name extends string, Value> = {
    [K in keyof Env | Name]: K extends Name ? Value : Env[K & keyof Env];
};

interface Funcs1<T> {
    // T = [F, Value]
    __Map_FREE1_GetFR: T;

    // T = [Context, ArgName, ParsedSubExpr, Value]
    __Map_SubExpr_GetFR: [
        'Eval',
        [
            _EVAL_CONTEXT<
                //@ts-expect-error
                T[0]['obj'],
                //@ts-expect-error
                AddToEnv<T[0]['env'], T[1], T[3]>,
                //@ts-expect-error
                T[0]['expr']
            >,
            //@ts-expect-error
            [T[2]]
        ]
    ];
}

type MapOp<Context extends _EVAL_CONTEXT<any, any, any>, Values, F> =
    F extends FREE1 ?
        _EVAL_MCall1<'__Map_FREE1_GetFR', [F], Values> :
    F extends SubExprFuncDesc<infer ArgName, infer ParsedSubExpr> ?
        _EVAL_MCall<
            '__Map_SubExpr_GetFR', [Context, ArgName, ParsedSubExpr], Values
        > :
    ERROR<["Invalid function: ", F]>;

type FlatMapOp<Context extends _EVAL_CONTEXT<any, any, any>, Values, F> =
    F extends FREE1 ?
        _EVAL_FMCall1<'__Map_FREE1_GetFR', [F], Values> :
    F extends SubExprFuncDesc<infer ArgName, infer ParsedSubExpr> ?
        _EVAL_FMCall<
            '__Map_SubExpr_GetFR', [Context, ArgName, ParsedSubExpr], Values
        > :
    ERROR<["Invalid function: ", F]>;

interface Funcs2<T1, T2> {
    // T1 = predicate (i.e. bool function)
    // T2 = value
    // Note: This is called by '__MR_FlatMap1' so it wraps its output.
    //@ts-expect-error
    FlatMapToFilterFunc: APPLY1<T1, T2> extends true ? [T2] : [];
}

interface Funcs3<T1, T2, T3> {
    // T1 = context: _EVAL_CONTEXT
    // T2 = ParsedSubExpr
    // T3 = ArgName
    // Note: This is called by '__MR_FlatMap' so it wraps its output.
    INFIX2__FMToFFunc__:
        //@ts-expect-error
        ToBool<T1, T2> extends true ? [T1['env'][T3]] : [];
}

// Filters the elements in the list `Values` according to the predicate `F`.
//
// NOTES:
// - This is implemented by transforming
//      Values filter Func
//   into
//      Values map (X => {if F(X) then X else never})
type FilterOp<Context extends _EVAL_CONTEXT<any, any, any>, Values, F> =
    F extends FREE1 ?
        _EVAL_FMCall1<
            '__Map_FREE1_GetFR', [BIND1<'FlatMapToFilterFunc', F>], Values
        > :
    F extends SubExprFuncDesc<infer ArgName, infer ParsedSubExpr> ?
        _EVAL_FMCall<
            '__Map_SubExpr_GetFR',
            [
                Context,
                ArgName,
                _EVAL_Operation<[
                    'INFIX2__FMToFFunc__', ParsedSubExpr, ArgName
                ]>
            ],
            Values
        > :
    ERROR<["Invalid function: ", F]>;

// T1 = context: _EVAL_CONTEXT
interface Funcs3<T1, T2, T3> {
    // T2 = list to transform
    // T3 = function / sub-expression
    //@ts-expect-error
    INFIX2__map__: MapOp<T1, T2, T3>;

    // T2 = list to filter
    // T3 = function / sub-expression
    //@ts-expect-error
    INFIX2__filter__: FilterOp<T1, T2, T3>;
}
