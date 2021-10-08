/// <reference path="recurse.ts" />

// #a forces nominal typing => no collisions
class ERROR<T> {#a?: T};
class SafeNever {#a?: 0};
class UnusedType {#a?: 0};

type EQU<T1, T2> = [T1] extends [T2] ? [T2] extends [T1] ? true : false : false

type DecCount = [
    0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
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

// IMPORTANT:
//  The SafeWrap utils aren't used anymore. I used it when I was working with
//  unions instead of lists/tuples.

// Notes:
// - Be careful with `T extends SafeWrap<...>`. Use it only for exact matches
//   such as
//      T extends SafeWrap<[[any, 9], true, infer R]>
//   (`any` works correctly when used in this simple way)
//   Never use it for matches like
//      T extends SafeWrap<[any, ...any[]]>
//   For instance
//      SafeWrap<[4]> extends SafeWrap<[any, ...any[]]> ? true : false
//      SafeWrap<4> extends SafeWrap<4|9> ? true : false
//      SafeWrap<4|9> extends SafeWrap<4> ? true : false
//   evaluate all to `false`.
//   It works with `infer`, though:
//      SafeWrap<[1, 2]> extends SafeWrap<[infer A, ...infer B]> ?
//          [A, B] : never;
type SafeWrap<T> = {
    (x: T): void;
    T: T;               // for direct retrieval
}

// wraps each union element of T, thanks to distributivity
type SafeWrapEach<T> = T extends any ? SafeWrap<T> : never;

type SafeWrapOnce<T> = T extends SafeWrap<any> ? T : SafeWrap<T>;

// Note: distributes over `Union`.
type SafeUnwrapEach<Union> =
    Union extends SafeWrap<SafeNever> ? never :
    Union extends SafeWrap<infer A> ? A :
    Union;

// Like `SafeUnWrapEach` but also keeps the original type.
type WithSafeUnwrapEach<Union> = [Union, SafeUnwrapEach<Union>];

type AssertTrue<T extends true> = T;
type AssertFalse<T extends false> = T;

type Test_SafeWrap_0 = AssertTrue<EQU<[true] | [false], [boolean]>>;
type Test_SafeWrap_1 = AssertFalse<EQU<SafeWrap<0> | SafeWrap<1>,
                                       SafeWrap<0|1>>>;
type Test_SafeWrap_2 = AssertFalse<EQU<SafeWrap<true> | SafeWrap<false>,
                                   SafeWrap<boolean>>>;
type Test_SafeWrap_3 = SafeWrapEach<0|1|2>;
type Test_SafeWrap_4 = SafeWrap<SafeWrapEach<0|1|2>>;
type Test_SafeWrap_5 = AssertFalse<
    SafeWrap<[4]> extends SafeWrap<[any, ...any[]]> ? true : false>;
type Test_SafeWrap_6 = AssertTrue<
    SafeWrap<[4, []]> extends SafeWrap<[any, []]> ? true : false>;
type Test_SafeWrap_7 = AssertFalse<
    SafeWrap<4> extends SafeWrap<4|9> ? true : false>;
type Test_SafeWrap_8 = AssertTrue<EQU<
    SafeWrap<[1, 2]> extends SafeWrap<[infer A, ...infer B]> ? [A, B] : never,
    [1, [2]]>>;

// Use `SubType` like this:
//  false extends SubType<infer T, boolean> ? T : 'no';    // T = false
//  4 extends SubType<infer T, boolean> ? T : 'no';        // T = 'no'
// Note: It doesn't work with `${...}`.
type SubType<T, Type> = [T] extends [Type] ? T : never;

type NotSubType<T, Type> = [T] extends [Type] ? never : T;

type TypeCast<T, Type> = T extends Type ? T : never;

type WrapUnion<Union> =
    Union extends any ?             // distributes
        (x: () => Union) => void :
    never;

interface Funcs1<T> {
    // The caller must start with T = [Union].
    // T = [Union] | [Inters, List]
    UnionToList_STEP:
        T extends [infer Inters, infer List] ?
            Inters extends () => infer OneUnionElem ?
                (() => OneUnionElem) extends Inters ?       // last element
                    //@ts-expect-error
                    [[OneUnionElem, ...List], true] :
                Inters extends (() => OneUnionElem) & infer Inters2 ?
                    //@ts-expect-error
                    [[Inters2, [OneUnionElem, ...List]], false] :
                never :
            never :
        T extends [infer Union] ?
            [Union] extends [never] ? [[], true] :
            WrapUnion<Union> extends (((x: infer Intersection) => void)) ?
                [[Intersection, []], false] :
            never :
        never;
}

type UnionToList<Union> =
    Recurse<'UnionToList_STEP', [Union]> extends [infer R, any] ? R : never;
