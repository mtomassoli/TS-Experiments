/// <reference path="recurse.ts" />

interface Funcs1<T> {
    GetLast:
        T extends [infer Head, ...infer Tail] ?
            Tail extends [] ? [Head, true] : [Tail, false] :
        never;
}

// type SmallList = [
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     2
// ];

// -------------- Commented because SLOW! Uncomment to test. --------------
// type __BigList = [
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//     1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
// ];
// type __BigList2 = [...__BigList, ...__BigList];
// type __BigList3 = [...__BigList2, ...__BigList2];
// type __BigList4 = [...__BigList3, ...__BigList3];
// type __BigList5 = [...__BigList4, ...__BigList4];
// type BigList = [...__BigList5, ...__BigList5, 2];       // 2497 elements

// type RECURSE_TEST1 = Recurse<'GetLast', BigList, 41>;
//-------------------------------------------------------------------------

interface Funcs1<T> {
    //@ts-expect-error
    BinaryCount_STEP: BinaryCount_STEP<T[0], T[1], T[2]>;
}

type BinaryCount_STEP<
    NumDigits extends number,
    Digits extends number[],
    FillingPhase extends boolean
> =
    FillingPhase extends true ?
        Digits['length'] extends NumDigits ?
            ContWith<[NumDigits, Digits, false]> :
        ContWith<[NumDigits, [...Digits, 0], true]> :
    Digits extends [] ?
        Return<'All done!'> :
    Digits extends [...infer DS, 0] ?
        ContWith<[NumDigits, [...DS, 1], true]> :
    Digits extends [...infer DS, 1] ?
        ContWith<[NumDigits, DS, false]> :
    Return<'Internal error!'>;

type RECURSE_TEST2_DEB1 = RecurseDebug<
    'BinaryCount_STEP', [3, [], true], 4,
    10          // step num (up to 100, for now)
>;

// -------------- Commented because SLOW! Uncomment to test. --------------
// // At least 2^15 = 32768 cycles without failing!
// type RECURSE_TEST2 = RecurseTree2CS<
//     'BinaryCount_STEP', [14, [], true], 15
// >;
//-------------------------------------------------------------------------
