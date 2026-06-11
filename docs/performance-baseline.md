# Performance Baseline

Generated on 2026-06-11 with:

```bash
npm run perf
```

Environment:

- Node.js: `v22.21.1`
- Platform: `darwin/arm64`
- Runner settings: `warmup=1`, `iterations=3`
- Cases: `1401 measured`, `295 skipped`, `0 failures`

## Baseline Before Source Optimizations

Top groups by total evaluate time:

| Group | Eval ms | Compile ms | Cases |
| --- | ---: | ---: | ---: |
| `performance` | 693.469 | 0.382 | 2 |
| `target-path` | 643.179 | 0.397 | 2 |
| `target-number-format` | 13.644 | 0.091 | 1 |
| `target-date-time` | 10.185 | 0.159 | 1 |
| `target-hof` | 7.630 | 0.134 | 1 |
| `joins` | 6.752 | 3.600 | 39 |
| `object-constructor` | 5.629 | 1.496 | 22 |
| `target-sort` | 5.102 | 0.075 | 1 |

Slowest evaluate cases:

| Case | Mean ms |
| --- | ---: |
| `performance/case001.json#0` | 124.174 |
| `targeted/target-path/1` | 117.136 |
| `performance/case000.json#0` | 106.982 |
| `targeted/target-path/0` | 97.257 |
| `targeted/target-number-format/11` | 4.548 |
| `targeted/target-date-time/10` | 3.395 |
| `targeted/target-hof/5` | 2.543 |
| `targeted/target-sort/3` | 1.701 |

## After Low-Risk Optimizations

Top groups by total evaluate time:

| Group | Eval ms | Compile ms | Cases |
| --- | ---: | ---: | ---: |
| `performance` | 813.213 | 0.399 | 2 |
| `target-path` | 673.003 | 0.439 | 2 |
| `target-hof` | 7.675 | 0.129 | 1 |
| `joins` | 6.275 | 3.451 | 39 |
| `target-number-format` | 6.018 | 0.116 | 1 |
| `object-constructor` | 4.974 | 1.368 | 22 |
| `target-sort` | 4.546 | 0.063 | 1 |
| `lambdas` | 3.936 | 2.047 | 14 |
| `function-tomillis` | 3.765 | 1.989 | 51 |
| `target-date-time` | 3.669 | 0.157 | 1 |

Notable changes:

- `target-number-format` improved from `13.644ms` to `6.018ms`.
- `target-date-time` improved from `10.185ms` to `3.669ms`.
- `target-sort` improved from `5.102ms` to `4.546ms`.
- `object-constructor` improved from `5.629ms` to `4.974ms`.
- The path-heavy `performance` and `target-path` groups remain dominant and are noisy across runs.

## After Root-Path Memoization

Generated with:

```bash
npm run perf
```

Top groups by total evaluate time:

| Group | Eval ms | Compile ms | Cases |
| --- | ---: | ---: | ---: |
| `performance` | 67.080 | 0.415 | 2 |
| `target-path` | 60.778 | 0.420 | 2 |
| `target-hof` | 8.184 | 0.162 | 1 |
| `joins` | 6.855 | 5.184 | 39 |
| `target-number-format` | 6.826 | 0.086 | 1 |
| `object-constructor` | 6.394 | 1.540 | 22 |
| `target-sort` | 5.972 | 0.112 | 1 |
| `lambdas` | 4.592 | 1.560 | 14 |
| `target-date-time` | 4.426 | 0.197 | 1 |
| `function-tomillis` | 4.023 | 3.182 | 51 |
| `target-transform` | 3.638 | 0.150 | 1 |
| `parent-operator` | 3.614 | 2.903 | 28 |

Slowest evaluate cases:

| Case | Mean ms |
| --- | ---: |
| `performance/case001.json#0` | 20.347 |
| `targeted/target-path/1` | 18.608 |
| `targeted/target-hof/5` | 2.728 |
| `targeted/target-number-format/11` | 2.275 |
| `performance/case000.json#0` | 2.013 |
| `targeted/target-sort/3` | 1.991 |
| `targeted/target-path/0` | 1.651 |
| `targeted/target-date-time/10` | 1.475 |

Notable changes:

- `performance` improved from the post-helper `813.213ms` run to `67.080ms`.
- `target-path` improved from the post-helper `673.003ms` run to `60.778ms`.
- The first path case now benefits almost completely because the repeated pure root path is cached for the full subexpression.
- The indexed path case still has a larger residual cost because only the deterministic root prefix is cached; the `$i` suffix must still be applied per outer item.

## After Indexed Filter Fast Path

Generated with:

```bash
npm run perf
npm run --silent perf:json -- --top 12
```

Top groups by total evaluate time:

| Group | Eval ms | Compile ms | Cases |
| --- | ---: | ---: | ---: |
| `performance` | 18.902 | 0.408 | 2 |
| `target-path` | 16.247 | 0.368 | 2 |
| `object-constructor` | 7.716 | 1.474 | 22 |
| `target-hof` | 7.552 | 0.154 | 1 |
| `joins` | 6.710 | 3.966 | 39 |
| `target-number-format` | 6.426 | 0.108 | 1 |
| `target-sort` | 5.412 | 0.096 | 1 |
| `lambdas` | 4.837 | 1.632 | 14 |
| `function-tomillis` | 4.569 | 2.512 | 51 |
| `target-date-time` | 3.761 | 0.142 | 1 |
| `flattening` | 3.692 | 3.296 | 59 |
| `target-transform` | 3.606 | 0.131 | 1 |

Slowest evaluate cases:

| Case | Mean ms |
| --- | ---: |
| `performance/case001.json#0` | 4.131 |
| `targeted/target-path/1` | 3.227 |
| `targeted/target-hof/5` | 2.517 |
| `targeted/target-path/0` | 2.188 |
| `performance/case000.json#0` | 2.170 |
| `targeted/target-number-format/11` | 2.142 |
| `targeted/target-sort/3` | 1.804 |
| `object-constructor/case025.json#0` | 1.670 |

Notable changes:

- `performance` improved from `67.080ms` after root-path memoization to `18.902ms`, a further `71.8%` reduction.
- `target-path` improved from `60.778ms` after root-path memoization to `16.247ms`, a further `73.3%` reduction.
- `performance/case001.json#0` improved from `20.347ms` mean to `4.131ms` mean by avoiding repeated full-array scans for `$i` suffix filters.
- `targeted/target-path/1` improved from `18.608ms` mean to `3.227ms` mean for indexed absolute path access.
- The non-indexed path cases are now in the low single-digit millisecond range and should be treated as noisy unless a multi-run average shows a consistent regression.

## After Lambda Callback Fast Path

Generated with:

```bash
npm run perf
npm run --silent perf:json -- --top 12
```

Selected groups from the current human-readable report:

| Group | Eval ms | Compile ms | Cases |
| --- | ---: | ---: | ---: |
| `performance` | 19.744 | 0.455 | 2 |
| `target-path` | 16.513 | 0.423 | 2 |
| `joins` | 7.527 | 4.790 | 39 |
| `target-number-format` | 7.353 | 0.134 | 1 |
| `object-constructor` | 7.183 | 3.361 | 22 |
| `flattening` | 7.118 | 4.663 | 59 |
| `function-fromMillis` | 6.313 | 8.120 | 90 |
| `target-sort` | 5.792 | 0.091 | 1 |
| `lambdas` | 5.438 | 2.204 | 14 |
| `function-tomillis` | 5.021 | 4.051 | 51 |
| `target-date-time` | 4.636 | 0.314 | 1 |
| `target-hof` | 1.506 | 0.195 | 1 |

Slowest evaluate cases:

| Case | Mean ms |
| --- | ---: |
| `performance/case001.json#0` | 4.504 |
| `targeted/target-path/1` | 3.477 |
| `targeted/target-number-format/11` | 2.451 |
| `performance/case000.json#0` | 2.077 |
| `targeted/target-path/0` | 2.027 |
| `targeted/target-sort/3` | 1.931 |
| `object-constructor/case025.json#0` | 1.928 |
| `targeted/target-date-time/10` | 1.545 |

Notable changes compared with the indexed-filter-fast-path run:

- `target-hof` improved from `7.552ms` to `1.506ms`, an `80.1%` reduction for the targeted map/filter/reduce case in the human-readable report.
- `targeted/target-hof/5` improved from `2.517ms` mean to below the top slow-case cutoff in the human-readable report; the JSON report measured `1.627ms` total eval time for the group.
- The improvement comes from bypassing the JavaScript rest-parameter callback wrapper for JSONata lambdas passed to native HOFs, reusing callback argument storage, and fast-evaluating simple parameter/literal/binary lambda bodies.
- The fast path is intentionally narrow and falls back to normal evaluation for signatures, tail-call lambdas, predicates/groups, non-parameter variables, evaluator entry/exit callbacks, and frame-push callbacks.
- `performance` and `target-path` remained effectively flat relative to the indexed-filter run; the path optimizations are unchanged.

## After Stable Runner And Hot-Path Optimizations

Generated with:

```bash
npm run perf -- --runs 10 --top 12
```

This run averages 10 full benchmark passes with `warmup=1` and `iterations=3`, so the values below are less sensitive to single-run timing noise than earlier report-only samples.

Top groups by total evaluate time:

| Group | Eval ms | Compile ms | Cases |
| --- | ---: | ---: | ---: |
| `performance` | 15.751 | 0.335 | 2 |
| `target-path` | 14.512 | 0.419 | 2 |
| `joins` | 5.578 | 3.880 | 39 |
| `target-number-format` | 5.136 | 0.106 | 1 |
| `target-sort` | 4.753 | 0.081 | 1 |
| `object-constructor` | 4.180 | 1.712 | 22 |
| `lambdas` | 3.827 | 1.521 | 14 |
| `target-transform` | 3.662 | 0.132 | 1 |
| `target-date-time` | 3.530 | 0.122 | 1 |
| `parent-operator` | 2.934 | 2.446 | 28 |
| `tail-recursion` | 2.765 | 0.486 | 3 |
| `target-group` | 1.891 | 0.114 | 1 |

Current 10-run average compared with the pre-pass 5-run stable sample:

| Group | Before eval ms | Current eval ms | Change |
| --- | ---: | ---: | ---: |
| `target-transform` | 5.806 | 3.662 | -36.9% |
| `target-number-format` | 7.348 | 5.136 | -30.1% |
| `target-date-time` | 5.019 | 3.530 | -29.7% |
| `target-sort` | 6.322 | 4.753 | -24.8% |
| `lambdas` | 4.534 | 3.827 | -15.6% |
| `target-hof` | 1.062 | 0.942 | -11.3% |
| `joins` | 6.006 | 5.578 | -7.1% |
| `target-group` | 2.025 | 1.891 | -6.6% |
| `object-constructor` | 4.428 | 4.180 | -5.6% |
| `performance` | 16.351 | 15.751 | -3.7% |
| `target-path` | 14.705 | 14.512 | -1.3% |

Notable changes:

- Added `npm run perf:stable` and `--runs` support to average full benchmark runs.
- Replaced recursive sort splitting with an iterative stable merge sort that avoids repeated `slice()` allocation while preserving async comparator behavior.
- Avoided public `$append` concat copies in internal group and tuple accumulation.
- Added exact hot paths for `#,##0.00` number formatting and exact ISO date-time formatting. The number fast path falls back for exponential-scale values so existing `1e21` behavior is preserved, and explicit-picture `$toMillis()` behavior is unchanged.
- The path-heavy groups are still the largest totals, but this pass targeted remaining execution overhead after the earlier path memoization and indexed-filter work.

## After Pure Path Fast Evaluator

Generated with:

```bash
npm run --silent perf:json -- --runs 20 --top 12
```

This run averages 20 full benchmark passes with `warmup=1` and `iterations=3`. The text runner in the same verification pass measured the same groups in the same band; the 20-run JSON output is recorded here to reduce timing noise.

Top groups by total evaluate time:

| Group | Eval ms | Compile ms | Cases |
| --- | ---: | ---: | ---: |
| `performance` | 12.343 | 0.303 | 2 |
| `target-path` | 11.638 | 0.290 | 2 |
| `joins` | 5.105 | 3.698 | 39 |
| `target-number-format` | 4.590 | 0.080 | 1 |
| `target-sort` | 4.672 | 0.057 | 1 |
| `object-constructor` | 3.592 | 1.582 | 22 |
| `lambdas` | 3.759 | 1.339 | 14 |
| `target-date-time` | 3.270 | 0.106 | 1 |
| `target-transform` | 3.146 | 0.127 | 1 |
| `parent-operator` | 2.249 | 2.313 | 28 |
| `target-regex` | 1.483 | 0.083 | 1 |
| `tail-recursion` | 1.408 | 0.365 | 3 |

Current 20-run average compared with the previous stable 10-run baseline:

| Group | Before eval ms | Current eval ms | Change |
| --- | ---: | ---: | ---: |
| `performance` | 15.751 | 12.343 | -21.6% |
| `target-path` | 14.512 | 11.638 | -19.8% |
| `joins` | 5.578 | 5.105 | -8.5% |
| `target-number-format` | 5.136 | 4.590 | -10.6% |
| `target-sort` | 4.753 | 4.672 | -1.7% |
| `object-constructor` | 4.180 | 3.592 | -14.1% |
| `lambdas` | 3.827 | 3.759 | -1.8% |
| `target-date-time` | 3.530 | 3.270 | -7.4% |
| `target-transform` | 3.662 | 3.146 | -14.1% |
| `parent-operator` | 2.934 | 2.249 | -23.4% |
| `tail-recursion` | 2.765 | 1.408 | -49.1% |

Slowest evaluate cases:

| Case | Mean ms |
| --- | ---: |
| `performance/case001.json#0` | 3.083 |
| `targeted/target-path/1` | 2.799 |
| `targeted/target-sort/3` | 1.557 |
| `targeted/target-number-format/11` | 1.530 |
| `targeted/target-date-time/10` | 1.090 |
| `targeted/target-path/0` | 1.081 |
| `targeted/target-transform/12` | 1.049 |
| `performance/case000.json#0` | 1.032 |
| `object-constructor/case025.json#0` | 0.920 |
| `lambdas/case004.json#0` | 0.671 |
| `targeted/target-regex/9` | 0.494 |
| `targeted/target-group/4` | 0.486 |

Notable changes:

- Added a narrow fast evaluator for deterministic field-only paths with literal, comparison, boolean, and literal-array predicates.
- Reused the fast evaluator for memoized root-path prefixes when evaluator callbacks and stack guardrails are inactive.
- Preserved normal evaluation for evaluator entry/exit callbacks, stack guardrails, registered/user functions, local-variable predicates, wildcard/descendant paths, grouping, tuples, transforms, focus/index binding, and other unsupported expressions.
- Added regression coverage for pure path results, literal-index predicates, promise-valued indexed results, raw array comparisons, multi-value predicates, callback fallback, and stack-guardrail fallback.

## After Mixed Safe-Step Fast Dispatch

Generated with:

```bash
npm run --silent perf:json -- --runs 20 --top 12
```

This run averages 20 full benchmark passes with `warmup=1` and `iterations=3`. The new source change lets normal path evaluation use the fast field-step evaluator for safe steps inside otherwise non-fast paths, such as sorted paths followed by deterministic field access.

Top groups by total evaluate time:

| Group | Eval ms | Compile ms | Cases |
| --- | ---: | ---: | ---: |
| `performance` | 12.803 | 0.383 | 2 |
| `target-path` | 11.781 | 0.313 | 2 |
| `joins` | 5.136 | 3.628 | 39 |
| `target-number-format` | 5.038 | 0.093 | 1 |
| `target-sort` | 4.438 | 0.070 | 1 |
| `object-constructor` | 3.949 | 1.462 | 22 |
| `lambdas` | 3.618 | 1.313 | 14 |
| `target-date-time` | 3.498 | 0.116 | 1 |
| `target-transform` | 2.998 | 0.124 | 1 |
| `parent-operator` | 2.420 | 2.310 | 28 |
| `target-regex` | 1.485 | 0.089 | 1 |
| `tail-recursion` | 1.812 | 0.301 | 3 |

Current 20-run average compared with the previous pure-path-fast-evaluator 20-run baseline:

| Group | Before eval ms | Current eval ms | Change |
| --- | ---: | ---: | ---: |
| `performance` | 12.343 | 12.803 | 3.7% |
| `target-path` | 11.638 | 11.781 | 1.2% |
| `joins` | 5.105 | 5.136 | 0.6% |
| `target-number-format` | 4.590 | 5.038 | 9.8% |
| `target-sort` | 4.672 | 4.438 | -5.0% |
| `object-constructor` | 3.592 | 3.949 | 9.9% |
| `lambdas` | 3.759 | 3.618 | -3.7% |
| `target-date-time` | 3.270 | 3.498 | 7.0% |
| `target-transform` | 3.146 | 2.998 | -4.7% |
| `parent-operator` | 2.249 | 2.420 | 7.6% |
| `target-regex` | 1.483 | 1.485 | 0.2% |
| `tail-recursion` | 1.408 | 1.812 | 28.7% |

Current 20-run average compared with the original baseline before source optimizations:

| Group | Original eval ms | Current eval ms | Change |
| --- | ---: | ---: | ---: |
| `performance` | 693.469 | 12.803 | -98.2% |
| `target-path` | 643.179 | 11.781 | -98.2% |
| `target-number-format` | 13.644 | 5.038 | -63.1% |
| `target-date-time` | 10.185 | 3.498 | -65.7% |
| `target-hof` | 7.630 | 0.857 | -88.8% |
| `joins` | 6.752 | 5.136 | -23.9% |
| `object-constructor` | 5.629 | 3.949 | -29.8% |
| `target-sort` | 5.102 | 4.438 | -13.0% |

Slowest evaluate cases:

| Case | Mean ms |
| --- | ---: |
| `performance/case001.json#0` | 3.134 |
| `targeted/target-path/1` | 2.893 |
| `targeted/target-number-format/11` | 1.679 |
| `targeted/target-sort/3` | 1.479 |
| `targeted/target-date-time/10` | 1.166 |
| `performance/case000.json#0` | 1.134 |
| `targeted/target-path/0` | 1.034 |
| `targeted/target-transform/12` | 0.999 |
| `object-constructor/case025.json#0` | 0.953 |
| `lambdas/case004.json#0` | 0.605 |
| `tail-recursion/case004.json#0` | 0.569 |
| `targeted/target-group/4` | 0.497 |

Notable changes:

- Safe normal path steps now reuse the same fast evaluator as complete pure paths and memoized suffix paths.
- The fast dispatch remains disabled for evaluator callbacks and stack guardrails, and tuple-stream paths still use the tuple evaluator.
- Added regression coverage for sorted mixed paths, callback fallback, and JSONata `cons` array lookup semantics.
- Existing aggregate groups are now close enough that some 20-run movements are noise-sized; the most relevant tracked movement is `target-sort`, which improved from `4.672ms` to `4.438ms`.

## Remaining Pain Points

The path-heavy cases are still the largest totals, but the main indexed suffix case is now closer to the rest of the targeted hot operations.

The next optimization should focus on measured hot groups that still have broad applicability, rather than broadening expression memoization aggressively.

Recommended next steps:

- Collect a 20-run average before further source changes; current remaining groups are close enough that single-run reports are misleading.
- Investigate joins and object construction next; they are now the largest non-path groups in the targeted report.
- Add a targeted benchmark for pure order-by terms over object arrays so sort-key precomputation continues to be tracked directly.
- Consider broader root-path purity only with focused callback, registered-function, binding, and focus-regression tests.
