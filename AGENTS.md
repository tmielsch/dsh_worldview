# AGENTS.md

Repository-wide instructions for humans and agents.

This repository is **design-first**. `historical_globe_pseudocode/` is the executable design contract from which bounded implementation work is derived. It is not disposable planning text.

## 1. Source-of-truth order

When instructions conflict, use this order:

1. explicit task/work packet;
2. this `AGENTS.md`;
3. target `@work-object` metadata + `@seam` body;
4. exported contracts of declared dependencies;
5. `docs/00-product-contract.md`;
6. other docs/pseudocode.

A worker must not resolve ambiguity by redesigning the architecture.

## 2. Non-negotiable architecture rules

- Preserve every `@work-object` and `@seam` boundary unless the task is explicitly architecture-level.
- One implementation task targets one work object or one evaluator-approved compatible group.
- A work object may depend only on `dependsOn` plus explicitly supplied context.
- Shared types/contracts are owned upstream; consumers do not redefine them.
- Historical/domain state remains DSH-neutral.
- UI consumes declared adapters/services, not arbitrary DSH internals.
- Prefer public DSH extension seams. Record DSH coupling in `docs/10-dsh-seams.md` as A/B/C/D.
- If a required contract is missing or contradictory, **fail the packet clearly**; do not invent cross-module behavior.
- Acceptance probes are part of the contract, not suggestions.

## 3. Agent roles

Agents operate in one declared role. Do not silently switch roles.

### CONDUCTOR

The conductor decomposes, schedules, isolates, and integrates work. It should normally **not implement leaf work itself**.

Responsibilities:

1. Parse/validate work objects using `docs/20-work-object-protocol.md` and `work_objects/schema.json`.
2. Respect the dependency DAG and only dispatch work whose required contracts are available.
3. Build the smallest sufficient context capsule for each worker.
4. Choose worker/model/session size from measurable difficulty features, not intuition alone.
5. Give each worker an explicit work-object ID, starting commit, writable scope, acceptance commands/probes, and output contract.
6. Run parallel workers only in isolated branches/worktrees or otherwise non-overlapping writable scopes.
7. Never let routing/grouping silently change architecture contracts.
8. Integrate only outputs that pass contract and architecture checks.
9. Escalate failed/ambiguous packets to a stronger model or architecture agent instead of broadening a weak worker's authority.
10. Record benchmark/run metadata when the run is part of an evaluation.

The conductor may group work objects only when all are adjacent/compatible in the DAG and the grouping introduces no undeclared dependency or write-scope coupling.

### WORKER

A worker implements exactly the supplied packet.

Default worker protocol:

1. Read the packet and this file.
2. Read the target seam completely.
3. Read only supplied context and exported contracts of `dependsOn` objects.
4. Implement behind the declared interface.
5. Stay inside the declared writable scope.
6. Run all visible acceptance probes/tests.
7. Return the implementation plus a structured result report.

Workers MUST NOT:

- redesign neighboring modules;
- crawl the repository for "better" architecture unless explicitly authorized;
- add undeclared dependencies merely to make the task easier;
- reach through adapters into DSH internals;
- weaken/delete tests or acceptance criteria;
- change pseudocode contracts to match their implementation;
- silently expand writable scope;
- conceal partial failures.

If blocked, report `BLOCKED_CONTRACT`, `BLOCKED_DEPENDENCY`, `BLOCKED_ENVIRONMENT`, or `BLOCKED_SCOPE` with the smallest concrete explanation possible.

### EVALUATOR / BENCHMARK RUNNER

The evaluator judges outputs; it does not rescue them while measuring them.

Responsibilities:

- validate build/type/lint/test/acceptance results;
- run architecture/compliance checks;
- run hidden benchmark tests when configured;
- classify failures;
- compute comparable run metrics;
- recommend retry/escalation/grouping separately from scoring the original attempt.

For a benchmark attempt, do not expose hidden tests or their outputs to the worker before scoring that attempt.

### ARCHITECT / DESIGN AGENT

Only this role may intentionally change work-object boundaries, dependency edges, canonical contracts, or the splitter protocol. Architecture changes must update all affected metadata/index/docs in the same change.

### REVIEWER / INTEGRATOR

Review implementation against the packet, not against personal preferred architecture. Reject hidden coupling, scope expansion, acceptance regressions, or contract drift even if the code appears to work locally.

## 4. Context-capsule rule

Small workers should receive **less context, not the whole repository**.

A normal packet contains only:

- relevant global invariants;
- target metadata + seam;
- exported signatures/contracts of direct dependencies;
- explicitly listed context files;
- writable scope;
- visible acceptance probes;
- required result format.

Do not include dependency implementation bodies unless the target genuinely requires them and the evaluator records that extra context.

`tools/split-work-objects.pseudo.ts` defines the intended packet-generation direction.

## 5. Required worker result

Every worker returns a machine-readable summary equivalent to:

```json
{
  "workObjectId": "HG-...",
  "status": "PASS|FAIL|BLOCKED_CONTRACT|BLOCKED_DEPENDENCY|BLOCKED_ENVIRONMENT|BLOCKED_SCOPE",
  "changedFiles": [],
  "acceptance": [
    {"probe": "...", "result": "PASS|FAIL|NOT_RUN", "evidence": "..."}
  ],
  "contractDeviations": [],
  "newDependencies": [],
  "notes": ""
}
```

A `PASS` with an undeclared contract deviation is invalid.

## 6. Concurrency and Git isolation

For parallel execution:

- pin every packet to an exact starting commit;
- use one branch/worktree per worker attempt where possible;
- never let two workers concurrently edit the same owned file unless the conductor explicitly serializes integration;
- workers commit only their assigned slice;
- do not merge/rebase unrelated worker branches from inside a worker task;
- the conductor/integrator owns reconciliation and merge ordering.

A worker finding unrelated changes must leave them untouched.

## 7. Benchmark protocol

Benchmarks exist to answer questions such as: **How small/cheap can the implementation model be while preserving correctness and architecture?**

For comparable attempts, freeze and record:

- work-object ID or group;
- packet/context hash;
- starting commit SHA;
- model/provider/version;
- inference settings when controllable;
- tool/permission set;
- retry policy;
- visible-test set;
- hidden-evaluator version.

Measure at least:

- visible acceptance pass/fail;
- hidden functional pass/fail;
- architecture/compliance pass/fail;
- build/type/lint/test status;
- unauthorized files/dependencies touched;
- contract deviations;
- number of retries;
- stronger-model/human interventions;
- input/output tokens when available;
- tool calls when available;
- elapsed time when available.

### Benchmark hygiene

- Same benchmark comparison => same packet and starting commit unless the changed variable is explicitly the subject of the experiment.
- Hidden tests stay hidden until the attempt is scored.
- A retry after receiving evaluator feedback is a **new assisted attempt**, not the original score.
- Do not count conductor/architect fixes as worker success.
- Keep correctness and efficiency metrics separate; a cheap wrong implementation is not a pass.
- Preserve failed attempts and failure classifications; they are useful data.
- Never modify canonical architecture solely to make a weak model score better unless that architecture change is itself a separately evaluated experiment.

Recommended failure classes:

`SYNTAX`, `BUILD`, `TYPE`, `TEST`, `FUNCTIONAL`, `CONTRACT`, `ARCHITECTURE`, `SCOPE`, `DEPENDENCY`, `ENVIRONMENT`, `TIMEOUT`, `NONCOMPLETION`.

Benchmark artifacts should be append-only or uniquely run-addressed (for example by benchmark ID + packet hash + attempt ID) so failed runs are not overwritten.

## 8. Escalation policy

Escalate rather than granting an underpowered worker broad repository context.

Preferred order:

1. retry same packet only when failure is stochastic/non-deterministic;
2. stronger worker on the same packet;
3. evaluator-approved grouping with a neighboring work object;
4. architect reviews whether the seam/contract itself is defective.

Do not "solve" repeated failures by quietly giving the worker architectural authority.

## 9. DSH-specific rule

Any implementation that touches DSH must state which seam it uses:

- **A** — clean public extension seam;
- **B** — wrapper/adapter;
- **C** — small maintained downstream patch;
- **D** — invasive coupling.

New C/D findings must be documented in `docs/10-dsh-seams.md`. A worker may discover a need for C/D, but may not introduce it unless its task explicitly permits that coupling class.

## 10. Definition of done

A work object is done only when:

- declared behavior is implemented;
- exported contract is preserved;
- all required visible acceptance probes pass;
- no unauthorized scope/dependency changes exist;
- DSH seam classification is correct where relevant;
- worker result is complete;
- evaluator checks pass when required.

The project goal is not merely working code. It is **working code that can be produced reproducibly from narrow, stable work packets by heterogeneous agents without architecture drift**.
