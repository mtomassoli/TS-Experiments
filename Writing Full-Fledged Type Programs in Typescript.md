# Introduction

As I'm writing this, `npm show typescript` shows the following versions:

    beta:       4.5.0-beta
    insiders:   4.4.1-insiders.20210811
    next:       4.5.0-dev.20211003
    dev:        3.9.4
    latest:     4.4.3
    rc:         4.4.1-rc

***IMPORTANT:*** *I'm using version* ***4.4.3***.

Typescript uses some heuristics to see when type instantiation is possibly infinite. For instance, this works:

```ts
type ZeroList<N extends number, List extends any[] = []> =
    List['length'] extends N ? List : ZeroList<N, [...List, 0]>;

type Test = ZeroList<45>;
```

But if we replace `45` with `46` or more, we get the following error:

    Type instantiation is excessively deep and possibly infinite. ts(2589)

[Version 4.5](https://devblogs.microsoft.com/typescript/announcing-typescript-4-5-beta/#tailrec-conditional) will remove this limitation.

## Main goals

I want to show 3 things:
1. By removing the depth limitation, the language becomes easier to use, but not technically more powerful.
2. We can write pretty complex compile-time programs using type programming.
3. Data-related depth and nesting is also a problem.

# An Extensible Expression Evaluator

I started with some (weird) experiments about data validation (see `validate.ts`) which led me to implementing an *extensible expression evaluator*. Keep in mind that *we're still limited to just 50 or so recursive type instantiations*.

***The following was tested with version 4.4.3 which comes with version 1.60.2 of Visual Studio Code.***

## Setup

In *Visual Studio Code* (VSC) you can see the type of a term by hovering over it, but the text has a limit of 160 characters. I suggest that you increase that number to at least 20000. If you're using VSC, you can just edit the file `tsserver.js` located in

    ...\Microsoft VS Code\resources\app\extensions\node_modules\typescript\lib

(at least on Windows).

Search for `ts.defaultMaximumTruncationLength`. You should see 

    ts.defaultMaximumTruncationLength = 160;

Change the value as you see fit. Remember that you'll have to reedit the file every time VSC updates.

## Playing with the expression evaluator

Here's an example:

```ts
type SAMPLE_OBJ = {
    rec: 'rec';
    car: 'a car';
    tree: 'a tree';
    Tim: 'ok';
    whiteList: ['Tim', 'John', 'Luke', 'Luca', 'Stefano', 'Doe', 'Smith'];
    ifStartsWith: ['name', 'surname'];
    name1: 'Tim';
    name2: 'John';
    name3: 'Luca';
    name4: 'Luke';
    name5: 'Stefano';
    // name_invalid: 'Stephen';
    surname1: 'Doe';
    surname2: 'Smith';
    // surname_invalid: 'Rossi';
};

type SAMPLE_TEST = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                call('StartsWith', v'start', v'key')
            }) reduce 'any'
        ) else call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;
```

`EvalExpr` evaluates an expression against an object.

***Note:*** *You can find these simple examples in the file `examples.ts`. I'm writing it as I write this section.*

## A step back

Let's start with something simple:

```ts
type SAMPLE_TEST2 = EvalExpr<SAMPLE_OBJ, `
    bool 'rec'
`>;
```

We put *operands* between single quotation marks and everything, if properly defined, is considered an *operator*. I added the support for three types of operators:

* **PREFIX1**: *op* ARG1
* **INFIX2**: ARG1 *op* ARG2
* **PREFIX3**: *op* ARG1 ARG2 ARG3

It's very easy to extend the list, but I only added the ones I needed.

The `bool` operator, a PREFIX1 op, returns true iff its argument is a key in the object passed to `EvalExpr`.

In the example above, `rec` is present in the object so the expression evaluates to true.

The usual logical operators are also available:

```ts
type SAMPLE_TEST3 = EvalExpr<SAMPLE_OBJ, `
    bool (('car' && 'Tim' && 'tree') || 'name5')
`>;
```

Without `bool`, the expression above returns `tree`, so we can use tricks such as 

```ts
type SAMPLE_TEST4 = EvalExpr<SAMPLE_OBJ, `
    'truck' || '"Truck" not present'
`>;
```

Adding `bool` each time is annoying so we could write something like this:

```ts
type EvalBoolExpr<Obj, Expr> = EvalExpr<Obj, `bool (${Expr & string})`>;

type SAMPLE_TEST5 = EvalBoolExpr<SAMPLE_OBJ, `
    ('car' && 'Tim' && 'tree') || 'name5'
`>;
```

One limitation is that all the operators are *left-associative*. User-defined associativity shouldn't be too hard to add, but I had to draw the line somewhere.

By the way, my first implementation was a monolithic beast that evaluated the expression all in one pass, but now I use separate passes for *Tokenization*, *Parsing* and *Evaluation*. I must admit the monolithic beast had a few tricks up its sleeve. For instance, the `if` operator was implementable as three unary operators (`if`, `then`, and `else`) and the use of micro operations injected onto the stack. I admit I was tempted to add a *Code Generation* phase, but I resisted the urge.

## Adding new operators

If you don't like `&&` and `||`, and prefer `and` and `or` instead, you can just define them:

```ts
interface Funcs3<T1, T2, T3> {
    // T1 = {'op', 'mem'}
    INFIX2__and__PARSE: ['INFIX2__&&__', _EVAL_Skip<T2>, _EVAL_Skip<T3>];
    INFIX2__and__: 0;           // does nothing

    // T1 = {'op', 'mem'}
    INFIX2__or__PARSE: ['INFIX2__||__', _EVAL_Skip<T2>, _EVAL_Skip<T3>];
    INFIX2__or__: 0;            // does nothing
}

type SAMPLE_TEST6 = EvalExpr<SAMPLE_OBJ, `
    ('car' and 'Tim' and 'tree') or 'name5'
`>;
```

We cheated a little as we left the heavy lifting to the original operators `&&` and `||`.

Note that `TYPE__opName__` acts at *evaluation time*, whereas `TYPE__opName__PARSE` at *parsing time*. The former is always necessary to *register* the operator. The latter is optional.

In this example, we modify the *AST* (*Abstract Syntax Tree*) by replacing

    ['INFIX2__and__', _EVAL_Skip<T2>, _EVAL_Skip<T3>]

with

    ['INFIX2__&&__', _EVAL_Skip<T2>, _EVAL_Skip<T3>]

`_EVAL_Skip` is a wrapper used to skip the evaluation of some operands. This is useful to implement *short-circuit evaluation* in `&&` and `||`, and skip entire branches in `if...then...else` and `...?...:...` operators.

Here's how the default logical operators are defined, in case you're wondering:

```ts
interface Funcs3<T1, T2, T3> {
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
```

Note that instead of doing redundant type casting, I simply suppress the errors by using the directive `//@ts-expect-error`. This is mainly for efficiency reasons and sometimes for better readability (at least with syntax highlighting). I don't use `//@ts-ignore` because I want to know when things change, at least during development.

By the way, if you read my article about *Higher Order Types* (see the homonymous md file), the interface I used above should look familiar to you. That's right: the operators are handled using the HOT machinery I previously implemented.

In order to reduce any depth wastage, I've optimized my HOT implementation considerably since the article.

Back to the logical operators. Let's only consider the `&&` operator. The original AST contains

    ['INFIX2__&&__', T2, T3]

but, during evaluation, that would evaluate both operands before passing them to the operator. To avoid this, we replace it with

    ['INFIX2__&&__', T2, _EVAL_Skip<T3>]

which skips the evaluation of the second operand. The first operand is *always* evaluated.

At *evaluation time*, `INFIX2__&&__` is called and it does the following:

1. Convert ARG1 to bool.
2. If ARG1 is true then return ARG2 without the Skip wrapper so that it's going to be evaluated.
3. If ARG1 is false then return it (and ignore ARG2 completely!)

Note that, in general, this evaluation process can go on as long as we want: the evaluation will continue as long as the operation is not reduced to a final term.

## Back to the original expression

Here it is again:

```ts
type SAMPLE_TEST = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                call('StartsWith', v'start', v'key')
            }) reduce 'any'
        ) else call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;
```

This is quite complicated. Let me break it down for you.

`$'KEYS'` returns the list of KEYS in the object.

```ts
type SAMPLE_TEST7 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS'
`>;
```

This evaluates to

    [
        "rec", "car", "tree", "Tim", "whiteList",
        "ifStartsWith", "name1", "name2", "name3",
        "name4", "name5", "surname1", "surname2"
    ]

as one would expect. Well, one would expect a *union*... More of this later, but it's nothing too important.

The operator `=>` introduces an anonymous function, and `map` and `filter` do what you think.

For instance,

```ts
interface Funcs1<T> {
    WrapInUnderscores: `_${T & string}_`;
}

type SAMPLE_TEST8 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('x' => {
        call('WrapInUnderscores', 
            call('WrapInUnderscores', v'x')
        )
    })
`>;
```

evaluates to

    [
        "__rec__", "__Tim__", "__car__", "__tree__",
        "__whiteList__", "__ifStartsWith__", "__name1__",
        "__name2__", "__name3__", "__name4__",
        "__name5__", "__surname1__", "__surname2__"
    ]

and

```ts
interface Funcs3<T1, T2, T3> {
    INFIX2__startsWith__: T2 extends `${T3 & string}${any}` ? true : false;
}

type SAMPLE_TEST9 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' filter ('x' => {
        v'x' startsWith 'name'
    })
`>;
```

evaluates to

    ["name1", "name2", "name3", "name4", "name5"]

The `v` PREFIX1 operator is used to access the *variable* (or *argument*) with the given name.

`reduce` should also be obvious:

```ts
// true
type SAMPLE_TEST10 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('x' => {
        v'x' startsWith 'name'
    }) reduce 'any'
`>;

// false
type SAMPLE_TEST11 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('x' => {
        v'x' startsWith 'name'
    }) reduce 'all'
`>;
```

We can also use functions directly, by the way:

```ts
type SAMPLE_TEST12 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('StartsWithThis' bind 'name')
            reduce 'any'
`>;
```

The definition of `bind` is just this:

```ts
interface Funcs3<T1, T2, T3> {
    // T2 = FREE with at least 2 missing arguments
    // T3 = argument to bind
    INFIX2__bind__:
        T2 extends FREE_FROM2 ? BIND1<T2, T3> :
    ERROR<["LHS operand not supported by `bind`. Operands: ", T2, T3]>;
}
```

`BIND1` is from my HOTs.

Yes, errors are also supported, as you can deduce from the code above. Let's trigger it:

```ts
// [
//    "LHS operand not supported by `bind`. Operands: ",
//    "StarXXXXXtsWithThis", "name"
// ]
type SAMPLE_TEST13 = EvalExpr<SAMPLE_OBJ, `
    $'KEYS' map ('StarXXXXXtsWithThis' bind 'name')
            reduce 'any'
`>;
```

Note that the operands are not included directly into the error text message because, in case of an unexpected error, they might not be strings and we would lose valuable debugging information.

The operator `*` is simply used to get the *value* associated with a *key* in the object. The operator `in` tells whether an element is present in a list.

Here are their implementations:

```ts
interface Funcs2<T1, T2> {
    // T1 = context
    // T2 = literal to dereference
    'PREFIX1__*__':
        //@ts-expect-error
        T2 extends keyof T1['obj'] ? T1['obj'][T2] :
        ERROR<["Can't dereference given key:", T2]>;
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
    // T3 = list or union where to search
    //
    // Implementation Notes:
    //  Passing T3[number] to IsInList keeps the single elements separated,
    //  i.e., e.g., [true, false] is passed as two separate elements, instead
    //  of as the single element `boolean`.
    INFIX2__in__:
        //@ts-expect-error
        true extends IsElemInUnion<T2, T3[number]> ? true : false;
}
```

The implementation of the `in` operator is one of the first I wrote, so that explain the detailed comments: dealing with distributivity wasn't completely natural to me back then!

In case you didn't know, distributivity only applies to generic types, be they introduced as arguments or through `infer`. If one modifies them in any way, distributivity is suppressed. For instance, this suppresses distributivity:

```ts
type Foo<T> = [T] extends [any] ? 'ok' : never;
```

But there are infinitely many ways to do that. One could use `T[]`, pass `T` to a type function, etc... As a side note, if you need both modes of operation, you'll need to make a copy of the generic type first, and then distribute over one of them. To make things easier, you might want to split the function into two smaller functions.

## Adding more complex operators

***Note:*** The following code can be found in the file `tests.ts`.

Let's consider a bigger object:

```ts
type BIGGER_OBJ = {
    rec: 'rec';
    car: 'a car';
    tree: 'a tree';
    Tim: 'ok';
    whiteList: ['Tim', 'John', 'Luke', 'Luca', 'Stefano', 'Doe'];
    ifStartsWith: ['name', 'surname'];
    name1: 'Tim';
    name2: 'John';
    name3: 'Luca';
    name4: 'Luke';
    name5: 'Tim';
    name6: 'John';
    name7: 'Luca';
    name8: 'Luke';
    name9: 'Tim';
    name10: 'John';
    name11: 'Luca';
    name12: 'Luke';
    name13: 'Tim';
    name14: 'John';
    name15: 'Luca';
    name16: 'Luke';
    name17: 'Tim';
    name18: 'John';
    name19: 'Luca';
    name20: 'Luke';
    name21: 'Tim';
    name22: 'John';
    name23: 'Luca';
    name24: 'Luke';
    name25: 'Stefano';
    // name_invalid: 'Stephen';
    surname1: 'Doe';
    // surname_invalid: 'Rossi';
} & {
    [K in MANY_NUMBERS[number] as `key${K & number}`]: 0
};
```

Although that object doesn't make much sense, it still serves the intended purpose.

That object contains 132 properties (or fields or whatever) as it can (not so) easily be seen:

```ts
type NumElements = UnionToList<keyof BIGGER_OBJ>['length'];      // 132
```

Evaluating the big expression I wrote at the beginning of this document requires more than 4000 iterations... and it works. It takes 15 seconds or so on my PC.

That's said, I want to show you how some of the more complicated operators are implemented. The `map` and `filter` operators are too involved to be discussed here, so please refer to the code if you're curious. You can find them in the file `user_defs.ts`.

The `call` operator, believe it or not, is a latest addition as I was perfectly fine with using the `bind` and `apply` operators inherited from HOTs:

    'StartsWith' bind v'start' apply v'key'

Note that `bind` can't bind the last argument, and that `call` can only be used when exactly one argument is missing.

To implement `call`, I first introduced the *comma* operator `,` as follows:

```ts
class ListOfArgs<T> {#a?: T};

interface Funcs3<T1, T2, T3> {
    // T1 = CONTEXT
    'INFIX2__,__':
        T2 extends ListOfArgs<infer AS> ?
            //@ts-expect-error
            ListOfArgs<[...AS, T3]> :
        ListOfArgs<[T2, T3]>;
}
```

Note that the `#`, which makes a field (*really*) private, is used to force *nominal typing* as *structural typing* might lead to collisions.

The purpose of the comma operator is obviously to form lists of arguments!

I know I use the term *list* when *tuple* would be more appropriate, but when I type-program, types are just values, and tuples of types just lists of values, to me.

Now for the main ingredient:

```ts
interface Funcs3<T1, T2, T3> {
    // T1 = CONTEXT
    'INFIX2__callWith__':
        T3 extends NotSubType<infer A, ListOfArgs<any>> ?
            T2 extends FREE1 ? APPLY1<T2, A> :
            ERROR<"callWith: 1st argument is not a FREE1"> :
        T3 extends ListOfArgs<[infer A1, infer A2]> ?
            T2 extends FREE2 ? APPLY2<T2, A1, A2> :
            ERROR<"callWith: 1st argument is not a FREE2"> :
        T3 extends ListOfArgs<[infer A1, infer A2, infer A3]> ?
            T2 extends FREE3 ? APPLY3<T2, A1, A2, A3> :
            ERROR<"callWith: 1st argument is not a FREE3"> :
        ERROR<"callWith: too many arguments?">;
}
```

First of all, notice that weird `NotSubType`. As the name suggests, it can be used to *infer* a value whenn (i.e. when and only when :)) the value to infer is *not* of the specified type.

By the way, I lied: this is `callWith` and it's used as an *infix* operator:

```ts
type TEST_CALL_1 = EvalExpr<USER_OBJ2, `
    'StartsWith' callWith ('name', 'name123')
`>;
```

What we really want is the *prefix* version:

```ts
type Call_FREE_Error<Args extends any[]> =
    ERROR<[
        `call: the first element is not a FREE${DecCount[Args['length']]}`,
        Args
    ]>;

interface Funcs2<T1, T2> {
    // T1 = CONTEXT
    'PREFIX1__call__':
        T2 extends ListOfArgs<[infer F, infer A]> ?
            F extends FREE1 ? APPLY1<F, A> :
            Call_FREE_Error<[F, A]> :
        T2 extends ListOfArgs<[infer F, infer A1, infer A2]> ?
            F extends FREE2 ? APPLY2<F, A1, A2> :
            Call_FREE_Error<[F, A1, A2]> :
        T2 extends ListOfArgs<[infer F, infer A1, infer A2, infer A3]> ?
            F extends FREE3 ? APPLY3<F, A1, A2, A3> :
            Call_FREE_Error<[F, A1, A2, A3]> :
        ERROR<"call: something is wrong">;
}
```

Let's test the error messages:

```ts
// Test EVAL Error Message
// [
//    "call: the first element is not a FREE2",
//    ["StaXXXXXXXrtsWith", "name", "ifStartsWith"]
// ]
type TEST_Complex_3EE = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                call('StaXXXXXXXrtsWith', v'start', v'key')
            }) reduce 'any'
        ) else call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;
```

If we misspell the name of the operator we get a *TOKENIZATION* error instead:

```ts
// Test TOKEN Error Message
// msg: "Can't tokenize the remaining expression"
// expr: "callXXXXXX('StartsWith', v'start', v'key')..."
type TEST_Complex_3PE = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        if 'ifStartsWith' then (
            *'ifStartsWith' map ('start' => {
                callXXXXXX('StartsWith', v'start', v'key')
            }) reduce 'any'
        ) else call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;
```

Now let's say we don't like the `if...then...else` operator (defined, as always, in `user_defs.ts`) and we'd much rather use the ternary operator `?:` instead. No problem:

```ts
interface Funcs3<T1, T2, T3> {
    // T1 = {'op', 'mem'}
    'INFIX2__:__PARSE':
        T1 extends {op: string; mem: any[]} ?
            T2 extends _EVAL_OperationPtr<infer OPN_PTR> ?
                ReadFromParseMem<T1['mem'], OPN_PTR> extends [
                    'INFIX2__?__', infer A1, infer A2
                ] ?
                    // The 3 arguments are A1, A2, T3.    
                    ['PREFIX3__if__', A1, _EVAL_Skip<A2>, _EVAL_Skip<T3>] :
                ERROR<'\`?\` branch expected'> :
            ERROR<'\`?\` branch expected'> :
        never;

    // If '?' wasn't replaced by the 'if then else', then there was an error.
    'INFIX2__?__': ERROR<'\`:\` branch expected'>;
    'INFIX2__:__': 0;           // never used
}
```

Here are the important points:

1. We implement `?:` by splitting it into two INFIX2 operators.
2. We convert the `?:` operation into an `if` operation, so we're relying on the implementation of the `if` operator.
3. The conversion is done at *parsing* time.
4. The splitting into the two INFIX2 operators completely disappears during the parsing.
4. Since
    - the conversion is performed by the `:` INFIX2 operator (because it comes last), and
    - the conversion gets rid of the `?` node in the AST,
    
   if `?` is still present at *evaluation* time, then the `:` branch was missing.
5. We don't have *pointers* in type programming, but we *do* need them, so we emulate them by using a list as memory and the indices as pointers.
6. `_EVAL_OperationPtr` contains a pointer, `OPN_PTR`, to the real operation in memory so we must read it from memory through `ReadFromParseMem`.

Let's test it:

```ts
// Remember: all operators are Left-Associative.
type TEST_Simple_1 = EvalExpr<USER_OBJ2, `
    'recf' ? 'y' : ('car' ? 'y1' : 'y2')
`>;

// ERROR: "`:` branch expected"
type TEST_Simple_1E1 = EvalExpr<USER_OBJ2, `
    'recf' ? 'y'
`>;

// ERROR: "`?` branch expected"
type TEST_Simple_1E2 = EvalExpr<USER_OBJ2, `
    'recf' : 'car'
`>;

// ERROR: "`:` branch expected"
type TEST_Simple_1E3 = EvalExpr<USER_OBJ2, `
    'recf' ? 'x' ? 'y'
`>;

// Test short-circuit evaluation!
type TEST_Simple_1sce1 = EvalExpr<USER_OBJ2, `
    'rec' ? 'y' : *'error'
`>;

// Test short-circuit evaluation!
type TEST_Simple_1sce2 = EvalExpr<USER_OBJ2, `
    'recXXXX' ? *'error' : 'z'
`>;

// ERROR: ["Can't dereference given key:", "not present"]
type TEST_Simple_1E4 = EvalExpr<USER_OBJ2, `
    'rec' ? *'not present' : 'z'
`>;

type TEST_Complex_3d = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        'ifStartsWith' ? (
            *'ifStartsWith' map ('start' => {
                call('StartsWith', v'start', v'key')
            }) reduce 'any'
        ) : call('StartsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;
```

We could also define a prefix version:

```ts
interface Funcs4<T1, T2, T3, T4> {
    // T1 = {op, mem}
    // T2 = condition
    // T3 = then expression
    // T4 = else expression
    'PREFIX3__?:__PARSE': ['PREFIX3__if__', T2, _EVAL_Skip<T3>, _EVAL_Skip<T4>]

    'PREFIX3__?:__': 0;         // only necessary to register '?:'
}
```

This is just an `if` without the `then` and `else` keywords so it's very easy to implement as you can see.

This way, `?:` uses short-circuit evaluation (although the term is usually reserved to logical operators) as one would expect. The following implementation would be very inefficient:

```ts
interface Funcs4<T1, T2, T3, T4> {
    // No short-circuiting version of ?:
    'PREFIX3__?:NS__': ToBool<T1, T2> extends true ? T3 : T4;
}
```

Let's see a few examples:

```ts
// Still working thanks to short-circuiting.
type TEST_Simple_2 = EvalExpr<USER_OBJ2, `
    ?: 'rec' 'x' *'not present'
`>;

type TEST_Simple_2NS1 = EvalExpr<USER_OBJ2, `
    ?:NS 'rec' 'x' 'y'
`>;

// Error because there's no short-circuit evaluation!
// ERROR: ["Can't dereference given key:", "not present"]
type TEST_Simple_2NS_E1 = EvalExpr<USER_OBJ2, `
    ?:NS 'rec' 'x' *'not present'
`>;

// All OK!
type TEST_Simple_2NS_NoE1 = EvalExpr<USER_OBJ2, `
    ?: 'rec' 'x' *'not present'
`>;

// Error because of no short-circuit evaluation in `?:NS`.
type TEST_Complex_3_NS_E1 = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        ?:NS
            'ifStartsWith' (
                *'ifStartsWith' map ('start' => {
                    call('StartsWith', v'start', v'key')
                }) reduce 'any'
            )
            call('StaXXXrtsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;

// All OK!
type TEST_Complex_3e = EvalExpr<USER_OBJ2, `
    $'KEYS' filter ('key' => {
        ?:
            'ifStartsWith' (
                *'ifStartsWith' map ('start' => {
                    call('StartsWith', v'start', v'key')
                }) reduce 'any'
            )
            call('StaXXXrtsWith', 'name', v'key')
    }) map ('x' => {
        *v'x' in *'whiteList'
    }) reduce 'all'
`>;
```

By the way, I call this an *expression* evaluator, but this is not a limitation since, in functional languages, programs are just expressions. It's not too difficult to add a `let...in` operator which lets us define variables and so on. Variables are already supported because of anonymous functions so the difficult part is already done.

# Implementation

***Note:*** *You can find the code for this section in the file `implementation.ts`, and other files indicated when needed. I'm writing `implementation.ts` as I write this section.*

As I mentioned before, the expression evaluator has three phases:

1. Tokenization
2. Parsing
3. Evaluation

Of course, the *Tokenizer* works on the original expression, the *Parser* on the tokenized expression, and, finally, the *Evaluator* on the AST (Abstract Syntax Tree) produced by the *Parser*.

Those 3 phases, especially the last one, require lots of steps, even several thousands, depending on the expression and the target object. How is it possible to do so with less than 50 effective levels of type instantiation?

First of all, it's important to realize that recursive *calls* are not the problem. It's not the call per se (e.g. `MyFunction<[1, 'asd']>`) which poses a problem, but the effective branching introduced by the `?:` operator, and, also, the nesting of the data structures used. This means that we can ***not*** work around the depth limitation just by cramming lots of stuff into a single function. That would actually bring Typescript to its knees as it doesn't handle heavy `?:` nesting within the same type function very well.

## Trick 1: Breaking the Chain

Instead of organizing the `?:` instances to form a chain, we should form a balanced tree.

This produces a long chain:

```ts
type ZeroList<N extends number, List extends any[] = []> =
    List['length'] extends N ? List : ZeroList<N, [...List, 0]>;

type Test = ZeroList<45>['length'];             // 45
```

This splits the chain into 2 separate chains:

```ts
type ZeroList<N extends number, List extends any[] = []> =
    List['length'] extends N ? List : ZeroList<N, [...List, 0]>;

type ZeroList2<HalfN extends number, N extends number> =
    ZeroList<N, ZeroList<HalfN>>;

type Test2 = ZeroList2<44, 89>['length'];       // 89
```

This works because the inner type instantiation `ZeroList<HalfN>` uses all the depth, but then it "returns to the surface" as it ends. The result is then passed to another instance of the same function, which starts from the surface (although an additional level is still used so we're forced to replace `45` with `44`, and we can't use `90` either).

### It's not just about "recursive calls"

Now let me prove to you that this trick has little to do with "recursive calls" or the idea of splitting the code into separate functions:

```ts
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
```

Basically, `DeepCaller1` wastes the specified amount of depth and then "call" `Callee1`. (I'll drop the quotation marks around *call* from now on.) With `37` I get `boolean`, which is clearly wrong. No depth error, though. *That's worrisome because it means code might break without us even realizing it.* With `39` up to `45` I get `any` and still no depth error... At last, `46` produces the coveted depth error.

Now let's push past that limit without making any external call:

```ts
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
```

As you can see, we saved 4 levels. That's not as much as we might expect, but it proves my point nonetheless.

### A first implementation

Given any *step function*, we want to be able to execute it as many times as necessary like this:

    StepFun<...StepFun<StepFun<StepFun<InitialValue>>>...>

We need to add a stop condition, so let's say the step function must return `[Result, Done]`, where `Result` is the current temporary result and `Done` may be either `true` or `false` depending on whether the function is done or not.

Since we want it to work with a general step function, we'll use my HOTs, as always:

```ts
type RecurseTree2<F extends FREE1, R, Depth extends number = 12> =
    Depth extends 0 ? APPLY1<F, R> :
    RecurseTree2<F, R, DecCount[Depth]> extends [infer R, infer Done] ?
        Done extends true ?
            [R, Done] :
        RecurseTree2<F, R, DecCount[Depth]> :
    never;
```

`DecCount` is simply

```ts
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
```

This is very efficient and more than enough (you don't use *Quicksort* to efficiently sort 5 numbers, do you?).

`F` is the step function, `R` is the current result, and `Depth` is the number of depth levels `RecurseTree2` will use. `RecurseTree2` calls itself recursively until it reaches the leaves (`Depth` = 0) where it executes the step function through `APPLY1<F, R>`. As decided before, the execution stops when `Done` is `true`.

Ideally, this should give us 2^*D* iterations for just *D* depth levels, but there's a catch: the implementation above suffers from what I call *double burning*.

Because we need to check for the stopping condition, every *right* subtree costs 1 depth level more than the *left* one, so we end up paying *D+N* depth levels, where N is the number of depth levels actually needed for the evaluation.

Do you see how the right subtree is one level deeper than the left subtree?

```ts
    RecurseTree2<F, R, DecCount[Depth]> extends [infer R, infer Done] ?
        ...
        RecurseTree2<F, R, DecCount[Depth]> :
    never;
```

Let's verify this! We'll use the step function `GetLast` defined in `recurse_test.ts`:

```ts
interface Funcs1<T> {
    GetLast:
        T extends [infer Head, ...infer Tail] ?
            Tail extends [] ? [Head, true] : [Tail, false] :
        never;
}
```

Let's try it with a very short list:

```ts
type TestList = [
    1, 1,
    2
]

type Test_GetLast1 = RecurseTree2<'GetLast', TestList, 41>;     // [2, true]
```

`41` is the maximum we can use and we can't grow the list anymore without reducing `D`. Now let's find the maximum list length for `40`:

```ts
type TestList = [
    1, 1,
    1, 1,
    2
]

type Test_GetLast1 = RecurseTree2<'GetLast', TestList, 40>;
```

By repeating this procedure a few times we can see the *double burning* effect pretty clearly:

```ts
type TestList = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // 37
    1, 1, 1, 1, 1, 1, 1, 1,                             // 38
    1, 1, 1, 1,                                         // 39
    1, 1,                                               // 40
    1, 1,                                               // 41
    2
]

type Test_GetLast1 = RecurseTree2<'GetLast', TestList, 37>;
```

This means that 1024 iterations require 20 levels. That's certainly an improvement, but can we do better?

Before answering positively to this question (spoiler!), note that the problem of *double burning* becomes more and more accentuated as we increase the arity of the tree. In fact, we can't do better than the binary tree without solving the *double burning* problem.

## Trick 2: Exploiting the Caching

*Disclaimer*: I performed this experiment only in Visual Studio Code.

Create a new `.ts` file (just to be safe) with the following code:

```ts
/// <reference path="recurse.ts" />
/// <reference path="recurse_tests.ts" />

type TestList = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // 37
    1, 1, 1, 1, 1, 1, 1, 1,                             // 38
    1, 1, 1, 1,                                         // 39
    1, 1,                                               // 40
    1, 1,                                               // 41
    2
]

type Test_GetLast1 = RecurseTree2<'GetLast', TestList, 37>;
type Test_GetLast2 = RecurseTree2<'GetLast', TestList, 82>;
```

Believe it or not, it won't give you any error.

Do and observe the following:

1. Hover over `Test_GetLast2`. You'll get `any`.
2. Hover over `Test_GetLast1`. You'll get `any`.

Modify the file in any way (or restart the TS server) and swap the hovering order:

1. Hover over `Test_GetLast1`. You'll get `[2, true]`.
2. Hover over `Test_GetLast2`. You'll get `[2, true]`.

What's going on???

Simply put, by hovering over `Test_GetLast1`, TS computes it and caches the result. Once you hover over `Test_GetLast2`, TS will start the expansion but will stop at level 37 because it knows the answer already!

This suggests a way to completely eliminate the *double burning* problem:

```ts
type RecurseTreeRes2C<F extends FREE1, R, Depth extends number> =
    RecurseTree2C<F, R, Depth> extends [infer R, any] ? R : never

type RecurseTree2C<F extends FREE1, R, Depth extends number> =
    Depth extends 0 ? APPLY1<F, R> :
    RecurseTree2C<F, R, DecCount[Depth]> extends [infer R, true] ?
        [R, true] :
    RecurseTree2C<F, RecurseTreeRes2C<F, R, DecCount[Depth]>, DecCount[Depth]>;
```

The "C" in the name stands for "Cache" or "Caching", as you might've guessed.

The *double burning* is gone:

```ts
type TestList2 = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // 37
    1, 1, 1, 1, 1, 1, 1, 1,                             // 38
    1, 1, 1, 1,                                         // 39
    1, 1,                                               // 40
    1, 1,                                               // 41
    2
]

type Test_GetLast3 = RecurseTree2C<'GetLast', TestList2, 41>;
```

By the way, comment out the other examples to avoid cache interferences. Nothing major: some code might work even if it shouldn't.

As you can see by the code, instead of using the new `infer`red `R` directly, we just drop it and recompute its value from scratch... or so it seems: its value was just cached so TS won't recompute it.

Note that an eventual *cache miss* won't break the code: it'll just make it slower.

Actually, there's a smarter way to implement the method above:

```ts
type RecurseTree2CS<F extends FREE1, R, Depth extends number> =
    Depth extends 0 ? APPLY1<F, R> :
    RecurseTree2CS<F, R, DecCount[Depth]> extends [infer R, false] ?
        RecurseTree2CS<F, R, DecCount[Depth]> :
    RecurseTree2CS<F, R, DecCount[Depth]>;
```

Yes, the "S" stands for "smarter". What's the difference? Both versions recompute the left subtree (since it's the first to be computed), but the first version recompute it when `Done = false`, while the smarter one when `Done = true`. This way we can reuse the inferred `R`.

Now that we've solved the *double burning* problem, we can also increase the arity of the tree:

```ts
// Note: it's faster with `//@ts-expect-error`
type __Recurse2<F extends FREE1, R, Depth extends number> =
    //@ts-expect-error
    Recurse<F, Recurse<F, R, Depth>[0], Depth>;

// Note: it's faster with `//@ts-expect-error`
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
```

This implementation is able to do 4^*N* = 2^{2*N*} iterations with just *N* depth levels.

The 2^*N* version is still useful for debugging purposes:

```ts
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

// At least 2^15 = 32768 cycles without failing!
type RECURSE_TEST2 = RecurseTree2CS<
    'BinaryCount_STEP', [14, [], true], 15
```

With the 4^*N* version we can only set the maximum number of iterations to 2^14 or 2^16. The latter fails and the former succeeds, but 2^15 also succeeds, as we can see with the 2^*N* version.

I'll leave the analysis of this code as an exercise (the name gives it away, though). This test is not easy to simplify because of the following problems:

1. If the input grows too much, Typescript will give a depth error.
2. If the input repeats, the execution will stop because of caching.

Although, theoretically, this algorithm should run indefinitely, Typescript will stop the execution at a certain point.

## Recursive calls

Now we need a method to call other functions. What happens if a step function wants to call other step functions? That mechanism is implemented in `multi_recurse.ts` and it simply uses a stack (a list) to represent the *call stack*.

The important thing to understand is that, like in a JS *event loop*, a step function must always give back the control to the *execution engine* as soon as possible. Here, though, *"soon"* means *"without consuming too many depth levels"*. 

If you look at the parsing and evaluation functions in `eval_new.ts` you'll see that they're pretty long and complex, but the important thing is that they're *shallow*: they never nest too deeply. By the way, you'll notice that I prefer to repeat code when it saves depth. I also exploit the caching mechanism from time to time.

Back to the main topic. A step function can return one of the following:

    ContWith<R>                = [R, false]
    Call<R, FNew, RNew, RRNew> = [R, FNew, RNew, RRNew]
    Return<Result>             = [Result, true]

I'll only explain `Call` since the other two just implement the `[R, Done]` mechanism we saw before:

* `R` is the same as in the other cases: it's the next "result" or, rather, *state* of the step function.
* `FNew` is the step function to call.
* `RNew` is the initial *state* of `FNew`.
* `RRNew` is a function (*not* a step function, but still a HOT one) that receives the result `Return<>`ed by `FNew`. This is useful to avoid wasting an iteration just to take the result and insert it into the state of the caller. The state is arbitrary, and I think it should stay that way, so I decided to let the caller provide its own method to receive the result. It's optional, though. If not provided, it defaults to `undefined` and the result is received directly by the caller.

There are also versions for *map calling* and *flatmap calling* a step function, but I'll spare you (and me) the details. Look at the code if you're curious. They're used to implement the `map` and `filter` operators. The `flatmap` operator would be very easy to implement, since `filter` is implemented through an internal `flatmap`!

## Data structure complexity

I won't explain how the evaluator works if not *en passant* as I think the code is readable enough. I want to talk instead of a problem I faced when trying to build the AST for the expression during the *parsing*.

In a system language one would use pointers or lists of pointers for the children of a node, but in type programming we end up with a nested data structure. For instance, the nested AST for the expression

    `!('a' && ('b' || 'c'))`

will look like this:

```ts
[
    _EVAL_Operation<[
        "PREFIX1__!__",
        _EVAL_Operation<[
            "INFIX2__&&__",
            "a",
            _EVAL_Skip<
                _EVAL_Operation<[
                    "INFIX2__||__",
                    "b",
                    _EVAL_Skip<"c">
                ]>
            >
        ]>
    ]>
]
```

As we saw before, `_EVAL_Skip` prevents the evaluation of the operand it wraps. In this case, it's used by `&&` and `||` to implement short-circuit evaluation. For instance, if `bool "a"` is false then `&&` returns `"a"` and completely ignores the second operand. Otherwise, `&&` returns the second operand *unwrapped*, i.e. 

```ts
_EVAL_Operation<[
    "INFIX2__||__",
    "b",
    _EVAL_Skip<"c">
]>
```

During evaluation, we need to keep a pointer to the current node in the AST, but we don't have pointers so we need to *"copy"* the entire subtree. The evaluation proceeds by pushing the subtrees we need to work on onto the *evaluation stack*.

For instance, we start with

```ts
[
    [
        _EVAL_Operation<[
            "PREFIX1__!__",
            _EVAL_Operation<[
                "INFIX2__&&__",
                "a",
                _EVAL_Skip<
                    _EVAL_Operation<[
                        "INFIX2__||__",
                        "b",
                        _EVAL_Skip<"c">
                    ]>
                >
            ]>
        ]>
    ]
]
```

we then notice that the operand of `!` needs to be evaluated and we thus push it onto the stack:

```ts
[
    [
        _EVAL_Operation<[
            "PREFIX1__!__",
            _EVAL_Operation<[
                "INFIX2__&&__",
                "a",
                _EVAL_Skip<
                    _EVAL_Operation<[
                        "INFIX2__||__",
                        "b",
                        _EVAL_Skip<"c">
                    ]>
                >
            ]>
        ]>
    ],
    
    _EVAL_Operation<[
        "INFIX2__&&__",
        "a",
        _EVAL_Skip<
            _EVAL_Operation<[
                "INFIX2__||__",
                "b",
                _EVAL_Skip<"c">
            ]>
        >
    ]>
]
```

Since the value of the first operand is already available and the second operand is wrapped in `_EVAL_Skip`, we can call `INFIX2__&&__` and pass it its two operands. Let's say `bool "a"` is true. In this case, `INFIX2__&&__` returns its second operand unwrapped:

```ts
[
    [
        _EVAL_Operation<[
            "PREFIX1__!__",
            _EVAL_Operation<[
                "INFIX2__&&__",
                "a",
                _EVAL_Skip<
                    _EVAL_Operation<[
                        "INFIX2__||__",
                        "b",
                        _EVAL_Skip<"c">
                    ]>
                >
            ]>
        ]>
    ],
    
    _EVAL_Operation<[
        "INFIX2__||__",
        "b",
        _EVAL_Skip<"c">
    ]>
]
```

Now we can call `"INFIX2__||__"`, and so on...

Long expressions will result in deeply nested AST structures which will bring TS to its knees. Both the *parsing* and *evaluation* will become unbearably slow and the type evaluation won't even succeed in most cases as we'll either get a depth error or an incorrect result such as `never` or `any`.

As I mentioned before, my first implementation of the evaluator was a very complicated function which did all the 3 phases at once. It was faster than the current implementation in some simple cases, but it couldn't handle RHS sub-expressions efficiently enough because it had to re-extract them over and over. Without an AST one is bound to do a lot of useless scanning. I could've sped it up a lot by working on a modified expression, I guess. For instance, by transforming

    'x1' || ('x2' || ('x3' || ('x4' || 'x5')))

into

    'x1' || (£1'x2' || (£2'x3' || (£3'x4' || 'x5')£3)£2)£1

where `£` is some special symbol or unique string, I would've been able to identify a whole subexpression without any scanning by just relying on `${}` pattern matching.

Anyway, I decided against it and implemented a 3-phase evaluator instead (that's why the file is called `eval_new.ts` and not just `eval.ts`).

As I was saying, we have a nesting problem. The solution I came up with is that of using a list to store the nodes and then refer to them by their *index*, i.e. 0-based position in the list. Indeed,

```ts
type Example_AST1 = ParseExpr<`
    !('a' && ('b' || 'c'))
`>;
```

returns

```ts
[
    _EVAL_Operation<["PREFIX1__!__", _EVAL_OperationPtr<1>]>,
    [
        ["INFIX2__||__", "b", _EVAL_Skip<"c">],
        ["INFIX2__&&__", "a", _EVAL_Skip<_EVAL_OperationPtr<0>>],
        ["PREFIX1__!__", _EVAL_OperationPtr<1>]
    ]
]
```

which has the form `[FirstNode, Memory]`. There's a minor repetition as the first node is also in memory, but that's negligible and I thought it makes more sense for the memory to contains all the nodes, including the *root*. The root is always the last node in memory, but one shouldn't rely on such implementation details, in my opinion. What if we change the code and forget about this assumption? It's better not to rely on such details when there's no measurable benefit in doing so.

The memory is *append-only* and is operated on by using very simple functions:

```ts
type NewFreeParseMem = [];
type StoreIntoParseMem<MEM extends any[], Value> =
    [[...MEM, Value], MEM['length']];
type ReadFromParseMem<MEM extends any[], Ptr> = MEM[Ptr & number];
```

`StoreIntoParseMem` returns the pair `[UpdatedMem, ValuePtr]`.

That's it!

## Unions VS Lists

Since I'm using the evaluator to validate object types, being able to get the keys of those objects is crucial. Object keys are "natively" available as *unions*, but it's not easy to implement *map* and *flatmap* operators that work with unions. Lists are way easier to work with.

Nonetheless, my first implementation of `MultiRecurse`, i.e. the function responsible for allowing step functions to call other step functions, was based on unions. In general, a step function would call another step function on a union of (`SafeWrap`ped) elements, producing a union of results. `MultiRecurse` would then execute several copies of the called function, one for each element, simultaneously. The main complication was that each of those copies could call other step functions and it wasn't very easy to collect the results correctly. I got it to work but it was rather slow compared to the new version which just executes a single function to its completion before moving on to the next. I had also to `SafeWrap` (see `misc.ts`) the single union elements because they could be unions themselves.

The problem is that there is no fast and straightforward way to convert a union into a list. (That's why I initially decided to work with unions.) The best way I know exploits the fact that

```ts
type WeirdTrick1 = {
    (x: number);
    (x: string);
    (x: boolean);
} extends (x: infer T) => void ? T : never;         // boolean
```

evaluates to `boolean`, i.e. a single type. A few observations are in order:

1. `(x: number)` is equivalent to `(x: number) => any`.
2. `WeirdTrick1` represents 3 overloads.
3. The signature of the overloads is not important.
4. We managed to extract one single type from a set of types.

To prove the third point, let's try the following:

```ts
type WeirdTrick1 = {
    (): number;
    (): string;
    (): boolean;
} extends () => infer T ? T : never;        // boolean
```

Same result: nothing changes.

Let's make sure that this is really related to overloading:

```ts
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
```

No error, so everything checks out. `AssertTrue` is a little utility (see `misc.ts`) I use to force an error when an expression is false. It's simply defined as

```ts
type AssertTrue<T extends true> = T;
```

In case it wasn't clear, there's *NO* need to hover over the type to see the error. That's the whole point of using it.

`WeirdType1` can be rewritten as an intersection:

```ts
type WeirdType2 = {(): number} & {(): string} & {(): boolean};
type WT_Check2 = AssertTrue<EQU<WeirdType1, WeirdType2>>;
```

This also checks out.

So we can extract a single element of a union by first transforming that union into an intersection of overloads that have each an element of that union as return type.

We can go from a union to an intersection this way:

```ts
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
```

`UnionToInters` uses two simple patterns. Here's the first one, in a more general form:

```ts
type Func<T> = (x: T) => void;

type ApplyFuncToUnion<U> =
    U extends any ?         // for each elem in U
        Func<U> :           //    Func<elem> :
    never;                  // never;
```

The first line of the body of `ApplyFuncToUnion` is used to force distributivity over `U` so that the subsequent lines are applied not to the whole `U` but to each single element of `U`. Then all the results are collected in a new union. For example,

    0 | 1 | 2 | 3 | 4

becomes

    Func<0> | Func<1> | Func<2> | Func<3> | Func<4>

The second part relies on the fact that, roughly:

> (We say) `A extends B` when we can replace an object of type `B` with an object of type `A` without breaking the surrounding code.

For instance, `Dog extends Animal` because we can replace `anAnimal` with `myDog` since the surrounding code expects an `Animal` and `myDog`, being a `Dog`, is certainly an `Animal`.

Ignoring the fact that we can't really put `extends` on a separate line alone, we have:

    ((x: T1) => void) | ((x: T2) => void) | ((x: T3) => void))
        extends
    (x: T1 & T2 & T3) => void

One can reason as follows to infer `T1 & T2 & T3`:

* For a(n object of type) `(x: T) => void` to be replaceable by a `(x: T1) => void`, a `T` must be a `T1`. Why? Because if `T` is not a `T1`, the surrounding code can send an object which is not a `T1` and so the replacement will break the code.
* For a `(x: T) => void` to be replaceable by a `(x: T2) => void`, a `T` must be a `T2`.
* For a `(x: T) => void` to be replaceable by a `(x: T3) => void`, a `T` must be a `T3`.

The simplest solution is `T = T1 & T2 & T3`. Of course, `T = T1 & T2 & T3 & Animal` would also work, but that wouldn't be a maximal solution because that type would be more restrictive than necessary.

In technical terms, the reasoning above also shows that a function is *contravariant* in (or w.r.t.) its arguments:

    (A, ...TS) => T ---extends---> (B, ...TS) => T
                         iff
                 A <---sdnetxe--- B            (!artnoc)
    
Since we need an intersection of overloads we'll start with a union of such overloads. Here's the full code:

```ts
type GetOneOverload<OS> =
    OS extends (x: infer T) => void ? T : never; 

type UnionToInters<U> =
    (U extends any ?
        (x: U) => void :
    never) extends (x: infer Inters) => void ?
        Inters :
    never;

type ExtractUnionElem<U> =
    GetOneOverload<
        UnionToInters<
            U extends any ?
                (x: U) => void :
            never
        >
    >;

type Test_EUE_1 = ExtractUnionElem<10 | 20 | 30>;       // 30
```

The *transformation chain* is the following:

    U1 | ... | UN ->
    ((x: U1) => void) | ... | ((x: UN) => void) ->
    ((x: U1) => void) & ... & ((x: UN) => void) ->      // UnionToInters
    (x: Ui) => void,     1 <= i <= N                    // GetOneOverload

One shouldn't rely on the fact that usually(?) `GetOneOverload` returns the last overload.

To extract the other elements we can use either of the following patterns:

```ts
type Test_Skip1 = (0 | 1 | 2) extends infer T | 2 ? T : never;
type Test_Skip2 = ({a:0} & {b:0} & {c:0}) extends infer T & {c:0} ? T : never;

type Skip1_Check = AssertTrue<EQU<Test_Skip1, 0 | 1>>;
type Skip2_Check = AssertTrue<EQU<Test_Skip2, {a:0} & {b:0}>>;
```

Unfortunately, the resulting code for converting a union into a list is considerably slow. I'd say we shouldn't use it for objects with more than 200 fields. The bottleneck seems to be the `GetOneOverload` part so there's not much one can do to speed it up.

Here's the version you can find in `misc.ts`:

```ts
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
```

The code above is more complicated than the one I've shown here, but the method is fundamentally the same.

I'd say this concludes the document! I hope you enjoyed reading it as much as I enjoyed writing it ;)

# Contacts (and Interests)

In the past I did lots of system programming in asm/C/C++, reverse engineering (malware, etc...) and exploit development.
At the moment, I'm exploring the field of *Web (Ethical) Hacking* (which led me to WebDev and Typescript) and I'm working on a novel second-order optimization algorithm for training neural networks (95% Math + 5% PyTorch!). The latter is unpaid research so I can't devote all my time to it. That's why I'm also doing Bug Hunting.

Is there anyone doing ML/DL/RL in Typescript? Now that GPU acceleration is ubiquitous, it should be possible. If you have any related job offer for me, you can contact me at the email address below.

```ts
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
```
