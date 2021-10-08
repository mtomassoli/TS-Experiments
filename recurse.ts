/// <reference path="HOTypes.ts" />
/// <reference path="misc.ts" />

type ContWith<R> = [R, false];
type Return<Value> = [Value, true];

// IMPORTANT:
// - Depth is mainly determined by the nesting of the `?:` operator.
//   That said, there still seems to be some kind of limit on recursive calls
//   and data structure complexity (nesting, length, etc...).
// - DO NOT test two or more variations together or CACHING may distort the
//   timings.

//------------------- 2-ary -------------------
type RecurseTree2<F extends FREE1, R, Depth extends number = 12> =
    Depth extends 0 ? APPLY1<F, R> :
    RecurseTree2<F, R, DecCount[Depth]> extends [infer R, infer Done] ?
        Done extends true ?
            [R, Done] :
        RecurseTree2<F, R, DecCount[Depth]> :
    never;

//-------------- 4-ary, cached ----------------
// Notes:
// - It's faster with `[0]` and `//@ts-expect-error`.
// - `//@ts-expect-error` is also hiding a spurious depth error.
// - Replace `[0]` with `extends [infer R, any] ? R : never` if you don't like
//   suppressing errors, but you'll incur an efficiency penalty.
type __Recurse2<F extends FREE1, R, Depth extends number> =
    //@ts-expect-error
    Recurse<F, Recurse<F, R, Depth>[0], Depth>;

// Notes: [same as above]
type __Recurse3<F extends FREE1, R, Depth extends number> =
    //@ts-expect-error
    Recurse<F, __Recurse2<F, R, Depth>[0], Depth>;

type Recurse<F extends FREE1, R, Depth extends number = 10> =
    Depth extends 0 ? APPLY1<F, R> :
    Recurse<F, R, DecCount[Depth]> extends [infer R, true] ?
        [R, true] :
    __Recurse2<F, R, DecCount[Depth]> extends [infer R, true] ?
        [R, true] :
    // Little trick to avoid using __Recurse4.
    __Recurse3<F, R, DecCount[Depth]> extends [infer R, false] ?
        Recurse<F, R, DecCount[Depth]> :
    __Recurse3<F, R, DecCount[Depth]>;

//-----------------------------------
type __RecurseDebug<F extends FREE1, RN extends [any, number],
                    Depth extends number> =
    Depth extends 0 ?
        APPLY1<F, RN[0]> extends [infer R, infer Done] ?
            [[R, DecCount[RN[1]]], Done] :
        never :
    __RecurseDebug<F, RN, DecCount[Depth]> extends [[infer R, infer N],
                                                    infer Done] ?
        Done extends true ? [[R, N], Done] :
        N extends 0 ? [[R, N], Done] :
        __RecurseDebug<F, [R, N & number], DecCount[Depth]> :
    never;

type RecurseDebug<F extends FREE1, R, Depth extends number,
                  Iters extends number> =
    Iters extends 0 ? [R, true] :
    __RecurseDebug<
            F, [R, Iters], Depth> extends [[infer R, number], infer Done] ?
        [R, Done] :
    never;

//-------------- 3-ary, cached ----------------
type RecurseTreeRes3C<F extends FREE1, R, Depth extends number> =
    RecurseTree3C<F, R, DecCount[Depth]> extends [infer R, any] ? R : never;

type RecurseTreeRes3C2<F extends FREE1, R, Depth extends number> =
    RecurseTree3C<F, RecurseTreeRes3C<F, R, Depth>,
                  DecCount[Depth]> extends [infer R, any] ? R : never;

type RecurseTree3C<F extends FREE1, R, Depth extends number> =
    Depth extends 0 ? APPLY1<F, R> :
    RecurseTree3C<F, R, DecCount[Depth]> extends [infer R, true] ?
        [R, true] :
    RecurseTree3C<F, RecurseTreeRes3C<F, R, Depth>,
                  DecCount[Depth]> extends [infer R, true] ?
        [R, true] :
    RecurseTree3C<F, RecurseTreeRes3C2<F, R, Depth>, DecCount[Depth]>

//---------- binary, cached, smarter ----------
type RecurseTree2CS<F extends FREE1, R, Depth extends number> =
    Depth extends 0 ? APPLY1<F, R> :
    RecurseTree2CS<F, R, DecCount[Depth]> extends [infer R, false] ?
        RecurseTree2CS<F, R, DecCount[Depth]> :
    RecurseTree2CS<F, R, DecCount[Depth]>;

//------------- binary, cached ----------------
type RecurseTreeRes2C<F extends FREE1, R, Depth extends number> =
    RecurseTree2C<F, R, Depth> extends [infer R, any] ? R : never

type RecurseTree2C<F extends FREE1, R, Depth extends number> =
    Depth extends 0 ? APPLY1<F, R> :
    RecurseTree2C<F, R, DecCount[Depth]> extends [infer R, true] ?
        [R, true] :
    RecurseTree2C<F, RecurseTreeRes2C<F, R, DecCount[Depth]>, DecCount[Depth]>;
//---------------------------------------------
