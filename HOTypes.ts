// Note: TFilter, TMap, and TFlatMap use Recurse now.

/// <reference path="misc.ts" />
/// <reference path="recurse.ts" />

type KEYOFF1 = keyof Funcs1<0>;
type KEYOFF2 = keyof Funcs2<0, 0>;
type KEYOFF3 = keyof Funcs3<0, 0, 0>;
type KEYOFF4 = keyof Funcs4<0, 0, 0, 0>;
type KEYOFF5 = keyof Funcs5<0, 0, 0, 0, 0>;

type KEYOFFS = KEYOFF1 | KEYOFF2 | KEYOFF3 | KEYOFF4 | KEYOFF5;
type KEYOFFS_FROM1 = KEYOFFS;
type KEYOFFS_FROM2 = KEYOFF2 | KEYOFF3 | KEYOFF4 | KEYOFF5;
type KEYOFFS_FROM3 = KEYOFF3 | KEYOFF4 | KEYOFF5;
type KEYOFFS_FROM4 = KEYOFF4 | KEYOFF5;
type KEYOFFS_FROM5 = KEYOFF5;

// Representation of a function:
//  [funcArity, numMissingArgs, funcName, ...args]

// In general, FREEN is a function which takes N arguments.
type __FREE0 = [any, 0, ...any[]];
type __FREE1 = [any, 1, ...any[]];
type __FREE2 = [any, 2, ...any[]];
type __FREE3 = [any, 3, ...any[]];
type __FREE4 = [any, 4, ...any[]];
type __FREE5 = [any, 5, ...any[]];

type __FREE = [any, 1|2|3|4|5, ...any[]];

// SUB_TABLE[x][y] = x - y;
// Note: We want to save ?: depth!
type SUB_TABLE = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 2, 1, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 1, 0, 0, 0, 0, 0, 0],
    [5, 4, 3, 2, 1, 0, 0, 0, 0, 0],
    [6, 5, 4, 3, 2, 1, 0, 0, 0, 0],
    [7, 6, 5, 4, 3, 2, 1, 0, 0, 0],
    [8, 7, 6, 5, 4, 3, 2, 1, 0, 0],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

type SUB_NFREE<F extends __FREE, N extends number> =
    F extends [infer A, infer NFREE, ...infer TS] ?
        [A, SUB_TABLE[NFREE & number][N], ...TS]
    : never;

// NOTE:
//  The format [num args, func name, ...args] allows overloading.
//  For instance, we can have:
//      [2, AND, ...]
//      [3, AND, ...]
//      [4, AND, ...]
//  The three AND are defined in Funcs2, Funcs3, and Funcs4, respectively.

// type FUNC_DEBUG<F extends FUNC> =
//     `[${F[0]}, ${F[1]}, ...] (len = ${F['length']})`;

type PUSHARG1<F extends __FREE, A> = [...SUB_NFREE<F, 1>, A];
type PUSHARG2<F extends __FREE, A1, A2> = [...SUB_NFREE<F, 2>, A1, A2];
type PUSHARG3<F extends __FREE, A1, A2, A3> = [...SUB_NFREE<F, 3>, A1, A2, A3];
type PUSHARG4<F extends __FREE, A1, A2, A3, A4> = [...SUB_NFREE<F, 4>, A1, A2, A3, A4];
type PUSHARG5<F extends __FREE, A1, A2, A3, A4, A5> = [...SUB_NFREE<F, 5>, A1, A2, A3, A4, A5];

// Extended KEYSOFF (for overloading).
type EKEYOFF1 = KEYOFF1 | keyof {[k in KEYOFF1 as `${k}#1`]: 0};
type EKEYOFF2 = KEYOFF2 | keyof {[k in KEYOFF2 as `${k}#2`]: 0};
type EKEYOFF3 = KEYOFF3 | keyof {[k in KEYOFF3 as `${k}#3`]: 0};
type EKEYOFF4 = KEYOFF4 | keyof {[k in KEYOFF4 as `${k}#4`]: 0};
type EKEYOFF5 = KEYOFF5 | keyof {[k in KEYOFF5 as `${k}#5`]: 0};

type EKEYOFFS = EKEYOFF1 | EKEYOFF2 | EKEYOFF3 | EKEYOFF4 | EKEYOFF5;
type EKEYOFFS_FROM1 = EKEYOFFS;
type EKEYOFFS_FROM2 = EKEYOFF2 | EKEYOFF3 | EKEYOFF4 | EKEYOFF5;
type EKEYOFFS_FROM3 = EKEYOFF3 | EKEYOFF4 | EKEYOFF5;
type EKEYOFFS_FROM4 = EKEYOFF4 | EKEYOFF5;
type EKEYOFFS_FROM5 = EKEYOFF5;

// FREEN extends __FREEN by adding two bare string notations.
// If "FuncName" is the name of a function which takes 3 arguments, one can
// either use "FuncName" or "FuncName#3" (the latter allows overloading).
type FREE0 = __FREE0;
type FREE1 = __FREE1 | EKEYOFF1;
type FREE2 = __FREE2 | EKEYOFF2;
type FREE3 = __FREE3 | EKEYOFF3;
type FREE4 = __FREE4 | EKEYOFF4;
type FREE5 = __FREE5 | EKEYOFF5;

type FREE = __FREE | EKEYOFFS;

type FREE_FROM1 = FREE;
type FREE_FROM2 = FREE2 | FREE3 | FREE4 | FREE5;
type FREE_FROM3 = FREE3 | FREE4 | FREE5;
type FREE_FROM4 = FREE4 | FREE5;
type FREE_FROM5 = FREE5;

// A general solution is possible but not worth it (for now).
type TONUM_TABLE = {
    '1':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10
};

type FUN<F extends __FREE | EKEYOFFS> =
    F extends __FREE ? F :
    F extends `${infer FN}#${infer N}` ?
        [TONUM_TABLE[N & keyof TONUM_TABLE],
            TONUM_TABLE[N & keyof TONUM_TABLE], FN] : 
    F extends KEYOFF1 ? [1, 1, F] :
    F extends KEYOFF2 ? [2, 2, F] :
    F extends KEYOFF3 ? [3, 3, F] :
    F extends KEYOFF4 ? [4, 4, F] :
    F extends KEYOFF5 ? [5, 5, F] :
    never;

type BIND1<F extends FREE_FROM2, A> = PUSHARG1<FUN<F>, A>;
type BIND2<F extends FREE_FROM3, A1, A2> = PUSHARG2<FUN<F>, A1, A2>;
type BIND3<F extends FREE_FROM4, A1, A2, A3> = PUSHARG3<FUN<F>, A1, A2, A3>;
type BIND4<F extends FREE_FROM5, A1, A2, A3, A4> = PUSHARG4<FUN<F>, A1, A2, A3, A4>;
// there's no BIND5

type APPLY1<F extends FREE1, A> = FEVAL<PUSHARG1<FUN<F>, A>>;
type APPLY2<F extends FREE2, A1, A2> = FEVAL<PUSHARG2<FUN<F>, A1, A2>>;
type APPLY3<F extends FREE3, A1, A2, A3> = FEVAL<PUSHARG3<FUN<F>, A1, A2, A3>>;
type APPLY4<F extends FREE4, A1, A2, A3, A4> = FEVAL<PUSHARG4<FUN<F>, A1, A2, A3, A4>>;
type APPLY5<F extends FREE5, A1, A2, A3, A4, A5> = FEVAL<PUSHARG5<FUN<F>, A1, A2, A3, A4, A5>>;

// Notes:
// - "F extends FREE0" would require a type cast in APPLY*.
type FEVAL<F /* extends FREE0 */> =
    F extends [1, 0, infer FN, ...infer AS] ?
        Funcs1<AS[0]>[FN & KEYOFF1] :
    F extends [2, 0, infer FN, ...infer AS] ?
        Funcs2<AS[0], AS[1]>[FN & KEYOFF2] :
    F extends [3, 0, infer FN, ...infer AS] ?
        Funcs3<AS[0], AS[1], AS[2]>[FN & KEYOFF3] :
    F extends [4, 0, infer FN, ...infer AS] ?
        Funcs4<AS[0], AS[1], AS[2], AS[3]>[FN & KEYOFF4] :
    F extends [5, 0, infer FN, ...infer AS] ?
        Funcs5<AS[0], AS[1], AS[2], AS[3], AS[4]>[FN & KEYOFF5] :
    never

// type OK1 = APPLY1<[1, 1, 'ToArray'], number>;       // number[]
// type OK2 = APPLY1<'ToArray', number>;               // number[]
// type OK3 = APPLY1<'ToArray#1', number>;             // number[]

type LOBJ<T> = LObjs<T>[keyof LObjs<T>];
type ARG<T> = T extends LOBJ<infer A> ? A : never;
type CONS<T, A> = {
    [k in keyof LObjs<any>]: EQU<T, LObjs<ARG<T>>[k]> extends true
                             ? LObjs<A>[k] : never;
} [keyof LObjs<any>];

interface Funcs1<T> {}
interface Funcs2<T1, T2> {}
interface Funcs3<T1, T2, T3> {}
interface Funcs4<T1, T2, T3, T4> {}
interface Funcs5<T1, T2, T3, T4, T5> {}
// etc...

interface LObjs<T> {}

interface Funcs1<T> {
    // T = [Function, TransformedList, UnprocessedList]
    // Returns [Value, Done], where Value can be:
    //  TransformedList                                 when done
    //  [Function, TransformedList, UnprocessedList]    when NOT done
    // Note:
    //  T[0], T[1], and T[2] instead of the first `extends` would be faster.
    TMap_step:
        T extends [infer F, infer TL, infer UL] ?
            UL extends [] ? [TL, true] :
            UL extends [infer Head, ...infer Tail] ? [
                // "Type casting" would be noticeably slower.
                // @ts-expect-error
                [F, [...TL, APPLY1<F, Head>], Tail],
                false
            ] : never :
        never;

    // same comments as for TMap_step
    TFlatMap_step:
        T extends [infer F, infer TL, infer UL] ?
            UL extends [] ? [TL, true] :
            UL extends [infer Head, ...infer Tail] ? [
                // "Type casting" would be noticeably slower.
                // @ts-expect-error
                [F, [...TL, ...APPLY1<F, Head>], Tail],
                false
            ] : never :
        never;

    // same comments as for TMap_step
    TFilter_step:
        T extends [infer F, infer TL, infer UL] ?
            UL extends [] ? [TL, true] :
            UL extends [infer Head, ...infer Tail] ?
                // "Type casting" would be noticeably slower.
                // @ts-expect-error
                APPLY1<F, Head> extends true ?
                    // @ts-expect-error
                    [[F, [...TL, Head], Tail], false] :
                [[F, TL, Tail], false] :
            never :
        never;
}

type TMap<F extends FREE1, L> =
    // `[0]` instead of `extends...` would give a(n ignorable) depth error.
    Recurse<'TMap_step', [F, [], L]> extends [infer R, any] ? R : never;

type TFlatMap<F extends FREE1, L> =
    // `[0]` instead of `extends...` would give a(n ignorable) depth error.
    Recurse<'TFlatMap_step', [F, [], L]> extends [infer R, any] ? R : never;

type TFilter<F extends FREE1, L> =
    // `[0]` instead of `extends...` would give a(n ignorable) depth error.
    Recurse<'TFilter_step', [F, [], L]> extends [infer R, any] ? R : never;

type OldTMap<F extends FREE1, TS> =
    TS extends [] ? [] :
    TS extends [infer H, ...(infer TS2)] ?
        [APPLY1<F, H>, ...OldTMap<F, TS2>] :
    never;

type OldTFilter<F extends FREE1, TS> =
    TS extends [] ? [] :
    TS extends [infer H, ...(infer TS2)] ?
        APPLY1<F, H> extends true ?
            [H, ...OldTFilter<F, TS2>] :
        OldTFilter<F, TS2> :
    never;

type OldTFlatMap<F extends FREE1, TS> =
    TS extends [] ? [] :
    TS extends [infer H, ...(infer TS2)] ?
        APPLY1<F, H> extends any[] ?
            [...APPLY1<F, H>, ...OldTFlatMap<F, TS2>] :
        never :
    never;

// Lifted Objects
interface LObjs<T> {
    Array: Array<T>;
    Set: Set<T>;
};

interface Funcs1<T> {
    Identity: T;
    Arg: ARG<T>;
    ToArray: Array<T>;
    FromArray: T extends Array<infer A> ? A : never;
    ArrayToSet: T extends Array<infer A> ? Set<A> : never;
    ArgToNumber: CONS<T, number>;
};

interface Funcs2<T1, T2> {
    Cons: CONS<T1, T2>;
    TMap: T1 extends FREE1 ? TMap<T1, T2> : never;
    TFilter: T1 extends FREE1 ? TFilter<T1, T2> : never;
    TFlatMap: T1 extends FREE1 ? TFlatMap<T1, T2> : never;
}

//----------------------------------------------------------------------
//----------------------------------------------------------------------
//------------------------E X A M P L E S ------------------------------
//----------------------------------------------------------------------
//----------------------------------------------------------------------

//----------------------------------------------------------------------
// TMap
//----------------------------------------------------------------------
type Types = [number, number, string, boolean, Set<'aaa'>];
type Arrays = TMap<'ToArray', Types>;               // [Array<.>, ...]
type Types2 = TMap<'FromArray', Arrays>;
type Check1 = AssertTrue<EQU<Types, Types2>>;
type Sets = TMap<'ArrayToSet', Arrays>;             // [Set<.>, ...]
type All = [...Arrays, ...Sets];
type Types3 = TMap<'Arg', All>;
type Check2 = AssertTrue<EQU<Types3, [...Types, ...Types]>>;
type WithNumbers = TMap<'ArgToNumber', All>;

//----------------------------------------------------------------------
// TFilter
//----------------------------------------------------------------------
interface Funcs1<T> {            // courtesy of interface merging
    HasNumber: ARG<T> extends number ? true : false;
}
type OnlyWithNumbers = TFilter<'HasNumber', All>;

//----------------------------------------------------------------------
// TFlatMap
//----------------------------------------------------------------------
interface Funcs1<T> {
    TakeTwice: [T, T];
    // TakeOnlyWithNumber: APPLY<'HasNumber', T> extends true ? [T] : [];
    TakeOnlyWithNumber: ARG<T> extends number ? [T] : [];       // simpler
}
type RepeatedTypes = TFlatMap<'TakeTwice', Types>;
type OnlyWithNumbers2 = TFlatMap<'TakeOnlyWithNumber', All>;
type Check3 = AssertTrue<EQU<OnlyWithNumbers, OnlyWithNumbers2>>;

//----------------------------------------------------------------------
// Binding and returning functions
//----------------------------------------------------------------------
interface Funcs3<T1, T2, T3> {
    Comp: T1 extends FREE1 ? T2 extends FREE1 ?
        APPLY1<T1, APPLY1<T2, T3>>
    : never : never;
}
type ToSetArray1 = TMap<BIND2<'Comp',
                              BIND1<'Cons', Set<any>>,
                              BIND1<'Cons', Array<any>>>,
                        Types>;

// Even better:
type COMP<F1 extends FREE1, F2 extends FREE1> = BIND2<'Comp', F1, F2>;
type ToSetArray2 = TMap<COMP<BIND1<'Cons', Set<any>>,
                             BIND1<'Cons', Array<any>>>,
                        Types>;
type Check4 = AssertTrue<EQU<ToSetArray1, ToSetArray2>>;

type NestedTypes = [[1, 4, Number], ['s', 'b', string], [true, false, boolean]];

// If we want to pass TMap to itself, we need to *lift* it.
interface Funcs2<T1, T2> {
    TMap: T1 extends FREE1 ? TMap<T1, T2> : never;
}
type Types4 = TMap<BIND1<'TMap', BIND1<'Cons', Set<any>>>,
                   NestedTypes>;

// Let's decompose it.
// Note that BIND always produces lifted functions.
type ToSet = BIND1<'Cons', Set<any>>;
type TupleToSet = BIND1<'TMap', ToSet>;
type Types5 = TMap<TupleToSet, NestedTypes>;
type Check5 = AssertTrue<EQU<Types4, Types5>>;

//----------------------------------------------------------------------
//----------------------------------------------------------------------
//------------------------P R I N C I P I U M---------------------------
//----------------------------------------------------------------------
//----------------------------------------------------------------------

// This is where it all started and now it looks quite trivial.

// non-DRY way ------------------------------------
type IterableArgs<IS extends Iterable<any>[]> =
    IS extends [] ? [] :
    IS extends [infer I, ...(infer IT)]
    ? I extends Iterable<infer A>
        ? IT extends Iterable<any>[]
            ? [A, ...IterableArgs<IT>]
            : never
        : never
    : never;
// -----------------------------------------------

// DRY way ---------------------------------------
interface LObjs<T> {
    'Iterable': Iterable<T>
}
// -----------------------------------------------

function any(xs: Iterable<any>) {
    for (const x of xs) if (x) return true;
    return false;
}

function* zip<TS extends Iterable<any>[]>(...xs: TS)
        //   : Generator<IterableArgs<TS>> {           // non-DRY way
          : Generator<TMap<'Arg', TS>> {            // DRY way
    const iters = xs.map(x => x[Symbol.iterator]());
    let nexts;
    while (true) {
        nexts = iters.map(it => it.next());
        if (any(nexts.map(n => n.done))) break;
        yield nexts.map(n => n.value) as any;
    }
}

function makeIter<T>(...xs: T[]) {
    return (function*() { yield* xs})();
}

function f() {
    const nums = [6, 2, 9, 8];          // the shortest of the 3
    const strs = makeIter('a', 'b', 'c', 'd', 'e', 'f');
    const bools = makeIter(true, false, true, true, true);
    for (const [n, s, b] of zip(nums, strs, bools)) {
        // We have correct types and autocompletion!
        if (b) console.log(`${n - 1}: ${s.toUpperCase()}`);
    }
}

f();
