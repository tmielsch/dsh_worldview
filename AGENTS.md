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

### Comparative experiment: measure the value of strong program design

The conductor SHOULD periodically run a controlled comparison that separates **worker capability** from the value of the strong-model design layer.

Use these arms:

- **A — DESIGN_FIRST_CHEAP:** cheap worker receives the bounded work-object packet, dependency contracts, and validated visible tests produced by this design-first system.
- **B — RAW_INIT_CHEAP:** the same cheap model receives only the pinned original user brief from `benchmarks/prompts/historical-globe-user-init-v1.md` plus a neutral execution envelope. It must plan/design/implement for itself.
- **C — RAW_INIT_STRONG:** the strong reference model receives the same pinned original user brief and neutral execution envelope and performs the implementation directly.
- **D — DESIGN_FIRST_STRONG (optional but recommended):** the strong reference model receives the same design-first packets as arm A. This estimates the packet ceiling and helps distinguish a defective specification from insufficient worker capability.

Primary research questions:

1. How much cheaper is A than C at comparable correctness?
2. How much more reliable is A than B for the same cheap model?
3. How much of A's gain comes from better specification rather than model size?
4. Does D materially outperform A? If not, the packet may have reduced the implementation task enough that the cheap model is already sufficient.

#### Raw-prompt baseline

`benchmarks/prompts/historical-globe-user-init-v1.md` is the canonical **verbatim baseline prompt**. Treat it as immutable for benchmark suite v1.

- Hash the exact prompt content for every run.
- If the prompt changes materially, create `...-v2.md`; never silently edit the v1 benchmark identity.
- The conductor may prepend/append only a separately hashed **neutral execution envelope** needed to operate tools, branch/worktree, return results, or obey repository safety rules.
- The neutral envelope MUST NOT contain architecture, seam, test, DSH-integration, implementation-order, or failure hints derived from the design-first arm.
- A RAW_INIT worker must not see `historical_globe_pseudocode/`, `work_objects/`, `tests_pseudocode/`, design-first benchmark outcomes, or design-specific sections of this AGENTS file.

#### Branch/worktree isolation for comparative arms

Use separate branches/worktrees; do not rely only on telling the model not to read files.

Recommended shape:

```text
benchmark/<suite>/base-neutral
benchmark/<suite>/raw-cheap/<attempt>
benchmark/<suite>/raw-strong/<attempt>
benchmark/<suite>/design-cheap/<work-id>/<attempt>
benchmark/<suite>/design-strong/<work-id>/<attempt>
```

Rules:

- Create all arms from a declared immutable experiment base/environment version.
- RAW_INIT arms MUST use a **neutral workspace view** that physically excludes design-first pseudocode, work-object metadata, generated/visible design tests, evaluator oracles, token prognosis, and prior design-arm outputs.
- DESIGN_FIRST arms may use the exact generated packet/context intended for production routing, but no evaluator-only oracle material.
- Keep evaluator/oracle material in a trusted evaluator workspace or service outside all worker branches.
- Never merge one arm into another before all compared attempts are scored.
- Use independent worktrees for parallel attempts, even when they share a branch ancestry.
- Record branch/ref, base SHA, worker-visible tree hash, prompt hash, packet hash when applicable, tool policy, and model settings.
- If neutral and design-first branches necessarily have different repository contents, record both tree hashes; equality is not required because **information availability is the experimental variable**.

#### Fair scoring across raw and design-first arms

Do not accidentally grade the raw model against requirements invented only by the strong design pass.

Every evaluator assertion should be classified as one of:

- **CORE_USER_REQUIREMENT** — directly derivable from the pinned original user prompt; contributes to the primary cross-arm correctness score.
- **DESIGN_REFINEMENT** — a useful invariant/edge case introduced during strong-model program design; reported as a secondary design-quality score and MUST NOT reduce the RAW_INIT arm's primary score unless the requirement is independently justified by the original prompt or universal repository/runtime correctness.
- **UNIVERSAL_CORRECTNESS** — buildability, crashes, data corruption, security/scope violations, obvious resource leaks, invalid dependency resolution, and other failures that are fair to score for every arm.

The primary A/B/C comparison uses `CORE_USER_REQUIREMENT + UNIVERSAL_CORRECTNESS`. `DESIGN_REFINEMENT` is reported separately. This prevents the designer from defining the exam after seeing its own answer.

#### Two distinct cheap-model baselines

When budget permits, distinguish:

1. **RAW_END_TO_END:** cheap model gets only the raw init prompt, chooses architecture, writes its own tests, and implements. This is the primary control for "what would Qwen have done without the strong design?"
2. **PACKET_IMPLEMENTATION:** cheap model gets the strong design packet + visible tests. This measures pure implementation capability after decomposition.

Optionally add a third explicit experiment where the cheap model receives neutral black-box acceptance tests but no design pseudocode. Do not mix that result with RAW_END_TO_END, because tests themselves carry design information.

#### Comparative run procedure

For each selected benchmark slice:

1. Freeze suite version, DSH version, dependency/runtime environment, tool permissions, evaluator version, and hidden-seed schedule.
2. Materialize isolated worker branches/worktrees for each arm.
3. Dispatch arms in randomized order when provider/load effects matter.
4. Run cold attempts without evaluator feedback; minimum 3 attempts per arm when cost permits.
5. Score all attempts with the same CORE evaluator and hidden-seed schedule.
6. Score DESIGN_REFINEMENT separately.
7. Record total tokens/cost for every participating model, including conductor/test-writer/evaluator/synthesizer when applicable.
8. Record wall-clock time, retries, interventions, and whether a stronger model had to repair the result.
9. Preserve every failed branch/diff/result as benchmark evidence; do not overwrite it.
10. Only after scoring may the conductor run assisted recovery or merge accepted implementation work.

Report at least:

```text
arm
model + exact version
prompt/tree/packet hashes
cold pass count / attempts
CORE_USER_REQUIREMENT score
UNIVERSAL_CORRECTNESS score
DESIGN_REFINEMENT score
architecture/compliance score
strong-model tokens
cheap-model tokens
all-model tokens
normalized monetary cost
latency
retries/interventions
```

The key economic metric is **cost per accepted implementation at matched CORE correctness**, not raw token count.

### Recommended benchmark process: find the capability frontier

The primary model-ladder benchmark should estimate, for each class of work object, the **smallest/cheapest model that succeeds reliably under a fixed packet contract**.

Use four distinct phases.

#### Phase A — validate the benchmark itself

Before comparing worker models, run a strong reference model on representative work objects from each difficulty/risk bucket.

A benchmark item is valid only if the reference model can solve it from the supplied packet without undeclared repository context. If the reference model repeatedly reports a missing/contradictory contract, treat that as a **benchmark/design defect**, not worker-model failure.

Select a small set of canary objects spanning at least:

- low-risk leaf/data work;
- ordinary UI/render work;
- stateful work;
- concurrency/streaming work;
- high-coupling DSH work.

Do not tune packets against only one model family.

#### Phase B — measure per-model capability

For each benchmark item, test a model ladder from cheapest/smallest upward.

Recommended procedure:

1. start each model from the identical clean commit and packet hash;
2. give identical tools, permissions, visible tests, and retry budget;
3. run at least 3 independent **cold attempts** for meaningful reliability estimates when cost permits;
4. score each attempt before revealing evaluator feedback;
5. stop climbing once a model tier meets the required reliability target, unless collecting research data.

Record two different notions of success:

- **single-shot capability** — whether an unassisted first attempt passes;
- **reliable capability** — pass rate across repeated cold attempts.

Suggested routing threshold for production use: require either 3/3 cold passes or a larger-sample pass rate >= 90% on the relevant work-object class. A 1/3 success is evidence of possible capability, not safe routing.

#### Phase C — benchmark the router/conductor separately

Do not conflate worker quality with routing quality.

Once per-model capability data exists, evaluate the conductor on unseen/held-out work objects. The conductor must choose a model using only pre-execution features available to routing, such as:

- packet tokens/LOC;
- dependency fan-in/fan-out;
- export count;
- external/DSH references;
- statefulness;
- concurrency/streaming;
- UI/browser requirement;
- acceptance-test surface;
- declared architecture risk.

Score routing on at least:

- task success rate;
- total cost/tokens;
- unnecessary escalations;
- under-routing failures;
- number of retries;
- time to accepted implementation.

Compare the learned/heuristic router against simple baselines such as **always strongest**, **always cheapest**, and a fixed hand-written tier rule. A complex router is only useful if it improves the cost/reliability frontier.

#### Phase D — continuous regression benchmark

Keep a holdout suite that is not used to tune prompts, packet construction, routing thresholds, or model-specific fixes.

Run it when any of these change materially:

- work-object schema;
- context-capsule generator;
- conductor/router logic;
- AGENTS instructions;
- tool permissions;
- important model/provider/version;
- DSH integration architecture.

Track capability by **work-object class**, not only one aggregate score. A model can improve on leaf coding while regressing on contract fidelity or DSH integration.

### Experimental design recommendations

- Change one important variable at a time when making causal comparisons.
- Randomize attempt order when provider load, caching, or temporal effects could bias results.
- Use exact model/version identifiers; aliases such as `latest` are not reproducible benchmark identities.
- Keep a stable benchmark-suite version and hash it.
- Separate packet quality from model quality: the same model should sometimes be tested with alternate context-capsule variants as an explicit experiment.
- Keep a small hidden holdout set to detect prompt/benchmark overfitting.
- Prefer black-box behavioral tests over evaluator "vibes" wherever possible.
- When subjective review is necessary, use a fixed rubric and blind the reviewer to worker model identity when practical.
- Report uncertainty/pass counts, not only a single scalar score.
- Optimize for a Pareto frontier of **correctness/reliability, cost, latency, and architecture compliance**, rather than tokens alone.

### Recommended benchmark outcome

For each work-object class, maintain a routing table resembling:

```text
class                 default tier   observed reliability   fallback
leaf/data             small          97%                    medium
UI/render             small/medium   92%                    medium
stateful              medium         95%                    strong
streaming/concurrency strong         94%                    strongest
DSH/high-risk         strongest      98%                    architect review
```

The numbers above are illustrative; populate them only from measured runs.

The final artifact of benchmarking should be a **capability map + routing policy**, not a leaderboard. The useful result is knowing which model tier can safely implement which kind of seam, at what cost and reliability.

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
