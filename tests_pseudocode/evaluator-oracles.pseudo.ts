// EVALUATOR-ONLY DESIGN.
// This file defines hidden-case FAMILIES, never concrete benchmark seeds.
// A conductor MUST NOT include this file in an implementation worker packet.
// A benchmark runner materializes concrete cases from an unrevealed seed.

type OracleFamily = {
  id: string
  forWorkObject: string
  generate(seed, count): EvaluatorCase[]
  invariant(case, subject): AssertionResult
}

function randomTempPath(seed): path
function randomDshHome(seed): path
function randomPermutation(seed, values): values
function generatedHistoricalTime(seed, options={includePreCE:true}): TimeInstant
function generatedValidDataset(seed, size): Dataset
function mutateOneInvariant(seed, dataset): InvalidDataset
function generatedCamera(seed): CameraState
function generatedActivityStream(seed): AgentActivity[]

// HG-BUNDLE-001-ORACLE
oracle("HG-BUNDLE-001-ORACLE", "HG-BUNDLE-001", seed => {
  repeat across randomized checkout path depth/names and randomized empty DSH_HOME:
    install/link bundle
    assert dump-config resolves bundle layer
    assert resolved project code originates from current checkout/workspace
    assert no source copy is required under DSH installation
})

// HG-PROFILE-001-ORACLE
oracle("HG-PROFILE-001-ORACLE", "HG-PROFILE-001", seed => {
  repeat in DSH_HOME containing unrelated profiles and arbitrary user patch noise:
    resolve historical-globe profile
    assert base bundle precedes project bundle
    assert unrelated profile state cannot become a hidden dependency
    assert profile-local product patch remains empty unless canonical contract changes
})

// HG-DOMAIN-001-ORACLE
oracle("HG-DOMAIN-001-ORACLE", "HG-DOMAIN-001", seed => {
  generate valid records at coordinate/importance boundaries and historical times spanning pre-CE/CE/open-ended forms
  assert public domain contracts represent them without DSH types
  static-scan transitive domain package imports: no DSH package dependency
})

// HG-STORE-001-ORACLE
oracle("HG-STORE-001-ORACLE", "HG-STORE-001", seed => {
  dataset = generatedValidDataset(seed, random 5..100)
  queryTimes = generated points immediately before/at/inside/at-end/after intervals, including pre-CE -> CE spans
  for each time/filter combination:
    compare result to independent reference interval/filter implementation
    assert deterministic event order importance desc + id asc
    assert deterministic relation order id asc
    assert returned relations have relevant/resolvable endpoints
  for random input permutations:
    assert identical structural results
  mutate returned snapshots and assert canonical store state cannot change
})

// HG-LOD-001-ORACLE
oracle("HG-LOD-001-ORACLE", "HG-LOD-001", seed => {
  candidates = generated markers with random importance/relevance/focus and intentional score ties
  for budgets 0..N:
    assert size <= budget
    assert selection equals independent stableTopN(referenceScores)
    assert selected prefix is monotonic as budget increases absent semantic policy change
  permute input order and assert output invariant
  create far-global camera cases where geographic relevance is controlled equal; higher importance must outrank lower importance
})

// HG-SCENE-001-ORACLE
oracle("HG-SCENE-001-ORACLE", "HG-SCENE-001", seed => {
  generate dataset/camera/filter/budget combinations
  compare marker/edge counts against budgets
  assert every edge endpoint exists in current marker set
  assert repeated and permuted equivalent inputs produce identical serialized frame
  assert no value/module from DSH boundary leaks into frame
})

// HG-GLOBE-001-ORACLE
oracle("HG-GLOBE-001-ORACLE", "HG-GLOBE-001", seed => {
  mount renderer once with instrumented engine
  feed random sequence of 1..30 SceneFrames with 0..100 markers and edges
  assert canvas/engine identity remains stable; reconciliation occurs; dispose exactly once
  in browser, generate bounded drag/wheel gestures and assert camera state changes in expected dimension
  rerender equivalent geographic markers and assert projected positions remain stable within renderer tolerance
})

// HG-GLOBE-002-ORACLE
oracle("HG-GLOBE-002-ORACLE", "HG-GLOBE-002", seed => {
  generate current frame IDs plus stale/unknown raycast IDs
  hit current marker => exact stable id
  no hit/stale id/missing metadata => null, never stale selection
  update frame between pointer-down and click resolution when tooling permits; returned id must be validated against latest frame
})

// HG-TIME-001-ORACLE
oracle("HG-TIME-001-ORACLE", "HG-TIME-001", seed => {
  generate random min/max/current triples across pre-CE and CE ranges
  generated setTime below/inside/above range => independent normalized clamp result
  same effective value => zero additional publications; changed effective value => exactly one
  unsubscribe => no future publications
  random positive/negative steps preserve canonical chronological arithmetic
})

// HG-TIME-002-ORACLE
oracle("HG-TIME-002-ORACLE", "HG-TIME-002", seed => {
  generate track widths and increasing x sequences including outside-track positions
  assert mapped times are clamped and chronologically monotonic
  endpoints map exactly to min/max
  generated left/right key pairs from non-boundary state are inverse under same adaptive step
  integration probe asserts timeline updates SceneFrame without replacing globe instance
})

// HG-SHELL-001-ORACLE
oracle("HG-SHELL-001-ORACLE", "HG-SHELL-001", seed => {
  boot real fixture; randomly switch among >=3 sessions
  after every switch assert custom surface persists, session id follows active session, stock ChatView absent
  delay/fail globe engine loading and assert Historical Globe shell/branding still owns session body
  static scan shell imports for forbidden stock ChatView embedding
})

// HG-SHELL-002-ORACLE
oracle("HG-SHELL-002-ORACLE", "HG-SHELL-002", seed => {
  generate viewport sizes above supported minimum
  assert globe remains dominant and timeline remains bottom-accessible
  random open/collapse/select sequences must not mutate canonical domain snapshot or remount globe
  selection state may store stable ids but not cloned canonical domain records
})

// HG-AGENT-001-ORACLE
oracle("HG-AGENT-001-ORACLE", "HG-AGENT-001", seed => {
  generate DSH fixture histories containing prose, streaming deltas, tool/agent lifecycle, unknown event kinds
  feed semantically equivalent event chunkings and assert final project-owned projection equivalent
  assert intermediate snapshots expose incremental assistant text
  bind/unbind across random session switch sequence; previous session events cannot update current projection
  recursively assert no DSH wire object escapes adapter
})

// HG-AGENT-002-ORACLE
oracle("HG-AGENT-002-ORACLE", "HG-AGENT-002", seed => {
  generate whitespace/nonempty prompts and accepted/rejected/throwing public actions
  nonempty accepted => exact bound session id and text; caller gets acceptance
  rejection/error => caller observes failure and no local synthetic event is inserted
  cancel => exact bound session
  real DSH fixture: accepted send eventually appears through HG-AGENT-001
})

// HG-AGENT-003-ORACLE
oracle("HG-AGENT-003-ORACLE", "HG-AGENT-003", seed => {
  generate interleaved lifecycle streams for multiple stable call ids, known and unknown kinds
  assert logical grouping by identity and stable final projection
  generate raw payloads from 0 bytes to very large; compact output remains bounded by policy and never contains unbounded raw body
  unknown kind always yields safe generic row rather than throw
})

// HG-AGENTUI-001-ORACLE
oracle("HG-AGENTUI-001-ORACLE", "HG-AGENTUI-001", seed => {
  generate send action latency and outcomes
  while send pending: draft remains
  accepted: draft clears once
  rejected/thrown: draft remains and failure is observable
  random collapse/expand during ongoing stream: underlying reader subscription/session continues and accumulated output is visible after expand
  running state exposes cancel; idle state does not falsely cancel
  static scan forbids stock DSH chat/message/tool card imports
})

// HG-DATA-001-ORACLE
oracle("HG-DATA-001-ORACLE", "HG-DATA-001", seed => {
  valid = generatedValidDataset(seed, random 20..100)
  assert valid loads immutably and normalized output invariant under record permutations
  for each invariant class [duplicate id, lat, lon, interval order, dangling relation endpoint, dangling event entity, dangling event relation, missing provenance]:
    invalid = mutate exactly that invariant
    assert whole load rejects with path-rich error identifying mutation vicinity
})

// HG-DIAG-001-ORACLE
oracle("HG-DIAG-001-ORACLE", "HG-DIAG-001", seed => {
  generate capability matrix over required DSH seams present/absent/changed-shape
  each missing seam produces its own named check failure plus expected contract/migration hint
  healthy real DSH fixture reports actual DSH version
  classification transition C->A suggests patch removal; A->missing is development-boot blocking
})

// HG-DIAG-002-ORACLE
oracle("HG-DIAG-002-ORACLE", "HG-DIAG-002", seed => {
  run healthy vertical-slice browser fixture => all canonical interaction steps pass
  inject one failure at a time into globe frame, rotate, zoom, scrub, pick, send, streaming, console, rejection, network
  report must attribute failure to correct step/category while preserving evidence for unaffected prior steps
})

// HG-BOOT-001-ORACLE
oracle("HG-BOOT-001-ORACLE", "HG-BOOT-001", seed => {
  repeat from randomized fresh checkout paths and DSH_HOME containing unrelated sentinel profiles
  frozen install + bootstrap + dump-config + start
  assert only intended profile state changes; sentinels unchanged
  assert project package resolution originates in current repo/workspace rather than original developer paths
  assert no plugin source copy into DSH installation
})

// HG-BOOT-002-ORACLE
oracle("HG-BOOT-002-ORACLE", "HG-BOOT-002", seed => {
  run clean disposable environment(s) with no original user home/checkouts and only documented config
  clone exact revision -> frozen install -> bootstrap -> start -> HistoricalGlobeSelfTest
  capture filesystem/module/plugin resolution; every path must fall under current checkout, declared DSH runtime home, or explicitly allowed package-manager cache
  trace filesystem operations and reject undeclared manual copy behavior
})

// Meta-oracle: every work object must have both a visible test seam and an oracle family.
metaOracle("coverage", () => {
  workIds = read("work_objects/index.json").objects.ids()
  visibleIds = scanTestSeams("tests_pseudocode/*.tests.pseudo.ts")
  oracleIds = scanOracleFamilies(thisFile).map(forWorkObject)
  expect(set(visibleIds)).toEqual(set(workIds))
  expect(set(oracleIds)).toEqual(set(workIds))
})
