# Disclaimer

What follows is a **POC** (**P**roof **O**f **C**oncept). I'm not suggesting you should do this in production code, but I'm not saying you shouldn't either.

# DRY in Type Programming

**DRY** is short for **D**on't **R**epeat **Y**ourself, of course, and it's nothing new, but this time I'll apply it to *Type Programming*.

## IterableArgs

Have a look at this simple *type code*:

    type IterableArgs<IS extends Iterable<any>[]> =
        IS extends [] ? [] :
        IS extends [infer I, ...(infer IT)]
        ? I extends Iterable<infer A>
            ? IT extends Iterable<any>[]
                ? [A, ...IterableArgs<IT>]
                : never
            : never
        : never;

Even if you don't understand it because you're not comfortable with type programming, ***bear with me and you'll be able to understand it soon.***

The code above is used to convert a type of the form

    [Iterable<number>, Iterable<string>, Iterable<boolean>]

into

    [number, string, boolean]
    
that is, as the name implies, it extracts the type argument from `Iterable`s.

These kinds of operations come up all the time. For instance, I use `IterableArgs` to define the return type of the function `zip`, which you should know from *Python* or *Functional Programming*:

    function any(xs: Iterable<any>) {
        for (const x of xs) if (x) return true;
        return false;
    }

    function* zip<TS extends Iterable<any>[]>(...xs: TS)
              : Generator<IterableArgs<TS>> {
        const iters = xs.map(x => x[Symbol.iterator]());
        let nexts;
        while (true) {
            nexts = iters.map(it => it.next());
            if (any(nexts.map(n => n.done))) break;
            yield nexts.map(n => n.value) as any;
        }
    }

(Note that the implementation above is *not* optimized for performance.)

I use `as any` because type checking the whole function isn't worth it, IMHO, but the signature *has* to be correct if we want things to work correctly:

    // to show that zip works with iterables
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

You can play with it in [TS Playground](https://www.typescriptlang.org/play?#code/C4TwDgpgBAksECcCGAjANhAggg5gZwB4YBlKCAD3gDsATPWeZdCApKkAPgG0BdDqALwAoKKNikK1OlF5QA-DJ5QAXCLEkylCLXpcAllQBmiWABooAOisAKA8YSwAKgEoea0Qpiap9OIlQYBHYmmBzuYh5O3trSfkyBbJy84RERClyY5lYWcQFYuIQwjhxuqWUqUFQQAG6IKWLKlTV1EY1VtQgA3EJChgCuVADGwHoA9lRQidbkeI25zKzsHM5QAN7hhqMO1oPjeMBQ5FCjhod4K3qn0ysIEMB9CBPACH0Q3RG3949QhkhoeG8hABfHr9IYjcYAKigAC89GACI4JFodAx-AtEtw+NZsjNGkjnPUyo0AOLafzALZERh5bD4RHEDj8dYRXZUfZQPSMegCM4WAC2SDA00E-HIXGIIH5KFGaAsXIpWx41mczneYgwByqlDw6tEAHcABZ6DBQazPV4rFnlbXAHmc7kCoW2A4Cfhciy2lVqomcq5TW14J3CiZuyoWGjjCCqlYoW5IADWetSID0EDQNCaOuD1lD-CoFmqf0tk3oiWTIJBQgA9NWoJSoHhDaN9fXDUgDnCwFB9VsE-R9VzDQ70Rg8L0BsMxhNBQmIHFERwcVY8VBHLwreFPg8JtYwVOoSq1lBU+maNCZkDnCrulX9xCJoYj9bRGyOVQ+vz7VwAGzmABM5gAJzmAAHDwnTlGItZttATZbPAHInLBUAAMzhG+Bz7Ag9qzvOjDWAA5EghHmIRKCkVAhGDJRhE0LREC0YYhE+qyewHDKsq4Ym+GIOaLwQOYvz-IJ9YCeYFqiZJrFiJs2yYTIVDmHg5goEoyFdrmn4qY2zw6Zx-yqmsvowQA6tA7a1FAuwILcwz1uAEBlrQkx9JSuz8mAmrTgAhL6lxmigKxvrKEAWGgow4NYAAGAAkqwTAAtFAACMQKNPFQaUgAqmAkAIAAwkgAIqkC0UyaIlagjeQhAA) and check that the types in `f` are indeed correct by hovering over them.

## Understanding IterableArgs

Here it is again:

    type IterableArgs<IS extends Iterable<any>[]> =
        IS extends [] ? [] :
        IS extends [infer I, ...(infer IT)]
        ? I extends Iterable<infer A>
            ? IT extends Iterable<any>[]
                ? [A, ...IterableArgs<IT>]
                : never
            : never
        : never;

First of all, note the pattern

    condition
    ? then_expression
    : else_expression

I use it a lot to make my code more readable, at least for me.
Here's another important pattern:

    condition1
    ? condition2
      ? condition3
        ? success
        : failure3
      : failure2
    : failure1

The *failure* branches are not that important since they will never be taken when everything works out as it should. They're needed to complete the **?:** expressions and make the compiler happy.

We could also write it as

    condition1 ? condition2 ? condition3 ?
        success
    : failure3 : failure2 : failure1

In *Value World* we'd write

    (condition1 && condition2 && condition3) ? success : failure

but *Type World* is more limited.

In *Type World*, *casting* is done like this:

    T extends number ? (here T is a number) : else_branch

*Destructuring* is done like this:

    T extends Array<infer A> ? (here we can use A) : else_branch
    T extends [infer X, infer Y, ...infer ZS] ? (here we can use X, Y, ZS) : else_branch

and so on.

Since *casting* and *destructuring* require **?:**, we need to use **?:** even when the condition is always true.

Now that you're more comfortable with the *structure* of the code, let's focus on the *meaning* by rewriting `IterableArgs` in a more familiar way (it won't compile, obviously!):

    type IterableArgs(IS: Iterable<any>[]) {
        if (IS === []) return []
        else {
            const [I, ...IT] = IS;
            if (the destructuring above was successful) {
                const A = I.Arg
                if (I is Iterable<A> and A was extracted correctly) {
                    const IT2 = IT as Iterable<any>[];
                    if (the casting above was successful) {
                        return [A, ...IterableArgs<IT2>]
                    }
                }
            }
        }
    }
    
`IterableArgs` is a simple recursive function and it works like this:

    IterableArgs<[Iterable<A>, Iterable<B>, Iterable<C>]> =
    [A, ...IterableArgs<[Iterable<B>, Iterable<C>]>] =
    [A, ...[B, ...IterableArgs<[Iterable<C>]>]] =
    [A, ...[B, ...[C, ...IterableArgs<[]>]]] =
    [A, ...[B, ...[C, ...[]]]] =
    [A, ...[B, ...[C]]] =
    [A, ...[B, C]] =
    [A, B, C]

## Is that DRY?

*No, it isn't!*

The first problem is that that recursive pattern is ubiquitous. In *Value World* we would just use `map`:

    iterableTypes.map(t => getArgument(t))

Why is `map` so important? Because it encodes a pattern which comes up over and over again in disparate contexts.

The second problem is a minor one, at least in this case, but still annoying. What's the point of the line with the arrow?

    type IterableArgs<IS extends Iterable<any>[]> =
        IS extends [] ? [] :
        IS extends [infer I, ...(infer IT)]
        ? I extends Iterable<infer A>
            ? IT extends Iterable<any>[]           <-----------------------
                ? [A, ...IterableArgs<IT>]
                : never
            : never
        : never;

Simply put, *Typescript* can't infer on its own that `IT` is of type `Iterable<any>[]`, so we need to use *casting*, which, as shown before, requires the ternary operator **?:**.

# What We Want

**We want a function, *TMap*, which takes a *function* and a *tuple* to operate on.**

We'd be using it like this:

    type GetIterableArg<T> = T extends Iterable<infer A> ? A : never
    type ListOfIterables = [Iterable<number>, Iterable<string>, Iterable<string[]>];
    type ListOfArgs = TMap<GetIterableArg, ListOfIterables>;
    
    type TMap<F, TS> =
        ....
        F<T> ???                // where T is in TS
        ...

As expected, the implementation of `TMap` is not that straightforward.

# The Problem

Let's consider

    type Type<A, B, C> = ...

I will say that

* `Type` is *FREE3*
* `Type<SomeType1>` is *FREE2*
* `Type<SomeType1, SomeType2>` is *FREE1*
* `Type<SomeType1, SomeType2, SomeType3>` is *FREE0* or *FULL*

In general, **a type is FREE*N* if it has *N* free type-variables**, i.e. *N* "holes" with missing arguments. The operation of *filling* the holes is called *BINDING*, or at least that's the term I'll use here. It should remind you of the JS function `bind`.

**A *Type Function* is a FREE*N* with *N* >= 1**. Let's call a Type Function simply *FREE*.

The problem with *Typescript* is that **we can't pass *FREE*s as arguments to other *FREE*s**.

For instance, consider this:

    type ToArray<T> = Array<T>                  // ok
    type ToSet<T> = Set<T>                      // ok
    type WrapInCont<ToCont, T> = ToCont<T>      // KO :(
                                       ^^^ not allowed
                                       
I know the code above is contrived, but it's just to keep things simple.

# The End Result

Let's have a look at the final result before diving deep into the technical stuff. I hope this will motivate most of you to keep reading till the end! :)

Here's the same example again:

    type ListOfIterables = [Iterable<number>, Iterable<string>, Iterable<string[]>];
    
    interface LObjs<T> { 'Iterable': Iterable<T> }
    type ListOfArgs = TMap<'Arg', ListOfIterables>;       // [number, string, string[]]

That works because I've already implemented a *FREE1* `Arg` which works with every *LObj*  (**L**ifted **Obj**ect).

To make `Arg` work with `Iterable`s as well, we just have to add them to the `LObjs` interface.

Please take a moment to appreciate the ***beauty*** of ***interface merging***. In the code above we're adding a new property to the preexisting interface `LObjs`.

But that might just look like an ad-hoc solution. What if `Arg` were not already defined? What if we wanted something different? No problem:

    interface Funcs1<T> {
        GetIterableArg: T extends Iterable<infer A> ? A : never
    }
    type ListOfIterables = [Iterable<number>, Iterable<string>, Iterable<string[]>];
    type ListOfArgs = TMap<'GetIterableArg', ListOfIterables>;

Again, we can define functions and *LObjs* ***in-place*** thanks to ***interface merging***.

Now `zip` simply becomes:

    function* zip<TS extends Iterable<any>[]>(...xs: TS)
              : Generator<TMap<'Arg', TS>> {            // DRY way
        const iters = xs.map(x => x[Symbol.iterator]());
        let nexts;
        while (true) {
            nexts = iters.map(it => it.next());
            if (any(nexts.map(n => n.done))) break;
            yield nexts.map(n => n.value) as any;
        }
    }

Again, `TMap` applies `Arg`, which extracts and returns the type argument, to every type in `TS`.

# So what's the trick?

It's simple! Instead of

    type ToArray<T> = Array<T>
    type ToSet<T> = Set<T>
    type WrapInCont<ToCont, T> = ToCont<T>      // KO :(
                                       ^^^ not allowed

we use

    interface Funcs1<T> {
        ToArray: Array<T>;
        ToSet: Set<T>;
    }
    type WrapInCont<FName extends keyof Funcs1<0>, T> = Funcs1<T>[FName];
    
    type Arrays = WrapInCont<'ToArray', number>;        // number[]
    type Sets = WrapInCont<'ToSet', number>;            // Set<number>
    
(I use `0` because it's shorter than `any`, especially with something like `Funcs5` where you need 5 of them! The types used don't matter when we're just interested in the keys.)

I hope the trick is clear:

1. Instead of passing the actual function, we pass the *name* of the function, that is, a *reference* to the function.
2. Since `Funcs1` is not passed as an argument, we can certainly write `Funcs1<T>` inside of `WrapInCont`.
3. With `Funcs1<T>` we ***bind all the functions at once***...
4. ... and with `[Cont]` we retrieve ***only one*** of the ***already-BOUND*** functions.

Note that this trick would be much less valuable if it wasn't for *interface merging*. (Have I stressed enough the fact that I *really* like *interface merging*?). Imagine if every time you wanted to define a new *FREE1* you had to go to the file with the type definitions and add it there. It would still be doable, but much less convenient.

# TMap

TMap's implementation is very straightforward and I think the code below speaks for itself:

    type TMap<F extends FREE1, TS> =
        TS extends [] ? [] :
        TS extends [infer H, ...(infer TS2)]
        ? [APPLY1<F, H>, ...TMap<F, TS2>]
        : never;

It's just like `IterableArgs` but simpler and, yet, *way* more general.

For now let's pretend that `APPLY1` is just *syntactic sugar* for the trick with `Funcs1` we saw before, that is:

    type APPLY1<F extends keyof Funcs1<0>, T> = Funcs1<T>[F];

Let's rewrite it a little better:

    type FREE1 = keyof Funcs1<0>;
    type APPLY1<F extends FREE1, T> = Funcs1<T>[F];

If you go to the actual definition, though, you'll be surprised:

    type APPLY1<F extends FREE1, A> = FEVAL<PUSHARG1<FUN<F>, A>>;

You're still missing some pieces, so don't worry and *keep reading*!

# Is that it? Are we done?

Aren't we forgetting something? Let's try to write a *FREE2* `Comp` which takes two *FREE1*s as arguments and *comp*oses them:

    interface Funcs2<T1, T2> {
        Comp: T1 extends FREE1 ? T2 extends FREE1 ?
            ???
        : never : never
    }

How are we supposed to return a *FREE1* function???

To create a *FREE1* we need to add its definition to `Funcs1` or we won't be able to pass it to other functions. Is it even possible to do that *programmatically* inside of `Comp`? Not likely.

Should we just add the new *FREE1* *manually*? No! What would be the point of having a function such as `Comp`, then?

Should we give up on returning *FREE* functions?

# *FREE*s that return *FREE*s

What about *binding*, *partial application*, *currying* and all that?

Let's say `Comp` takes 3 arguments:

    interface Funcs3<T1, T2, T3> {
        Comp: T1 extends FREE1 ? T2 extends FREE1 ?
            APPLY1<T1, APPLY1<T2, T3>>
        : never : never;
    }

Now let's say we implement a *full BINDing system*!

Let's generalize things a little: a *FREE1* is not simply a function defined in the interface *Funcs1*, but a function with 1 hole, so it may also be a function in *Funcs2* with its first hole filled, a function in *Funcs3* with its first 2 holes filled, and so on.

What happens if we do this:

    type COMP<F1 extends FREE1, F2 extends FREE1> = BIND2<'Comp', F1, F2>;

Since `Comp` is a *FREE3*, if we bind the first two arguments, then it becomes a *FREE1*, that is, "`F1` compose `F2`" (as a mathematician would say), which is exactly what we were looking for!

The beauty of it is that `BIND2` (and any `BIND` in general) always produces a *FREE* function without the need to add it to `Funcs1` by hand.

`BIND` doesn't do this by adding the function itself. Instead, the *simple representation*
    
    funcName

(where `funcName` is a valid key of some interface `FuncsN`), is *extended* to

    [funcArity, numMissingArgs, funcName, Arg1, Arg2, ...]

where `funcArity` is the total number of arguments the function can *originally* take. That also identifies the interface, by the way, which is

    `Funcs${funcArity}`

The functions `APPLY` and `BIND` accept functions in this *extended form*, but the *simple form* is still allowed, of course, so one can still write

    BIND2<'Comp', F1, F2>
    
instead of

    BIND2<[3, 3, 'Comp'], F1, F2>
    
which would by quite inconvenient to write.

I also wanted to support *overloading*, that is, the case where the same key (i.e. function name) appears in more than one `FuncsN` interface. Easy solution:

    'MyFunc#1'          // refers to MyFunc in Funcs1
    'MyFunc#2'          // refers to MyFunc in Funcs2
    
## Note

The `numMissingArgs` field was only added later on as it became apparent that it was necessary to reduce the complexity of the implementation.

# Full Implementation

You can find the [full implementation](https://www.typescriptlang.org/play?#code/C4TwDgpgBA0gogTQPIDEUGUoF5aNSgRigB9dk0AmEs-AZmvnJQBYG80BWAbgChRIaaIjgDWEEAHsAZlBQBXAHYBjAM4EAPAAYAfL37RG+KqPHTZi1RS0AaKDr3gD7FPROSZ85Sto27t+3yOgizYUGLu5l7Mvpr+-rqBAoacoeFmnqocMXF+dgk8APQFUABKEGAAThAqEArAAIbAAJYSClBm9VBSFs2tAFyFxVAA2t3KAIIVTaC2CnIAtgCyTSoqTQoA5pMbKrZjSgBy9fMQtgB0F-UVOwC6PINQAJJtG7UQFfUANrYoJXBwBygKygnX2vTaAHcABZNJRQqANMQqKCAq4bBa1YAqM6JaAAfTxv3+mlCw3qChAOQuZ3JIGGNxuDgEBKJcGEI1ptgI50uFPpjNxUBZfzgxg5FNsFB5NL5DKZ+MJItc4spUFo0tp-PlQsV-1YODJEqgzA1soF+h1rI4pM5UA4prpcvuFuF-xtRoIxAoxFoxGYxHtUGpmqdD3GUFeCneXygKgknzk4KByLAElWTQARp9oBnE1AFBJgFAIRIKsB4dMoAAKKSl-MSCEAShxRRRhYgfSgAANNH1NF2QQA3CRNAAmyKUpajFSgSnqNWxgoAInAAMJ4gAq4wAQgAZOChADePCgp7sfa5F6gFD63LVfSlxr66rtfRNUAAbH1AwB2Pof2wAA4+h-WwAE4+kArlezAngAF9eEFdAAFVt3UA4iAgAAPYBanHMJTBkFd1y3Pc4FsA4qGw3CFHwtIiLXTcd33bRsBPM9KKgai8OREkAH4USITsULQ4imLI4YMJuWwxNI-dJIoG58gtES8QOVl1BQLicJ4y0RQo7SaLowioFk5i4FYrB2NPLTuNo5FhnWKR3igcZbCclz1P0oMLg8mcN3QG4oAEry3Ts-DXTgYYCCCvjrLPU9hjcqARPQ1kKO0aUAruBLOyjQcXLyiACoqRDWwOJANzgAZWygDcoWgWsKnmRoRjmeYQWuXYugsfNjlOHyaS6oKvk+BtkQkEqxvqUd1g2FshhQOt1hUBplAGiFoDnNooXqAqaqGBLhkfcYDiXaU7lqo6X1O87Bsuw6z2Gd9bouh46oahEoSqaBbs66BRwgKR1ggUcgTaDIVEfSGX3JMHIffKoVEgJRmgKz4QBxB4LRQZCDnXFdt2QgBxTTDN03H8cs96zy7YYABJDxQYZNBuODbEZ5mYvZ+7q2zNocE54YAHJ+Y2cthbZxsu0Qi0AAVkPQAAJcYSmJjRbJ0+y9P+WxxkskZqVU0K4E0rlMtc80ggV5XVeJqxNaM5FIr1u9xgoA3hiN1C1I0lBJQt8Y3cU7UbZVtWfEd3SXdc4O9doT3ve3X2RTNtVA7j1zaCtgQw7t6Io+1mOg71k6buYROLmNv3bAr13S-jvXmBz6A87VrJC4i3VyNjhus6bvWOErs5q9T-27QzvvxnLweBQeOAtcBsHGHQfBqya9opokGa5ubQU4GSDBQgP5wiFIE+mCoc-D-oa-nFYO+mG4ffD-ZV-qHoqBD2GERweCIh5zdkZiIOCABiAgXYbidk0AhF+zgxSHyvgRCI39f7rGCFQQBXZgFgIoJA6BsCLQXzoKEG+H8TKoL-mQrBODQG0HwXYQhQRiFoH1MEB+yCzCUPQYfVgNDDwgNAcwBhMDtQsJQNaHAh9rSkE-twto0iQTImwQIsBHARGwIeKyQE4Vnbd0BBmEAIJRyzU2AiEsUAMxXGgKtKYZiCwNHBIuVsjwZAACIMhHBOG45MX1oAKH6u0GQoIegtEhDCOECJ6hIjVJ1dEJw6jdVaFtckDwvhxigHIGoUAPEWC8RAHxdZcnKHyXQnxVZyzQE+I0XCM5RrjU3u8aapiNh7xxiKEkBpbSxEGiGFusgRTskNKqO8wYzTUHEQQbUrIxTDMlA6fkEzEHTKVO6VUL4xmOiCo-OgKy9RrNrgshkSz757LgJIlUthAybMWTszgZVijhkjNGT4sZ4yJjCb41M6Ysw5jzA44spZyxAiLDWOsBYmw4gtBuJABxkKLHEvuI88VhYEGFreWwwsKDosfMLWg6KXzC2YOi98wsODosDMLD86KAJQGFj+dFoE6WAXRVBOlYF0VgUxQQTQ6KeXwVlkESmZNdE6wPHcjA1MEqdz0ayYKsgoADGleTbWKi-KyAOGAxm6rNUDjiglBKOjF7Ik-jCuFCK5IHgEsMM18LEVRQONJOqsK7WWskk6lAjr4oGp9b6v1PqiolUVfFGV-95XRS5D8IKSqzyhsQeGx80No0hpVfhMh1qXwvhQMm5VoreHhvfO+bNwbc3GuCNaa1gZAzFpjaefK7xBUCG3I8M6GtU3IhmcQVkvpWT+itHrA2bd1aaTxppQOCQLTNrOg7dtAz-g9pFH2kUgYS6uQ9qEIdDtR0oEnmuidQQp1LkjrO3tXbl31zXfHQditw7E0jtu3d7sr3akPQXE957e6Xv7q5CuG6b35xHQcMdF6n3fvGBXXgrZKlVGFsiAsUBD0cGdEEcYcs5a7gQG20VrI3YGxQHAAAauMXc6gh0awfQO-dAhUPoYQDO7DIoTrBzw4R4jpH-1qy3UBndIGPZUd+mhjDx6GPzt41e0I+GiMkaHfe7jj6y7aH465QTCA30ibgC9TO08m4sak+x22asC4Uc-aB7TP7FPahoxhju77-grq0zPVyQ8JOsekxx4mHdjOrtM458YQ98jlXbCoA6UAAC0H1oAVAkIoMGYBrF1Aaguf6UAABWWSiwbyqDNeoGYmifGmJjB44X6rQGi7UnJuifHoDgPuVcAVbDQjy9ASp4NpztCjLYDMEBgCbVqFAOLVQEvVGqNYGmwIsmgyUSCOqCA5YHlXOMdAG4FphZyaG1kmgfEljkJ8MGVQACOcgmhVGmxaOcq0-5WYQAAKihUK1zZMCjXds3AEk12ChStjbOiNuR1WeulOqxbsVvVnirJ62d78BKQw0ItlmSlhieujfmYq7xGwlq+6K46OQ-sHABwoZyM4gfBRB6eMHRqnYYPlZDKwsPWZ63QNFeHiPFXI5Kmj2tCrMcvh6TjvHBPXKBWJ36snEPnD0ChxYbw6hadOthzFenx0meOpZ-Wio7OU2Y-fDz-HLl-uDUB4L-VvqRd5vvlTyX0QZcK-lwLxXCvs7aAR8rwNqP0c2W+4GbX-O9fUgN8D4X4PTdP3N14LIVvbc29h4pe3suGfN0d8zl3au3es-ePcKDQQkAwHZFdjQP27zCw3BISYHwQCS1mAsLrFRdC+tbO1Kv9JsaZ5gGKXP6hC-F4qKX4WFf5hV5r-6g1dfK-vEbxngQWflRt47yX+oIBwE9-zCP6vXBB9nmH330fdxBS7iQNuAAUuoDcBtd8ZhSyoI-jvP6n-P5f-pdtL+hA3LO3fB-1CA9YgJcMSftSrlhegI-AdZFI6NBNoa-JAM-C-WkbQKBKAOAAARWQkAKgBvwvwf2PyvyUlnWAAqDkAgBJzXzXwElQOl0wJVxR1KnghGHAMgPUGgLnnWFqSkHqCUGgGh0f0PDgh4EYPeGYNYMiEsCPzvA3HXU4O4LqF4JYLYMlx8A3GEMfA3ATi-i4J4IqD4OkKiCENsBEO0JfA3F-TENUPUIEJUCyDkO0IUL0PfA3GczENbG6yUGpHuCMKkJQIgNv2P2UOQwEA3EWHqDABFTLRw20PQE+1PACm+1ihGBzTPAiMx3VSVmlCrHVQCgoEbByjPGtTb3HiVgtmpF8P8LTlSJgPih-28OgA3BQDy1qUCIp2CLqlCLYgSjiLLXpHDRiPCMwHiJ1xnESMGmSJ6IaLSIyNPC-xUw1lsFyOwNwOgGtT6PyKqM+BqPHmKKR0qOqPeCKPQA9lKNT0oMFEqOqWAD8ICPW0GRCLCIaMiPaJTxaIp0ckGPmIuAGP51SPSKFzPGyMmNYlFRDHimtWpC+KgFyKyhQCOJOK2I9hGPIKDTKIeF3CaCkFwjBncIgFRhUHEKYNcJIM8OPASlnxAE7AJMv14ASnQG62Em6xJIFWcIkLUNcPYNxPim2CJLVmpOaM71LyJK7zn3ZNjSi3mAJM7Gf1FWJI-3lW-z2NJM+J5JACL3JOAGFNnTFMGP1nlQVNIJhIbWZOuCLwOGX07D-wOAAI3F73714E0SIUQK0LqnXRwDkNnREPlSdNFQdIEhwLwJZ2YM+GyU7G9JqEQhcP4OpxtJENYjxLPFXFaGCygCNJNPkISGaJOOFMwiCMGWdIhPMNtNYjKOaMWNqRTJeyIAEnWKWM2KzLDK1MoLzPBP8MLPU2LLqjBMaEzITKrItPTwKFC27J7N7L7P7IHMHKHOHJHN7MGFHInMnKnOnPHOnIHIPAAA1XIoBFgoA5YUC4CUows5zRzZydz9yDyRy9zDyTzTzQtOyzzLzDyHgCiwBjyryHyJyDjHBkQDR693gzSPzYwcC5pOsJB4wIByRbANThZ6gwLhYYDLNZTXy6oISZ9ZTF8NwXyB9CCoBWwkpZT1Azg8iLg7hoUXyxRbz28UABSCTF8CSVAlNVwGolARB2QECkCkLIBuomLqgPZV9UKh9igPT8CVJusYKiLhYCT5TutyLoKULB90KNTsK3oLRxhPhXkDRAToLpQFSVB+lWLvAn84LthyKFKqKaKRAxQGKj8XyXwvYLhNKsoXylIOLTwoMZjBQAB1aYKEfUzfCoASnS3UiQdyqvPSz4ALLsx8kK3c1sUs2pe80K6KscoMjQ1QDQXEwg1sScOQMsaoIxMwOKqAE4a4OaeKJWecPy94Vk0mTw0Vd8mcd0mYr09JCADsi0JABQDGFy8sYqzyp-fMzY4WQqlQdqgKoKmKoavsm85s44-wqK4a0KzEyQ4MyXRK8M+KDcaJCADcCEWEDsEYU0uqAUBKcKlapqlq1y9qoklTdvXq-q7Qn4stHi8NDcJHekaU8Ig65qkAVqtyg01yNk8qstSqu6h6xkWvYoNYeYMAbMCoeCQUMoSARoUGTSzq2sgIwvFatajaxC5C7UQ6t6465fKGBGlswo5GsQLG96y61yfS3-Qy5UEykmnGjy7qWmtq3G9ii8qa4ah4bcdYFpEEWiKAKoYANKhQOaHqZQJxSatmh8ma+kuarwWQ+Q3QxahKKM0G+stM-4Rsl0tWtkD4n1NvLMvWywxTXY1XdsyG6FCQBUgk9kIiw9KwYWZWsAHvAgziv1Q9DQe26MxfDU6AzKZ2l2n1N29vKMhQFQMS0vOgikRTX2-2v1TSoKuAgqNoLrYAAswUP-RYOWTSVMuo842QKiLWggA2W2oOiQUGxfQgH4Fm82y22UwiiE9OzOwOj2kOr2qkn20bGOwgpu4O0OvWTCn26Ozug1OOymtEkQNhEykS4AK27Qi27rAklmwUA4aoZE+Gg0H7d8dqp1EWXuulDMRfWxOabenivYOqv8gC8kUMFxGQTaYsckIsYACQfrecZEW8hEJ+6YGoT4KQBrfxCASbR+qAa7fLJE57aYHEbKkMis0Qpa5MuqbOimdMks1siwnMqUs2oITSthG2ltJcd228xfbuz24CtuyOxTDuzu5e1aOGjGzslA0S5EQGScUGtMaAcBh4A4dsL6VqQ9EET4CEOfFMKLUcOQVg5EEB5EkW1GMJRcau7rUIIhlukh4ACOkACzA4uQMG1aueosHAJugh2ehUpTTSi5IijcTR7MKeiiFemh5igysei5Sel86wl8oeB5CWoa8Wjxs8rxqc9ckoJ4FEWMwJ9cx4KAZCFcyWoobx6K3xmJg8uh+qYEYEaEd4NhosUab8q4SRuGesCEEFKAMaCQEQZEQ7aYZrKYQcJoL4LGOvVoULJcEoBAO+oxNmwUR4WpHLbMbYC-R4LostDp6MX5VRx3LAqyBKPp6461Dop4fp+49VR4JIhZjcdI-4wJ0VQZj4YZj-AggSR4EUgZzp4Z6AxvQgrI6UTZrpiAHp9QfZkowgpPAgx53KdB1seJ-suhxp5pgR1pjxqW4wnExWs8YWS535dFJ4I57MS-SGt595scngMET5WkKsLCGM0FqF6AtHCM08DeKsScEOosLCIJKAVFtHRE6sLCNHfmwWhEGYp6vm7rGl-0+qyGhF0JVoZ7AALyaACLuN0nRYgBGfpG0CrGpFReFPQEbAIKuk7GJjeA+EfoqFucheua6iP1CPDLXzqYUAaaaZab9tlflcaFLCP28o2EQo1a-mSuKC+f1YSnxYu3KY6pwFRbOBajABRewFYiwmGHQBAD73jDOCdeNYqBuCrEbEbHpezCLCjBwhUHpca2zGrB4qxYINjaxFCCdexHdeSN0dYnAfTfDcjYIPJarGRfTezf8KrAFlYgUDOFHGSQjbRwzCyxEHpYShACaAgF22RzjbdarZrfzDOEHC+DwLR0AVpHpa4K4LZdFs+RajEE2cv1FYuHFbqnpFTYSmpYqDaBrHZYUGu3Datc7e7dHGe1RbgkbHDY7NnekdaC6CPexdnGjJjYWBguGFpUfC5SgEAkBv9Sg0+hUChCBRXuJZa1oHigdaLFsRgoXYgE2arFAsX2Fn3sxSUGQ9HGQ4gGQ6kGFmLftZfcsX-J9NCDg4Q5Pq6DPtpbwNsAo5Tfpdxag7alsG6gzCCjMG5Y9fam6hg-Pp9Ija-mleKCcugF2gKmfa7zRIfpfJ5rBnqETAkGYa0fBAAEIS2ZAqwMw0cHWAKzgxoNgqwVE2hwsCA4JOxGZsRH7kIwBIAKhVx5wIBw24Iux8Ozxp37gpBr2eAgA) in TS Playground, together with the examples presented in the next section.

***You should keep reading for the explanations, though!***

# Some Examples

## CONS

`CONS` is a function that can *cons*truct objects registered in `LObjs`.

We can register the objects like this:

    interface LObjs<T> {
        Array: Array<T>;
        Set: Set<T>;
    };

Now we can write:

    type OK1 = CONS<Set<any>, number>;                  // Set<number>
    type OK2 = CONS<Array<any>, Iterable<string>>;      // Iterable<string>[]

Note that the specified parameter `any` is completely ignored, but needed to make the compiler happy.

Do you remember the following example?

    type ToArray<T> = Array<T>                  // ok
    type ToSet<T> = Set<T>                      // ok
    type WrapInCont<ToCont, T> = ToCont<T>      // KO :(

Now we can just write

    type WrapInCont<Cont, T> = CONS<Cont, T>;

## ARG

There's also a convenient `ARG` function that, like `CONS`, only works with *LObjs*, i.e. objects registered in `LObjs`. Here's its definition:

    type LOBJ<T> = LObjs<T>[keyof LObjs<T>];
    type ARG<T> = T extends LOBJ<infer A> ? A : never;

This is based, it appears, on a nice feature of *Typescript*:

    type F<T> = T extends Array<infer A> | infer A ? A : never;
    type OK1 = F<Array<number>>;        // number
    type OK2 = F<Set<number>>;          // Set<number>

Note how `infer A` can appear twice (or more) in the same `extends` clause.

In this case the order doesn't seem to matter, so using

    type F<T> = T extends infer A | Array<infer A> ? A : never;

will give the same result. It seems *Typescript* gives precedence to `Array<infer A>` because more specific, but I'd need to do some more tests to be sure.

Anyway, in our case:

    ARG<Array<number>>
        = Array<number> extends LOBJ<infer A> ? A : never
        = Array<number> extends LObjs<infer A>[keyof LObjs<infer A>] ? A : never
        = Array<number> extends LObjs<infer A>[keyof LObjs<any>] ? A : never
        = Array<number> extends {
                                    Array: Array<infer A>;
                                    Set: Set<infer A>;
                                    ...
                                }[keyof LObjs<any>] ? A : never
        = Array<number> extends Array<infer A> | Set<infer A> | ... ? A : never
        = number
        
This means that `ARG` is able to extract the argument of any *LObj*.

## Other utils

I also implemented `TFilter` and `TFlatMap`, and set them all *FREE* by *lifting* them up like this :)

    interface Funcs2<T1, T2> {
        Cons: CONS<T1, T2>;
        TMap: T1 extends FREE1 ? TMap<T1, T2> : never;
        TFilter: T1 extends FREE1 ? TFilter<T1, T2> : never;
        TFlatMap: T1 extends FREE1 ? TFlatMap<T1, T2> : never;
    }

Now we can pass those *FREE2* as arguments to other functions (*FREE* or regular functions).

## TMap

    type Types = [number, number, string, boolean, Set<'aaa'>];
    type Arrays = TMap<'ToArray', Types>;               // [Array<.>, ...]
    type Types2 = TMap<'FromArray', Arrays>;
    type Check1 = EQU<Types, Types2>;                   // true
    type Sets = TMap<'ArrayToSet', Arrays>;             // [Set<.>, ...]
    type All = [...Arrays, ...Sets];
    type Types3 = TMap<'Arg', All>;
    type Check2 = EQU<Types3, [...Types, ...Types]>;    // true
    type WithNumbers = TMap<'ArgToNumber', All>;

I wrote those examples before `BIND` even existed. Bad times...

## TFilter

    interface Funcs1<T> {
        HasNumber: ARG<T> extends number ? true : false;
    }
    type OnlyWithNumbers = TFilter<'HasNumber', All>;

## TFlatMap

    interface Funcs1<T> {
        TakeTwice: [T, T];
        // TakeOnlyWithNumber: APPLY<'HasNumber', T> extends true ? [T] : [];
        TakeOnlyWithNumber: ARG<T> extends number ? [T] : [];       // simpler
    }
    type RepeatedTypes = TFlatMap<'TakeTwice', Types>;
    type OnlyWithNumbers2 = TFlatMap<'TakeOnlyWithNumber', All>;
    type Check3 = EQU<OnlyWithNumbers, OnlyWithNumbers2>;

## Binding and returning functions

    interface Funcs3<T1, T2, T3> {
        Comp: T1 extends FREE1 ? T2 extends FREE1 ?
            APPLY1<T1, APPLY1<T2, T3>>
        : never : never;
    }
    type ToSetArray1 = TMap<BIND2<'Comp',
                                  BIND1<'Cons', Set<any>>,
                                  BIND1<'Cons', Array<any>>>,
                            Types>;

In the example above, `Comp` composes

1. a function which wraps its argument in a `Set` with
2. a function which wraps its argument in an `Array`,

so the result is a *FREE1* which takes `T` and produces `Set<Array<T>>`.

We could also decompose it a little to make it more readable:

    type COMP<F1 extends FREE1, F2 extends FREE1> = BIND2<'Comp', F1, F2>;
    type ToSetArray2 = TMap<COMP<BIND1<'Cons', Set<any>>,
                                 BIND1<'Cons', Array<any>>>,
                            Types>;
    type Check4 = EQU<ToSetArray1, ToSetArray2>;

Now let's consider a tuple of tuples:

    type NestedTypes = [[1, 4, Number], ['s', 'b', string], [true, false, boolean]];

If we want to pass `TMap` to itself, we need to *lift* it (yeah, I've already mentioned that, but it bears repeating):

    interface Funcs2<T1, T2> {
        TMap: T1 extends FREE1 ? TMap<T1, T2> : never;
    }
    type Types4 = TMap<BIND1<'TMap', BIND1<'Cons', Set<any>>>,
                       NestedTypes>;

Let's decompose it! Note that `BIND` always produces *lifted* functions.

    type ToSet = BIND1<'Cons', Set<any>>;
    type TupleToSet = BIND1<'TMap', ToSet>;
    type Types5 = TMap<TupleToSet, NestedTypes>;
    type Check5 = EQU<Types4, Types5>;
    
# The End

I hope you enjoyed the ride! Although this is just a *POC*, it should be easy to extend. Right now, it's neither complete nor clean as I put it together in a couple of days, but I think it's a solid start. I did it just for fun, as always.

This reminded me a little of *Template Programming* (C++), but that was *bona fide* (although *unhygienic*) *Metaprogramming*.

Right now I'm working on a math problem (I'm developing a novel algorithm to train *neural networks*) for *glory* and doing *expdev* and *bug hunting* for *profit*. I'm using *TS* (*Node* / *Electron*) to develop the tools I need, but it was mostly an excuse to play with TS. I chose *TS* because it caught my eye and I wanted to try something new.

I wouldn't mind doing *Type Programming* full time, for glory *AND* profit, this time, so feel free to PM me if you think I could contribute to some interesting project which uses types in interesting ways.

The math problem I'm working on is a risky and all or nothing endeavor, so I wouldn't mind escaping from its clutches... I wish I had a crystal ball... a *working* one...
