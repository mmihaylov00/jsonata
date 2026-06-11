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

## Remaining Pain Points

The path-heavy cases are again the clear top groups after the HOF callback improvement, but they are still far below the original baseline. The main indexed suffix case is near the rest of the targeted hot operations.

The next optimization should focus on measured hot groups that still have broad applicability, rather than broadening expression memoization aggressively.

Recommended next steps:

- Collect a 5-run average before further source changes; current remaining groups are much closer together and more sensitive to timing noise.
- Investigate object construction and joins next; they now sit ahead of `target-hof` in the targeted report.
- Add a targeted benchmark for pure order-by terms over object arrays so sort-key precomputation continues to be tracked directly.
- Consider broader root-path purity only with focused callback, registered-function, binding, and focus-regression tests.
