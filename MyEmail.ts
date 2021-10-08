type From = 'tjklmab89cghiopz@.0167qrsuv234ndefwxy5';
type To = 'nq@cdiklmj.rs0aopbyz12tuvefghw4567x389';

type _TransC<LFrom, LTo, C extends string> =
    [LFrom, LTo] extends [
        `${infer S1}${infer LF2}`, `${infer S2}${infer LT2}`
    ] ? S1 extends C ? [S2, true] : [[LF2, LT2, C], false] : never;

type TransC<LFrom, LTo, C, L extends any[] = []> =
    L['length'] extends 7 ? _TransC<LFrom, LTo, C & string> :
    TransC<LFrom, LTo, C, [...L, any]> extends [
        [infer LF2, infer LT2, any], false
    ] ?
        TransC<LF2, LT2, C, [...L, any]> :
    TransC<LFrom, LTo, C, [...L, any]> extends [infer R, infer Done] ?
        L extends [] ? R : [R, Done] :
    never;

type TransS<LFrom, LTo, S extends string> = 
    S extends '' ? '' :
    S extends `${infer C}${infer S2}` ?
        `${TransC<LFrom, LTo, TransC<
            LFrom, LTo, TransC<LFrom, LTo, C>
        >> & string}${TransS<LFrom, LTo, S2>}` :
    never;

type MyEmail = TransS<From, To, "g@3wjd14.zkw667@c">;
