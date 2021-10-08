// This file contains the code for the section
//     Implementation
// in the file 
//     Writing Full-Fledged Type Programs in Typescript.md

/// <reference path="recurse.ts" />
/// <reference path="recurse_tests.ts" />
/// <reference path="eval_new.ts" />

type ZeroList<N extends number, List extends any[] = []> =
    List['length'] extends N ? List : ZeroList<N, [...List, 0]>;

type Test = ZeroList<45>['length'];             // 45

type ZeroList2<HalfN extends number, N extends number> =
    ZeroList<N, ZeroList<HalfN>>;

type Test2 = ZeroList2<44, 89>['length'];       // 89

//-----------------------------------------------------------------------------

type DeepCaller1<N extends number, List extends any[] = []> =
    List['length'] extends N ?
        Callee1<[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]> :
    DeepCaller1<N, [...List, 0]>;

type Callee1<S extends any[]> =
    S[0] extends 1 ?
        S[1] extends 2 ?
            S[2] extends 3 ?
                S[3] extends 4 ?
                    S[4] extends 5 ?
                        S[5] extends 6 ?
                            S[6] extends 7 ?
                                S[7] extends 8 ?
                                    S[8] extends 9 ?
                                        S[9] extends 10 ?
                                            S[10] extends 11 ?
                                                true :
                                            false :
                                        false :
                                    false :
                                false :
                            false :
                        false :
                    false :
                false :
            false :
        false :
    false;

type Test_Callee1 = DeepCaller1<36>;        // maximum 36

//-----------------------------------------------------------------------------

type DeepCaller2<N extends number, List extends any[] = []> =
    List['length'] extends N ?
        Callee2<[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]> :
    DeepCaller2<N, [...List, 0]>;

type Callee2<S extends any[]> =
    (S[0] extends 1 ?
        S[1] extends 2 ?
            S[2] extends 3 ?
                S[3] extends 4 ?
                    S[4] extends 5 ?
                        S[5] extends 6 ?
                            true :
                        false :
                    false :
                false :
            false :
        false :
    false) extends true ?
        S[6] extends 7 ?
            S[7] extends 8 ?
                S[8] extends 9 ?
                    S[9] extends 10 ?
                        S[10] extends 11 ?
                            true :
                        false :
                    false :
                false :
            false :
        false :
    false;

type Test_Callee2 = DeepCaller2<40>;        // maximum 40

//-----------------------------------------------------------------------------

// type TestList = [
//     1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // 37
//     1, 1, 1, 1, 1, 1, 1, 1,                             // 38
//     1, 1, 1, 1,                                         // 39
//     1, 1,                                               // 40
//     1, 1,                                               // 41
//     2
// ]

// type Test_GetLast1 = RecurseTree2<'GetLast', TestList, 37>;
// type Test_GetLast2 = RecurseTree2<'GetLast', TestList, 82>;

//-----------------------------------------------------------------------------

type TestList2 = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // 37
    1, 1, 1, 1, 1, 1, 1, 1,                             // 38
    1, 1, 1, 1,                                         // 39
    1, 1,                                               // 40
    1, 1,                                               // 41
    2
]

type Test_GetLast3 = RecurseTree2C<'GetLast', TestList2, 41>;

//-----------------------------------------------------------------------------

type Example_AST1 = ParseExpr<`
    !('a' && ('b' || 'c'))
`>;

//-----------------------------------------------------------------------------

type WeirdTrick1 = {
    (): number;
    (): string;
    (): boolean;
} extends () => infer T ? T : never;        // boolean

type WeirdType1 = {
    (): number;
    (): string;
    (): boolean;
};

function WT_Func(): number;
function WT_Func(): string;
function WT_Func(): boolean;
function WT_Func(): any {}

type WT_Check1 = AssertTrue<EQU<WeirdType1, typeof WT_Func>>;

type WeirdType2 = {(): number} & {(): string} & {(): boolean};
type WT_Check2 = AssertTrue<EQU<WeirdType1, WeirdType2>>;

type UnionToInters<U> =
    (U extends any ?
        (x: U) => void :
    never) extends (x: infer Inters) => void ?
        Inters :
    never;

type UTI_Union = {a:0} | {b:0} | {c:0};
type UTI_Inters1 = {a:0} & {b:0} & {c:0};
type UTI_Inters2 = UnionToInters<UTI_Union>;
type UTI_Check1 = AssertTrue<EQU<UTI_Inters1, UTI_Inters2>>;

type Func<T> = (x: T) => void;

type ApplyFuncToUnion<U> =
    U extends any ?         // for each elem in U
        Func<U> :           //    Func<U> :
    never;                  // never;

type GetOneOverload<OS> =
    OS extends (x: infer T) => void ? T : never; 

type ExtractUnionElem<U> =
    GetOneOverload<
        UnionToInters<
            U extends any ?
                (x: U) => void :
            never
        >
    >;

type Test_EUE_1 = ExtractUnionElem<10 | 20 | 30>;       // 30

type Test_Skip1 = (0 | 1 | 2) extends infer T | 2 ? T : never;
type Test_Skip2 = ({a:0} & {b:0} & {c:0}) extends infer T & {c:0} ? T : never;

type Skip1_Check = AssertTrue<EQU<Test_Skip1, 0 | 1>>;
type Skip2_Check = AssertTrue<EQU<Test_Skip2, {a:0} & {b:0}>>;
