# Token / cost prognosis for design-first model routing

Status: **pre-implementation forecast**, recorded before the Historical Globe pseudocode is translated into concrete code. This document exists so the prediction can later be compared against measured runs rather than rewritten after the fact.

## Question

How much expensive strong-model work can be replaced if a strong model designs the architecture, work-object contracts, tests, and evaluator oracles, while much cheaper implementation models translate bounded packets into concrete code?

## Forecast

Under the optimistic-but-explicit assumption that the pseudocode/contracts are substantially correct and implementation workers can translate them without major architecture repair:

- expected reduction in **strong-model implementation tokens** versus having the strong model design *and* implement everything: **65–80%**;
- current best-point estimate: **~72–75%**;
- this is **not** a prediction that total tokens across all agents decrease by the same amount.

The design-first approach deliberately spends strong-model tokens on the high-information work: architecture, invariants, seams, dependency boundaries, test contracts, evaluator oracles, and failure conditions. Concrete framework code, fixtures, adapters, boilerplate, and repetitive implementation are expected to dominate the remaining token volume and can be delegated.

## Why total tokens may increase

Total model tokens can be higher because the system may use:

- a separate test-writer;
- one or more implementation workers;
- evaluator passes;
- repeated cold attempts while calibrating the model ladder;
- Mixture-of-Agents experiments;
- retries/escalations.

This is acceptable if the additional tokens are sufficiently cheap. The optimization target is **cost-adjusted reliable correctness**, not minimum raw token count.

## Cost model

Let:

- `S` = fraction of an all-strong-model workload that remains on the strong model;
- `1-S` = fraction delegated;
- `R` = cheap-worker token expansion factor relative to the strong model doing that delegated portion itself;
- `P` = worker price relative to strong model price.

Then normalized hybrid model cost is approximately:

```text
hybrid_cost = S + (1-S) * R * P
```

For a worker approximately **40x cheaper**, `P = 1/40`.

Using the central forecast of **75% delegated** (`S = 0.25`):

| Cheap-worker token overhead | Hybrid cost vs all-strong | Forecast cost saving |
|---|---:|---:|
| 1x | 26.9% | 73.1% |
| 2x | 28.8% | 71.2% |
| 3x | 30.6% | 69.4% |

So even substantial cheap-model verbosity/redundancy does not erase the advantage when the price ratio is ~40x.

Across the broader 65–80% delegation forecast, assuming no token expansion, the corresponding cost saving is roughly **63–78%**. With 3x cheap-worker token expansion it is still roughly **60–74%**.

## Benchmark phase vs steady state

Do not mix these two regimes.

### Calibration / research phase

The model-ladder benchmark intentionally runs multiple models and repeated cold attempts. **Total tokens may be several times higher than direct implementation.** That cost buys empirical capability data and a routing policy.

### Steady-state implementation

After the capability map stabilizes, the conductor should normally dispatch the cheapest tier known to satisfy the required reliability for each work-object class, with escalation only on failure/high-risk cases. This is where the strong-model-token reduction should become visible.

## What should be measured later

For every accepted work object record:

- strong-model input/output tokens used for architecture/specification attributable to the object;
- test-writer tokens;
- implementation-worker tokens;
- evaluator tokens;
- retry/escalation tokens;
- model-specific price;
- first-pass and final-pass correctness;
- elapsed time.

Then compare at least:

1. **hybrid design-first pipeline**;
2. **all-strong-model baseline** on held-out comparable work objects;
3. optionally **cheap-worker without strong pseudocode** to measure how much value comes specifically from the specification.

The third baseline is important: it distinguishes "cheap model is already good" from "strong-model design makes cheap implementation reliable."

## Falsification criterion

This forecast should be considered wrong or materially overstated if either:

- the strong model repeatedly has to repair implementation details across most work objects, pushing its share of the all-strong workload much above ~35%; or
- worker retries/evaluation/rework erase the cost advantage despite the large price ratio.

Conversely, if most low/medium-risk work objects pass cold on the first cheap-worker attempt and strong-model involvement stays architecture-only, delegation above 80% is plausible.

## Current expectation

The main expected saving is not that fewer tokens exist. It is that **expensive reasoning tokens become a relatively small architectural control layer over a much larger volume of cheap execution tokens**.
