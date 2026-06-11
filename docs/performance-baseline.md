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

## Remaining Pain Points

The path-heavy cases are no longer the overwhelming bottleneck, but indexed root-path suffixes remain the slowest individual operations. They now reuse deterministic root prefixes, then apply the local `$i` predicates per outer item to preserve JSONata scoping semantics.

The next optimization should focus on lower-risk per-operation hot spots that remain visible after path memoization, rather than broadening memoization aggressively.

Recommended next steps:

- Add a targeted benchmark for pure order-by terms over object arrays so sort-key precomputation is tracked directly.
- Consider extending root-path purity only for additional deterministic operators after adding focused callback and registered-function regression tests.
- Investigate `target-hof`, object construction, and date/time formatting only after collecting multi-run averages; they are now in the single-digit millisecond range and more sensitive to timing noise.
