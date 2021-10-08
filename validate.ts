/// <reference path="HOTypes.ts" />
/// <reference path="multi_recurse.ts" />
/// <reference path="eval_new.ts" />
/// <reference path="user_defs.ts" />

// Note: I'll use the terms `list` and `tuple` interchangeably.

type StrToType = {
    string: string;
    number: number;
    boolean: boolean;
};

type TypeFromPropName<K> = {
    [N in keyof StrToType]:
        K extends `${N}${infer U}` ? [N, StrToType[N]] : never
}[keyof StrToType];

type Validate<T extends {[K in string]: any}> = {
    // The validation rules you see below are arbitrary, of course, so feel
    // free to change them however you see fit!
    // 
    // Each `key: type` pair corresponds to a condition to check:
    //  if the condition is verified, type = never
    //  else type = ERROR<error msg>
    //       or a structure with at least one ERROR inside (see 'struct' rule)
    // The checks are performed for each key in T.
    //
    // Note: This pattern guarantees (well, kind of) that inference works well.
    //  If something goes wrong, the 'unknown' error will be raised.
    [K in keyof T]: {
        'unknown': unknown extends T[K] ? 'T[K] is UNKNOWN!!!' : never;
        'pro': T[K] extends 'PROHIBITED'
            ? ERROR<`\`${K extends string ? K : ''}\` can't be 'PROHIBITED'`>
            : never;
        'name': TypeFromPropName<K> extends [infer TypeName, infer Type]
            ? T[K] extends Type
                ? never
                : ERROR<`\`${K & string}\` must be a ${TypeName & string}`>
            : never;
        'type': K extends `'${infer K1}': ${infer Type}`
            ? T[K1] extends StrToType[Type & keyof StrToType]
                ? never
                : ERROR<`\`${K1}\` must be a ${Type}`>
            : never;
        'expr': K extends `#{${infer EXPR}}` ?
            EvalExpr<T, `bool (${EXPR})`> extends infer RES ?
                RES extends true ? never :
                RES extends false ?
                    ERROR<`The expression evaluates to false`> :
                RES :       // invalid expression: returns the error
            never : never;
        'same': K extends `'${infer K1}' = '${infer K2}'`
            ? EQU<T[K1], T[K2]> extends true
                ? never
                : ERROR<`\`${K1}\` and \`${K2}\` must be the same type`>
            : never;
        'struct': T[K] extends {type: `only ${infer TypeName}s`} & T[K]
            ? {
                [K2 in keyof T[K]]:
                    K2 extends 'type' ? T[K][K2] :
                    T[K][K2] extends StrToType[TypeName & keyof StrToType]
                        ? T[K][K2]
                    : ERROR<`\`${K2 & string}\` must be a ${TypeName}`>
            } extends infer A
                // Note: we could just return A, but it'd violate the pattern.
                ? ERROR<any> extends A[keyof A] ? A : never
                : never
            : never;
        'recur': T[K] extends {type: 'recurse'} & T[K]
            ? Validate<T[K]>       // the ONLY exception to the pattern
            : never;
    } extends infer E ?
        E[keyof E] extends never ?
            T[K]
        : E[keyof E]
    : never
}

function validate<T>(c: Validate<T>) {}

validate({
    // string*, number*, boolean* must be strings, numbers, and booleans, resp.
    string1: 'ok',
    string2: 'also ok',
    //@ts-expect-error
    string3: 123,               // ERROR<"`string3` must be a string">
    // 'PROHIBITED' is prohibited! (`as const` gives a literal type)
    //@ts-expect-error
    ko: 'PROHIBITED' as const,  // ERROR<"`ko` can't be 'PROHIBITED'">
    number43: 87,
    //@ts-expect-error
    number12: true,             // ERROR<"`number12` must be a number">
    // Note that the error is on the rule below but not on the property itself.
    // Showing the error on the property is doable but much slower.
    //@ts-expect-error
    "'QWERTY': string": 0,      // ERROR<"`QWERTY` must be a string">
    "'QWERTY2': string": 0,
    QWERTY: 9,
    QWERTY2: 'asdf',
    //@ts-expect-error
    "'asd': number": 0,         // ERROR<"`asd` must be a number">
    "'asd2': boolean": 0,
    asd: 'dfgdf',
    asd2: true,
    free: 'df',
    whatever: 8,
    //@ts-expect-error
    "'p1' = 'p2'": 0,           // ERROR<"`p1` and `p2` must be the same type">
    p1: 'ok',
    // p1: 9,
    p2: 68,
    a: {
        type: 'only numbers' as const,
        p1: 98,
        a: 4,
        b: 34,
        //@ts-expect-error
        c: 'dd',                // ERROR<"`c` must be a number">
        //@ts-expect-error
        d: true,                // ERROR<"`d` must be a number">
    },
    b: {
        x: 23,
        y: 'dg'
    },
    c: {
        type: 'only booleans' as const,
        f1: true,
        f2: false,
        f3: false,
        //@ts-expect-error
        f4: 3,                  // ERROR<"`f4` must be a boolean">
        f5: false,
        //@ts-expect-error
        f6: '123'               // ERROR<"`f6` must be a boolean">
    },
    r: {
        type: 'recurse' as const,
        //@ts-expect-error
        string_first: 98,           // ERROR<"`string_first` must be a string">
        string23: 'asdf',
        number__1: 23,
        //@ts-expect-error
        number__2: true,            // ERROR<"`number__2` must be a number">
        rec: {
            type: 'recurse' as const,
            "'c' = '2 5'": 0,
            as: 3,
            c: 'ababab' as const,
            //@ts-expect-error
            number4: true,              // ERROR<"`number4` must be a number">
            '2 5': 'ababab' as const,
            //@ts-expect-error
            "'var1': boolean": 0,       // ERROR<"`var1` must be a boolean">
            var1: 3
        }
    },
});

validate({
    // '#{'car' && ('my bike' ^ 'her bike')}': 0,
    "#{'car' && ('my bike' ^ 'her bike')}": 0,
    car: 7,                             // must be present
    'her bike': 'mine is better...',
    // 'my bike': 'oh, yeah!',          // one but not both!

    // Notes:
    // - Use '#{...expression...}'.
    // - the operator 'in' is user-defined!
    // - Without short-circuit evaluation, when `whiteList` or `blackList` are
    //   not present, the `in` operator would fail!
    //   One might obviate this by handling this case in the definition of `in`
    //   but this would be an error-prone ad-hoc solution.
    "#{!('whiteList' && !(*'name2' in *'whiteList'))}": 0,
    //@ts-expect-error
    "#{!('blackList' && (*'name1' in *'blackList'))}": 0,
    whiteList: ['Tizio', 'Caio', 'Maria'] as const,
    blackList: ['Jason Miller', 'Sandra Courtney', 'John Doe',
                'Pinco Pallino'] as const,

    name1: 'Pinco Pallino' as const,        // blacklisted: error :(
    name2: 'Maria' as const,                // whitelisted: OK!

    // && short-circuits!
    [`#{
        !('name3' && ('name3' in 'to_whiteList') &&
            !(*'name3' in 'whiteList'))
    }`]: 0,
    to_whiteList: ['name3', 'name4'] as const,
    
    name3: 'Tizio' as const,
});
