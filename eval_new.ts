// NOTE:
//  I use `//@ts-expect-error` to preserve Depth and for efficiency reasons.
//  When we know more than TS, there's no reason to waste resources just to
//  convince TS we know what we're doing.
//  For instance, a simple `T extends any[]` can double the time of execution
//  in extreme cases.

/// <reference path="HOTypes.ts" />
/// <reference path="misc.ts" />
/// <reference path="recurse.ts" />
/// <reference path="multi_recurse.ts" />

interface AllParsedExprs {}

interface Funcs1<T> {
    Test_Id:
        T extends 'true' ? true :
        T extends 'false' ? false :
        ERROR<"Invalid term">;
}

interface TestDeref {
    't': 'true',
    'f': 'false',
    'T': 'true',
    'F': 'false'
}

interface Funcs2<T1, T2> {
    'PREFIX1__test_*__':
        T2 extends keyof TestDeref ?
            TestDeref[T2 & keyof TestDeref] :
        ERROR<`test_*: unexpected argument \`${T2 & string}\``>;
}

interface Funcs3<T1, T2, T3> {
    'INFIX2__==__': EQU<T2, T3>;
}

// Distribute over T.
type All_Prefix1_Ops_int<T> = T extends `PREFIX1__${infer A}__` ? A : never;
type All_Infix2_Ops_int<T> = T extends `INFIX2__${infer A}__` ? A : never;
type All_Prefix3_Ops_int<T> = T extends `PREFIX3__${infer A}__` ? A : never;

type OpFullName<OPName> =
    `PREFIX1__${OPName & string}__` extends KEYOFF2 ?
        `PREFIX1__${OPName & string}__` :
    `INFIX2__${OPName & string}__` extends KEYOFF3 ?
        `INFIX2__${OPName & string}__` :
    `PREFIX3__${OPName & string}__` extends KEYOFF4 ?
        `PREFIX3__${OPName & string}__` :
    never;

type OpParseFullName<OPName> =
    `PREFIX1__${OPName & string}__PARSE` extends KEYOFF2 ?
        `PREFIX1__${OPName & string}__PARSE` :
    `INFIX2__${OPName & string}__PARSE` extends KEYOFF3 ?
        `INFIX2__${OPName & string}__PARSE` :
    `PREFIX3__${OPName & string}__PARSE` extends KEYOFF4 ?
        `PREFIX3__${OPName & string}__PARSE` :
    never;

// KEYOFF{N+1}: the +1 is for the additional CONTEXT argument
type All_Prefix1_Ops = All_Prefix1_Ops_int<KEYOFF2>;
type All_Infix2_Ops = All_Infix2_Ops_int<KEYOFF3>;
type All_Prefix3_Ops = All_Prefix3_Ops_int<KEYOFF4>;
type AllOps = All_Prefix1_Ops | All_Infix2_Ops | All_Prefix3_Ops;
type AllPrefixOps = All_Prefix1_Ops | All_Prefix3_Ops;

type ToBool<CONTEXT, T> =
    T extends boolean ? T :
    //@ts-expect-error
    T extends keyof CONTEXT['obj'] ? true : false;

interface Funcs2<T1, T2> {
    // T1 = CONTEXT
    PREFIX1__bool__:
        T2 extends boolean ? T2 :
        //@ts-expect-error
        T2 extends keyof T1['obj'] ? true : false;

    // T1 = CONTEXT
    'PREFIX1__!__':
        T2 extends true ? false :
        T2 extends false ? true :
        //@ts-expect-error
        T2 extends keyof T1['obj'] ? false : true;
}

interface Funcs3<T1, T2, T3> {
    // T1 = CONTEXT
    'INFIX2__^__':
        [ToBool<T1, T2>, ToBool<T1, T3>] extends (
            [true, false] | [false, true]
        ) ? true : false;
    
    // T1 = {'op', 'mem'}
    //@ts-expect-error
    'INFIX2__&&__PARSE': [T1['op'], T2, _EVAL_Skip<T3>];

    // T1 = CONTEXT
    'INFIX2__&&__': ToBool<T1, T2> extends true ? UnskipValue<T3> : T2;

    // T1 = {'op', 'mem'}
    //@ts-expect-error
    'INFIX2__||__PARSE': [T1['op'], T2, _EVAL_Skip<T3>];

    // T1 = CONTEXT
    'INFIX2__||__': ToBool<T1, T2> extends true ? T2 : UnskipValue<T3>;
}

type TEST_OPFN_1 = AssertTrue<EQU<OpFullName<'bool'>, 'PREFIX1__bool__'>>;
type TEST_OPFN_2 = AssertTrue<EQU<OpFullName<'^'>, 'INFIX2__^__'>>;

type TOKEN_ERROR<MSG, EXPR, TOKENS> = ERROR<{
    type: 'TOKEN ERROR', msg: MSG, expr: EXPR, tokens: TOKENS;
}>;
type PARSE_ERROR<MSG, TOKENS, STACK, MEM> = ERROR<{
    type: 'PARSE ERROR', msg: MSG, tokens: TOKENS, stack: STACK, memory: MEM;
}>;
type EVAL_ERROR<MSG, STACK, MEM> = ERROR<{
    type: 'EVAL ERROR', msg: MSG, stack: STACK, memory: MEM;
}>;

type _EVAL_Space = ' '|'\n'|'\r';
type _EVAL_Delimiter = _EVAL_Space|"'"|'('|'{';

class _EVAL_Operand<OPND> {#a: OPND};
class _EVAL_Prefix1_Op<OP> {#a: OP};
class _EVAL_Infix2_Op<OP> {#a: OP};
class _EVAL_Prefix3_Op<OP> {#a: OP};
class _EVAL_SubExpr<SE> {#a: SE};
type _EVAL_Operator<OP> =
    _EVAL_Prefix1_Op<OP> | _EVAL_Infix2_Op<OP> | _EVAL_Prefix3_Op<OP>;

type _EVAL_Op<OP> =
    OP extends All_Prefix1_Ops ? _EVAL_Prefix1_Op<OP> :
    OP extends All_Infix2_Ops ? _EVAL_Infix2_Op<OP> :
    OP extends All_Prefix3_Ops ? _EVAL_Prefix3_Op<OP> :
    ERROR<`Unknown OP \`${OP & string}\``>;

type EVAL_TOKENIZE<E extends string, Tokens extends any[] = []> =
    E extends `${'{'|'}'|'('|')'}${infer E2}` ?
        E extends `${infer Token}${E2}` ?
            ContWith<[E2, [...Tokens, Token]]> :
        never :
    E extends `${_EVAL_Space}${infer E2}` ?
        ContWith<[E2, Tokens]> :
    E extends `'${infer T}'${infer E2}` ?
        ContWith<[E2, [...Tokens, _EVAL_Operand<T>]]> :

    // First look for an operator followed by a proper delimiter, so that,
    // for example, in case both `&` and `&&` are valid operators,
    //      'a' && 'b'            (delimiter = space)
    // is tokenized as ['a', &&, 'b'] instead of ['a', &, &, 'b'].
    E extends `${AllOps}${_EVAL_Delimiter}${infer E2}` ?
        E extends `${infer OP}${_EVAL_Delimiter}${E2}` ?
            E extends `${OP}${infer E2}` ?
                ContWith<[`${E2}`, [...Tokens, _EVAL_Op<OP>]]> :
            never :
        never :

    // Now look for an operator followed by another one (which can only be a
    // prefix operator, obviously) so that, for example, one can write
    //      !*v'x' && !!'x'
    // instead of
    //      ! * v'x' && ! !'x'
    E extends `${AllOps}${AllPrefixOps}${infer E2}` ?
        E extends `${infer OP}${AllPrefixOps}${E2}` ?
            E extends `${OP}${infer E2}` ?
                ContWith<[`${E2}`, [...Tokens, _EVAL_Op<OP>]]> :
            never :
        never :

    E extends '' ?
        Return<Tokens> :
    Return<TOKEN_ERROR<"Can't tokenize the remaining expression", E, Tokens>>;

type _EVAL_Op_Str<OP> =
    OP extends All_Prefix1_Ops ? `PREFIX1:${OP}` :
    OP extends All_Infix2_Ops ? `INFIX2:${OP}` :
    OP extends All_Prefix3_Ops ? `PREFIX3:${OP}` :
    'OP:UNKNOWN';

// NOTE:
//  EVAL_TOKENIZE2 would be much faster because it only works with literals.
//  I'll leave it here but I won't pursue this any further.

// type TOKEN_DELIM = 'so29&%zkr/(52';
type TOKEN_DELIM = 'ቅ';

type EVAL_TOKENIZE2<E extends string, Tokens extends string = ''> =
    E extends `${'{'|'}'|'('|')'}${infer E2}` ?
        E extends `${infer Token}${E2}` ?
            ContWith<[E2, `${Tokens}${Token}${TOKEN_DELIM}`]> :
        never :
    E extends `${_EVAL_Space}${infer E2}` ?
        ContWith<[E2, Tokens]> :
    E extends `'${infer T}'${infer E2}` ?
        ContWith<[E2, `${Tokens}OPND:${T}${TOKEN_DELIM}`]> :
    E extends `${AllOps}${_EVAL_Delimiter}${infer E2}` ?
        E extends `${infer OP}${_EVAL_Delimiter}${E2}` ?
            E extends `${OP}${infer Delim}${E2}` ?
                ContWith<[
                    `${Delim}${E2}`,
                    `${Tokens}${_EVAL_Op_Str<OP>}${TOKEN_DELIM}`
                ]> :
            never :
        never :
    E extends '' ?
        Return<Tokens> :
    Return<TOKEN_ERROR<"Can't tokenize the remaining expression", E, Tokens>>;

class _EVAL_Operation<OPN_DATA> {#a: 0; OPN_DATA: OPN_DATA};
class _EVAL_OperationPtr<OPN_PTR> {#a: 0; OPN_PTR: OPN_PTR};

type GetOpnPtrPtr<OPN> =
    OPN extends _EVAL_OperationPtr<infer OPN_PTR> ? OPN_PTR : never;

type ReadFromMem<CTX extends _EVAL_CONTEXT<any, any, any>, Ptr> =
    CTX['expr'][Ptr & number];

type NewFreeParseMem = [];
type StoreIntoParseMem<MEM extends any[], Value> =
    [[...MEM, Value], MEM['length']];
type ReadFromParseMem<MEM extends any[], Ptr> = MEM[Ptr & number];

// NOTE:
//  All operators are left-associative and one has to use round parentheses to
//  change the order of evaluation.
type EVAL_PARSE<Tokens extends any[], S extends any[], MEM extends any[]> =
    // If an operator returns an ERROR, we return it immediately.
    MEM extends [...any[], ERROR<infer Msg>] ?
        Return<PARSE_ERROR<Msg, Tokens, S, MEM>> :
    S extends [
        ...infer S2, _EVAL_Prefix1_Op<infer OP>, _EVAL_Operand<infer OPND>
    ] ?
        StoreIntoParseMem<MEM,
            `PREFIX1__${OP & string}__PARSE` extends KEYOFF2 ?
                APPLY2<
                    `PREFIX1__${OP & string}__PARSE` & KEYOFF2,
                    {op: `PREFIX1__${OP & string}__`, mem: MEM},
                    OPND
                > :
            [`PREFIX1__${OP & string}__`, OPND]
        > extends [infer MEM2, infer OPN_PTR] ?
            ContWith<[
                Tokens, [...S2, _EVAL_Operand<_EVAL_OperationPtr<OPN_PTR>>],
                MEM2
            ]> :
        never :
    S extends [
        ...infer S2, _EVAL_Operand<infer OPND1>, _EVAL_Infix2_Op<infer OP>,
        _EVAL_Operand<infer OPND2>
    ] ?
        StoreIntoParseMem<MEM,
            `INFIX2__${OP & string}__PARSE` extends KEYOFF3 ?
                APPLY3<
                    `INFIX2__${OP & string}__PARSE` & KEYOFF3,
                    {op: `INFIX2__${OP & string}__`, mem: MEM}, OPND1, OPND2
                > :
            [`INFIX2__${OP & string}__`, OPND1, OPND2]
        > extends [infer MEM2, infer OPN_PTR] ?
            ContWith<[
                Tokens, [...S2, _EVAL_Operand<_EVAL_OperationPtr<OPN_PTR>>],
                MEM2
            ]> :
        never :
    S extends [
        ...infer S2, _EVAL_Prefix3_Op<infer OP>, _EVAL_Operand<infer OPND1>,
        _EVAL_Operand<infer OPND2>, _EVAL_Operand<infer OPND3>
    ] ?
        StoreIntoParseMem<MEM,
            `PREFIX3__${OP & string}__PARSE` extends KEYOFF4 ?
                APPLY4<
                    `PREFIX3__${OP & string}__PARSE` & KEYOFF4,
                    {op: `PREFIX3__${OP & string}__`, mem: MEM},
                    OPND1, OPND2, OPND3
                > :
            [`PREFIX3__${OP & string}__`, OPND1, OPND2, OPND3]
        > extends [infer MEM2, infer OPN_PTR] ?
            ContWith<[
                Tokens, [...S2, _EVAL_Operand<_EVAL_OperationPtr<OPN_PTR>>],
                MEM2
            ]> :
        never :
    Tokens extends [
        SubType<infer T, _EVAL_Operator<any> | _EVAL_Operand<any>> | '(' | '{',
        ...infer Tokens2
    ] ?
        ContWith<[Tokens2, [...S, T], MEM]> :
    Tokens extends [')', ...infer Tokens2] ?
        S extends [...infer S2, '(', infer T] ?
            ContWith<[Tokens2, [...S2, T], MEM]> :
        Return<PARSE_ERROR<"Unexpected ')' parenthesis", Tokens, S, MEM>> :
    Tokens extends ['}', ...infer Tokens2] ?
        S extends [...infer S2, '{', _EVAL_Operand<infer OPND>] ?
            ContWith<[
                Tokens2, [...S2, _EVAL_Operand<_EVAL_SubExpr<OPND>>], MEM
            ]> :
        Return<PARSE_ERROR<"Unexpected '}' parenthesis", Tokens, S, MEM>> :
    Tokens extends [] ?
        S extends [_EVAL_Operand<_EVAL_OperationPtr<infer OPN_PTR>>] ?
            Return<[_EVAL_Operation<ReadFromParseMem<MEM, OPN_PTR>>, MEM]> :
        S extends [_EVAL_Operand<infer OPND>] ?
            Return<[OPND, MEM]> :
        Return<PARSE_ERROR<"Malformed expression", Tokens, S, MEM>> :
    Return<PARSE_ERROR<"Can't parse the remaining tokens", Tokens, S, MEM>>;

class _EVAL_Skip<T> {#a: T; T: T};
//@ts-expect-error
type UnskipValue<T> = T['T'];

class _EVAL_Call<F, R> {#a: 0; F: F; R: R};

// F returned by GetFR is a step function (see MCall).
type _EVAL_MCall<GetFR, GetFR_R, Vals> = _EVAL_Call<
    '__MR_Map', [GetFR, GetFR_R, Vals, []]
>;

// F returned by GetFR is a regular (i.e. mono-step) function (see MCall1).
type _EVAL_MCall1<GetFR, GetFR_R, Vals> = _EVAL_Call<
    '__MR_Map1', [GetFR, GetFR_R, Vals, []]
>;

// F returned by GetFR is a step function (see FMCall).
type _EVAL_FMCall<GetFR, GetFR_R, Vals> = _EVAL_Call<
    '__MR_FlatMap', [GetFR, GetFR_R, Vals, []]
>;

// F returned by GetFR is a regular (i.e. mono-step) function (see FMCall1).
type _EVAL_FMCall1<GetFR, GetFR_R, Vals> = _EVAL_Call<
    '__MR_FlatMap1', [GetFR, GetFR_R, Vals, []]
>;

type _EVAL_CONTEXT<OBJ, ENV, EXPR> = {
    obj: OBJ, env: ENV, expr: EXPR
};

// NOTES:
// - It assumes operators have 3 args at most.
type EVAL_EVAL<CONTEXT extends _EVAL_CONTEXT<any, any, any>, S extends any[]> =
    // If an operator returns an ERROR, we return it immediately.
    S extends [...any[], ERROR<infer Msg>] ?
        Return<ERROR<Msg>> :

    S extends [...infer S2, _EVAL_OperationPtr<infer OPN_PTR>] ?
        ContWith<[
            CONTEXT, [...S2, _EVAL_Operation<ReadFromMem<CONTEXT, OPN_PTR>>]
        ]> :

    // If an argument to the current operation needs to be evaluated, we
    // extract it and append it to S.
    S extends [
        ...any[],
        _EVAL_Operation<[any, _EVAL_OperationPtr<infer OPN_PTR>, ...any[]]>
    ] ? ContWith<[
            CONTEXT, [...S, _EVAL_Operation<ReadFromMem<CONTEXT, OPN_PTR>>]
        ]> :
    S extends [
        ...any[],
        _EVAL_Operation<[
            any, any, _EVAL_OperationPtr<infer OPN_PTR>, ...any[]
        ]>
    ] ?
        ContWith<[
            CONTEXT, [...S, _EVAL_Operation<ReadFromMem<CONTEXT, OPN_PTR>>]
        ]> :
    S extends [
        ...any[],
        _EVAL_Operation<[any, any, any, _EVAL_OperationPtr<infer OPN_PTR>]>
    ] ?
        ContWith<[
            CONTEXT, [...S, _EVAL_Operation<ReadFromMem<CONTEXT, OPN_PTR>>]
        ]> :

    // If an argument has just been evaluted, we put it back into the operation
    // it comes from (which is the operation right before it).
    S extends [
        ...infer S2,
        _EVAL_Operation<[
            infer OP, _EVAL_OperationPtr<any>, ...infer OPNDS
        ]>,
        NotSubType<infer Value, _EVAL_Operation<any>>
    ] ?
        ContWith<[CONTEXT, [...S2, _EVAL_Operation<[OP, Value, ...OPNDS]>]]> :
    S extends [
        ...infer S2,
        _EVAL_Operation<[
            infer OP, infer OPND1, _EVAL_OperationPtr<any>, ...infer OPNDS
        ]>,
        NotSubType<infer Value, _EVAL_Operation<any>>
    ] ?
        ContWith<[
            CONTEXT, [...S2, _EVAL_Operation<[OP, OPND1, Value, ...OPNDS]>],
        ]> :
    S extends [
        ...infer S2,
        _EVAL_Operation<[
            infer OP, infer OPND1, infer OPND2, _EVAL_OperationPtr<any>
        ]>,
        NotSubType<infer Value, _EVAL_Operation<any>>
    ] ?
        ContWith<[
            CONTEXT, [...S2, _EVAL_Operation<[OP, OPND1, OPND2, Value]>]
        ]> :

    // If the last term is an operation, then it must be ready to be executed
    // or we wouldn't be here.
    S extends [...infer S2, _EVAL_Operation<[infer OP, infer T1]>] ?
        // Note: this exploits caching.
        APPLY2<
            TypeCast<OP, FREE2>, CONTEXT, T1
        > extends _EVAL_Call<infer F, infer R> ?
            // the result will be added by '__Eval_Res'
            Call<[CONTEXT, S2], F, R, '__Eval_Res'> :
        APPLY2<
            TypeCast<OP, FREE2>, CONTEXT, T1
        > extends ERROR<infer ErrMsg> ?
            Return<EVAL_ERROR<ErrMsg, S, CONTEXT>> :
        ContWith<[
            CONTEXT, [...S2, APPLY2<TypeCast<OP, FREE2>, CONTEXT, T1>]
        ]> :
    S extends [...infer S2, _EVAL_Operation<[infer OP, infer T1, infer T2]>] ?
        // Note: this exploits caching.
        APPLY3<
            TypeCast<OP, FREE3>, CONTEXT, T1, T2
        > extends _EVAL_Call<infer F, infer R> ?
            // the result will be added by '__Eval_Res'
            Call<[CONTEXT, S2], F, R, '__Eval_Res'> :
        APPLY3<
            TypeCast<OP, FREE3>, CONTEXT, T1, T2
        > extends ERROR<infer ErrMsg> ?
            Return<EVAL_ERROR<ErrMsg, S, CONTEXT>> :
        ContWith<[
            CONTEXT, [...S2, APPLY3<TypeCast<OP, FREE3>, CONTEXT, T1, T2>]
        ]> :
    S extends [
        ...infer S2, _EVAL_Operation<[infer OP, infer T1, infer T2, infer T3]>
    ] ?
        // Note: this exploits caching.
        APPLY4<
            TypeCast<OP, FREE4>, CONTEXT, T1, T2, T3
        > extends _EVAL_Call<infer F, infer R> ?
            // the result will be added by '__Eval_Res'
            Call<[CONTEXT, S2], F, R, '__Eval_Res'> :
        APPLY4<
            TypeCast<OP, FREE4>, CONTEXT, T1, T2, T3
        > extends ERROR<infer ErrMsg> ?
            Return<EVAL_ERROR<ErrMsg, S, CONTEXT>> :
        ContWith<[
            CONTEXT, [...S2, APPLY4<TypeCast<OP, FREE4>, CONTEXT, T1, T2, T3>]
        ]> :

    // If there's only one value, we're done!
    S extends [infer Value] ? Return<Value> :
    Return<EVAL_ERROR<'Unexpected Error in EVAL_EVAL', S, CONTEXT>>;

type Eval_Tokenize<Expr extends string, D extends number = 10> =
    Recurse<'Tokenize', [Expr, []], D> extends [infer R, any] ? R :
    never;

type Eval_Parse<Tokens, D extends number = 10> =
    Recurse<
        'Parse', [Tokens, [], NewFreeParseMem], D
    > extends [infer R, any] ? R : never;

type Eval_Eval<Context, S, D extends number = 10> =
    MultiRecurse<
        [['Eval', [Context, S], undefined]], D
    > extends [infer R, any] ? R : never;

type Eval_Eval2<Context, S, D extends number = 10> =
    MultiRecurseTree2<
        [['Eval', [Context, S], undefined]], D
    > extends [infer R, any] ? R : never;

type Eval_Eval_Debug<Context, S, N extends number, D extends number = 10> =
    MultiRecurseDebug<
        [['Eval', [Context, S], undefined]], D, N
    > extends [infer R, any] ? R : never;

type Eval_Single_Eval<Context, S, D extends number = 10> =
    Recurse<'Eval', [Context, S], D> extends [infer R, any] ? R : never;

type Eval_Single_Eval_Debug<
    Context, S, N extends number, D extends number = 10
> = RecurseDebug<'Eval', [Context, S], D, N> extends [infer R, any] ? R : never

type ParseExpr<Expr extends string> =
    Eval_Tokenize<Expr> extends infer TOK ?
        TOK extends TOKEN_ERROR<any, any, any> ?
            TOK :
        Eval_Parse<TOK> :
    never;

type EvalExpr<Obj, Expr extends string, D extends number = 10> =
    Eval_Tokenize<Expr> extends infer TOK ?
        TOK extends TOKEN_ERROR<any, any, any> ?
            TOK :
        Eval_Parse<TOK> extends infer PAR ?
            PAR extends PARSE_ERROR<any, any, any, any> ?
                PAR :
            //@ts-expect-error
            Eval_Eval<_EVAL_CONTEXT<Obj, {}, PAR[1]>, [PAR[0]], D> :
        never :
    never;

type EvalExpr2<Obj, Expr extends string, D extends number = 10> =
    Eval_Tokenize<Expr> extends infer TOK ?
        TOK extends TOKEN_ERROR<any, any, any> ?
            TOK :
        Eval_Parse<TOK> extends infer PAR ?
            PAR extends PARSE_ERROR<any, any, any, any> ?
                PAR :
            //@ts-expect-error
            Eval_Eval2<_EVAL_CONTEXT<Obj, {}, PAR[1]>, [PAR[0]], D> :
        never :
    never;

interface Funcs1<T> {
    //@ts-expect-error
    Tokenize: EVAL_TOKENIZE<T[0], T[1]>;
    //@ts-expect-error
    Parse: EVAL_PARSE<T[0], T[1], T[2]>;
    //@ts-expect-error
    Eval: EVAL_EVAL<T[0], T[1]>;

    // Receives the results (one at a time) from functions called by `Eval`.
    __Eval_Res:
        T extends MR_WithResult<[infer CONTEXT, infer S], infer Result> ?
            //@ts-expect-error
            [CONTEXT, [...S, Result]] :
        never;

    //@ts-expect-error
    Tokenize2: EVAL_TOKENIZE2<T[0], T[1]>;
}

type ErrMsg<Error extends ERROR<{type: string; msg: string}>> =
    Error extends ERROR<{type: infer Type; msg: infer Msg}> ?
        `${Type & string}: ${Msg & string}` :
    "ErrMsg: Can't read the error!";

type _EvalExpr<Expr extends string, D extends number = 10> =
    EvalExpr<{true: 0}, Expr, D>;

type _EvalBoolExpr<Expr extends string, D extends number = 10> =
    EvalExpr<{true: 0}, `bool (${Expr})`, D>;
