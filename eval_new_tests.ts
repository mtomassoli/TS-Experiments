/// <reference path="eval_new.ts" />

type TEST_EVAL_1 = AssertTrue<_EvalExpr<`!'false'`>>;
type TEST_EVAL_2 = AssertTrue<_EvalExpr<`!!'true'`>>;
type TEST_EVAL_3 = AssertFalse<_EvalBoolExpr<`
    ('true'|| 'false'|| 'false') && 'false'
`>>;
type TEST_EVAL_4 = AssertTrue<EQU<ErrMsg<_EvalExpr<`
    ('true'||'false'||('false' && )'true')
`>>, "PARSE ERROR: Unexpected ')' parenthesis">>;
type TEST_EVAL_5 = AssertTrue<EQU<ErrMsg<_EvalExpr<`
    ('true' || ('false' && ('false') || 'true')
`>>, "PARSE ERROR: Malformed expression">>;
type TEST_EVAL_6 = AssertTrue<EQU<ErrMsg<_EvalExpr<`
    'true' || 'false' || 'false' || 'true' || 'false' || 'false')
`>>, "PARSE ERROR: Unexpected ')' parenthesis">>;
type TEST_EVAL_7 = AssertFalse<_EvalBoolExpr<`
    'true' ^ 'false' ^ 'true' ^ 'true' ^ 'true'
`>>;
type TEST_EVAL_8 = AssertTrue<_EvalBoolExpr<`
    !('true' == 'false') && 'true'
`>>;
type TEST_EVAL_9 = AssertTrue<_EvalBoolExpr<`
    !('true' == 'false') == !!'true'
`>>;
type TEST_EVAL_10 = AssertTrue<EQU<ErrMsg<_EvalBoolExpr<
    `! test_*'SDF' && 'true'`
>>, "EVAL ERROR: test_*: unexpected argument `SDF`">>;

// Test short-circuiting.
type TEST_EVAL_11 = AssertTrue<_EvalBoolExpr<`'true' || test_*'SDF'`>>;
type TEST_EVAL_12 = AssertFalse<_EvalBoolExpr<`'false' && test_*'SDF'`>>;

// `&&` and `||` return one of the arguments.
type TEST_EVAL_13 = AssertTrue<EQU<_EvalExpr<`'true' && 'asdfg'`>, 'asdfg'>>;
type TEST_EVAL_14 = AssertTrue<EQU<_EvalExpr<`'false' && 'asdfg'`>, 'false'>>;
type TEST_EVAL_15 = AssertTrue<EQU<_EvalExpr<`'true' || 'asdfg'`>, 'true'>>;
type TEST_EVAL_16 = AssertTrue<EQU<_EvalExpr<`'false' || 'asdfg'`>, 'asdfg'>>;

type TEST_EVAL_17 = AssertTrue<EQU<_EvalExpr<`'true'`>, 'true'>>;
type TEST_EVAL_18 = AssertTrue<EQU<_EvalExpr<`bool 'true'`>, true>>;
