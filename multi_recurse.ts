/// <reference path="HOTypes.ts" />
/// <reference path="misc.ts" />
/// <reference path="recurse.ts" />

// IMPORTANT:
//  See IMPORTANT in `recurse.ts`.

//-------------- 4-ary, cached ----------------
// Note: it's faster with `//@ts-expect-error`
type __MultiRecurse2<R, Depth extends number> =
    //@ts-expect-error
    MultiRecurse<MultiRecurse<R, Depth>[0], Depth>;

// Note: it's faster with `//@ts-expect-error`
type __MultiRecurse3<R, Depth extends number> =
    //@ts-expect-error
    MultiRecurse<__MultiRecurse2<R, Depth>[0], Depth>;

type MultiRecurse<R, Depth extends number> =
    Depth extends 0 ? MultiRecurse_int<R> :
    MultiRecurse<R, DecCount[Depth]> extends [infer R, true] ?
        [R, true] :
    __MultiRecurse2<R, DecCount[Depth]> extends [infer R, true] ?
        [R, true] :
    // Little trick to avoid using __MultiRecurse4.
    __MultiRecurse3<R, DecCount[Depth]> extends [infer R, false] ?
        MultiRecurse<R, DecCount[Depth]> :
    __MultiRecurse3<R, DecCount[Depth]>;
//-----------------------------------
type MultiRecurseTree2<R, Depth extends number> =
    Depth extends 0 ? MultiRecurse_int<R> :
    MultiRecurseTree2<R, DecCount[Depth]> extends [infer R, infer Done] ?
        Done extends true ?
            [R, Done] :
        MultiRecurseTree2<R, DecCount[Depth]> :
    never;
//-----------------------------------
type __MultiRecurseDebug<RN extends [any, number], Depth extends number> =
    Depth extends 0 ?
        MultiRecurse_int<RN[0]> extends [infer R, infer Done] ?
            [[R, DecCount[RN[1]]], Done] :
        never :
    __MultiRecurseDebug<RN, DecCount[Depth]> extends [
        [infer R, infer N], infer Done
    ] ?
        Done extends true ? [[R, N], Done] :
        N extends 0 ? [[R, N], Done] :
        __MultiRecurseDebug<[R, N & number], DecCount[Depth]> :
    never;

type MultiRecurseDebug<R, Depth extends number, Iters extends number> =
    Iters extends 0 ? [R, true] :
    __MultiRecurseDebug<[R, Iters], Depth> extends [
        [infer R, number], infer Done
    ] ? [R, Done] : never;

class MR_WithResult<R, Res> {#a?: 0; R: R; Res: Res};

// NOTES:
// - `ContWith` and `Return` are defined in recurse.ts.
// - `ResRec` is the "result receiver". If missing, the function in R, i.e. the
//   caller itself, will receive the result.
// IMPORTANT:
// - `ResRec` may only return R, without Done.
type Call<R, FNew, RNew, ResRec = undefined> = [R, FNew, RNew, ResRec];

// For each V in Vals
//     let [F, R] = GetFR<[...GetFR_R, V] in
//         Call<F, R>
// where F is a step function.
type MCall<R, GetFR, GetFR_R, Vals, ResRec = undefined> = [
    R, '__MR_Map', [GetFR, GetFR_R, Vals, []], ResRec
];

// For each V in Vals
//     let [F, R] = GetFR<[...GetFR_R, V] in
//         APPLY1<F, R>
// where F is a regular function.
type MCall1<R, GetFR, GetFR_R, Vals, ResRec = undefined> = [
    R, '__MR_Map1', [GetFR, GetFR_R, Vals, []], ResRec
];

interface Funcs1<T> {
    __MR_Map_Res:
        T extends MR_WithResult<
            [infer GetFR, infer GetFR_R, infer Values, infer Results],
            infer Result
        > ?
            //@ts-expect-error
            [GetFR, GetFR_R, Values, [...Results, Result]] :
        never;

    // T = [GetFR, GetFR_R, Values, Results]
    // where APPLY1<GetFR, [...GetFR_R, Value]> must return [F2, R2],
    // where F2<R2> will be called through `Call`.
    __MR_Map:
        T extends [
            infer GetFR, infer GetFR_R, infer Values, infer Results
        ] ?
            Results extends [...any[], ERROR<infer ErrMsg>] ?
                Return<ERROR<ErrMsg>> :
            Values extends [infer V, ...infer Values2] ?
                //@ts-expect-error
                APPLY1<GetFR, [...GetFR_R, V]> extends [infer F, infer R] ?
                    Call<
                        [GetFR, GetFR_R, Values2, Results], F, R,
                        '__MR_Map_Res'
                    > :
                never :
            Values extends [] ?
                Return<Results> :
            Return<ERROR<["__MR_Map: (1) wrong input"]>> :
        Return<ERROR<"__MR_Map: (2) wrong input">>;

    __MR_FlatMap_Res:
        T extends MR_WithResult<
            [infer GetFR, infer GetFR_R, infer Values, infer Results],
            infer Result
        > ?
            Result extends ERROR<any> ?
                //@ts-expect-error
                [GetFR, GetFR_R, Values, [...Results, Result]] :
            //@ts-expect-error
            [GetFR, GetFR_R, Values, [...Results, ...Result]] :
        never;

    // Notes:
    //  Only differences from __MR_Map:
    //      '__MR_FlatMap_Res' instead of '__MR_Map_Res'
    //      error messages
    __MR_FlatMap:
        T extends [
            infer GetFR, infer GetFR_R, infer Values, infer Results
        ] ?
            Results extends [...any[], ERROR<infer ErrMsg>] ?
                Return<ERROR<ErrMsg>> :
            Values extends [infer V, ...infer Values2] ?
                //@ts-expect-error
                APPLY1<GetFR, [...GetFR_R, V]> extends [infer F, infer R] ?
                    Call<
                        [GetFR, GetFR_R, Values2, Results], F, R,
                        '__MR_FlatMap_Res'
                    > :
                never :
            Values extends [] ?
                Return<Results> :
            Return<ERROR<"__MR_FlatMap: (1) wrong input">> :
        Return<ERROR<"__MR_FlatMap: (2) wrong input">>;

    // T = [GetFR, GetFR_R, Values, Results]
    // where F is a regular (i.e. mono-step) function.
    __MR_Map1:
        T extends [
            infer GetFR, infer GetFR_R, infer Values, infer Results
        ] ?
            Results extends [...any[], ERROR<infer ErrMsg>] ?
                Return<ERROR<ErrMsg>> :
            Values extends [infer V, ...infer Values2] ?
                //@ts-expect-error
                APPLY1<GetFR, [...GetFR_R, V]> extends [infer F, infer R] ?
                    //@ts-expect-error
                    APPLY1<F, R> extends infer FofR ?
                        ContWith<[
                            //@ts-expect-error
                            GetFR, GetFR_R, Values2, [...Results, FofR]
                        ]> :
                    never :
                never :
            Values extends [] ?
                Return<Results> :
            Return<ERROR<"__MR_Map1: (1) wrong input">> :
        Return<ERROR<"__MR_Map1: (2) wrong input">>;

    // T = [GetFR, GetFR_R, Values, Results]
    // where F is a regular (i.e. mono-step) function.
    // Notes:
    //  Only differences from __MR_Map1:
    //      [...Results, ...FofR] instead of [...Results, FofR].
    //      error messages
    __MR_FlatMap1:
        T extends [
            infer GetFR, infer GetFR_R, infer Values, infer Results
        ] ?
            Results extends [...any[], ERROR<infer ErrMsg>] ?
                Return<ERROR<ErrMsg>> :
            Values extends [infer V, ...infer Values2] ?
                //@ts-expect-error
                APPLY1<GetFR, [...GetFR_R, V]> extends [infer F, infer R] ?
                    //@ts-expect-error
                    APPLY1<F, R> extends infer FofR ?
                        ContWith<[
                            //@ts-expect-error
                            GetFR, GetFR_R, Values2, [...Results, ...FofR]
                        ]> :
                    never :
                never :
            Values extends [] ?
                Return<Results> :
            Return<ERROR<"__MR_FlatMap1: (1) wrong input">> :
        Return<ERROR<"__MR_FlatMap1: (2) wrong input">>;
}

type MultiRecurse_int<MRState> =
    // MRState format:
    //  [    FRR1,          FRR2,      ...,     FRRN     ] =
    //  [[F1, R1, RR1], [F2, R2, RR2], ..., [FN, RN, RRN]]
    //
    // where RR = ResRec is the result receiver. It can be `undefined`.
    // If present, it receives the result returned by a function called, and it
    // returns the updated R (now containing the result, usually).
    // This is used to avoid an additional iteration just to store the result.
    //
    // F may return:
    //   ContWith<R>                = [R, false]
    //   Call<R, FNew, RNew, RRNew> = [R, FNew, RNew, RRNew]
    //   Return<Result>             = [Result, true]
    MRState extends [           // at least 2 tasks present
        ...infer FRS, [infer FPrev, infer RPrev, infer RRPrev],
        [infer F, infer R, infer RR]
    ] ?
        //@ts-expect-error
        APPLY1<F, R> extends infer FofR ?
            // ContWith
            FofR extends [infer R2, false] ?
                ContWith<[...FRS, [FPrev, RPrev, RRPrev], [F, R2, RR]]> :
            // Call
            FofR extends [infer R2, infer FNew, infer RNew, infer RRNew] ?
                ContWith<[
                    ...FRS, [FPrev, RPrev, RRPrev], [F, R2, RR],
                    [FNew, RNew, RRNew]
                ]> :
            // Return
            FofR extends [infer Result, true] ?
                // returns the result to the previous task
                RR extends undefined ?
                    ContWith<[
                        ...FRS, [FPrev, MR_WithResult<RPrev, Result>, RRPrev]
                    ]> :
                //@ts-expect-error
                APPLY1<RR, MR_WithResult<RPrev, Result>> extends infer Res ?
                    ContWith<[...FRS, [
                        FPrev,
                        Res,
                        RRPrev
                    ]]> :
                never :
            [
                Return<ERROR<["Unexpected return value from function", {
                    F: F, R: R, FofR: FofR
                }]>>
            ] :
        never :
    MRState extends [[infer F, infer R, infer RR]] ?    // only 1 task present
        //@ts-expect-error
        APPLY1<F, R> extends infer FofR ?
            // ContWith
            FofR extends [infer R2, false] ?
                ContWith<[[F, R2, RR]]> :
            // Call
            FofR extends [infer R2, infer FNew, infer RNew, infer RRNew] ?
                ContWith<[[F, R2, RR], [FNew, RNew, RRNew]]> :
            // Return
            FofR extends [infer Result, true] ?
                Return<Result> :
            [
                Return<ERROR<["Unexpected return value from function", {
                    F: F, Ret: FofR
                }]>>
            ] :
        never :
    Return<ERROR<"Internal error in MultiRecurse_int">>;
