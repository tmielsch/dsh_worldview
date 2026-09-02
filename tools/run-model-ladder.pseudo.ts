// Pseudocode benchmark runner for a DSH conductor that can dispatch sub-agents
// with per-sub-agent model overrides.

INPUTS:
  workObjectIds
  modelLadder // ordered by expected cost/capability, not assumed quality
  attemptsPerTier = 3
  reliabilityTarget = {coldPassRate: 0.90, minimumPassRule: "3/3 when n=3"}
  benchmarkSuiteVersion
  startCommit

// Seed schedule is fixed BEFORE model execution and reused across compared model
// tiers. Seeds remain hidden from workers but make evaluator difficulty comparable.
function makeAttemptSeedSchedule(workObjectId, suiteVersion, n): Seed[]

function runColdAttempt(workObjectId, modelId, attemptIndex, hiddenSeed): AttemptRecord:
  target = loadTarget(workObjectId)
  testWriterTests = getValidatedConcreteVisibleTests(workObjectId)
  implementationPacket = buildImplementationPacket(target, testWriterTests)
  packetHash = hashCanonical(implementationPacket)

  sandbox = createIsolatedWorktree(startCommit, uniqueAttemptId())

  workerResult = DSH.dispatchSubAgent({
    modelOverride: modelId,
    context: implementationPacket,
    workspace: sandbox,
    // identical tool/permission/time/retry policy for compared tiers
    tools: benchmarkPolicy.workerTools,
    permissions: benchmarkPolicy.workerPermissions,
    retries: 0
  })

  // Score BEFORE any evaluator feedback is returned to worker.
  evaluation = trustedEvaluator.run(
    buildEvaluatorPacket(target, hiddenSeed, sandbox.candidateDiff)
  )

  return immutableAttemptRecord({
    attemptId,
    workObjectId,
    benchmarkSuiteVersion,
    startCommit,
    packetHash,
    modelId,
    attemptIndex,
    hiddenSeedHash: hash(hiddenSeed), // do not expose seed pre-score
    workerResult,
    evaluation,
    metrics: collectTokensToolCallsLatencyCostWhenAvailable()
  })

function tierPassesReliably(records): boolean:
  if records.length == 3:
    return all 3 are strict PASS
  return strictPassRate(records) >= 0.90 with confidence interval reported

function benchmarkWorkObject(workObjectId): CapabilityFrontierRecord:
  seeds = makeAttemptSeedSchedule(workObjectId, benchmarkSuiteVersion, attemptsPerTier)
  tierResults = []

  for modelId in modelLadder:
    records = []
    for i in 0..<attemptsPerTier:
      records.push(runColdAttempt(workObjectId, modelId, i, seeds[i]))

    tierResults.push(summarizeTier(records))

    if tierPassesReliably(records):
      // This is the provisional smallest reliable tier. Do not assume model
      // quality is perfectly monotonic; periodically sample higher tiers too.
      return {
        workObjectId,
        smallestReliableTier: modelId,
        tierResults,
        fallbackTier: nextStrongerModel(modelId),
        confidence: summarizeUncertainty(records)
      }

  return {
    workObjectId,
    smallestReliableTier: none,
    tierResults,
    fallbackTier: "ARCHITECT_REVIEW",
    confidence: "no tested tier met reliability target"
  }

function benchmarkClass(workObjectsOfSameClass): ClassCapabilityMap:
  // Do not declare a model safe for an entire class from one convenient seam.
  records = workObjectsOfSameClass.map(benchmarkWorkObject)
  return aggregateWithoutHidingPerObjectFailures(records)

function benchmarkRouter(heldOutWorkObjects, router): RouterScore:
  // Router gets ONLY pre-execution features. It cannot peek at benchmark outcomes.
  for work in heldOutWorkObjects:
    features = estimateDifficulty(work)
    selectedModel = router.choose(features)
    record = runColdAttempt(work.id, selectedModel, attemptIndex, hiddenSeed)
    collect record

  compare against baselines:
    alwaysStrongest
    alwaysCheapest
    fixedHandWrittenTierRule

  score Pareto dimensions separately:
    strict success/reliability
    cost/tokens
    latency
    under-routing failures
    unnecessary expensive routing
    retries/escalations

// Assisted retries are useful operationally but are NOT the same benchmark score.
function runAssistedRecovery(failedAttempt): AssistedAttemptRecord:
  choose one explicit intervention:
    same model fresh retry if stochastic failure suspected
    OR stronger model same packet
    OR evaluator-approved neighboring seam grouping
    OR architect contract review
  record parentAttemptId and intervention type
  score as separate assisted attempt

// ----- Mixture-of-Agents experiment -----
// DSH model overrides make MoA possible, but MoA MUST be benchmarked as a
// separate strategy because it changes cost, latency, and information flow.
function runMoAAttempt(workObjectId, workerModels[], synthesizerModel, hiddenSeed): MoAAttemptRecord:
  target = loadTarget(workObjectId)
  packet = buildImplementationPacket(target, validatedVisibleTests)

  candidates = parallelMap(workerModels, modelId =>
    DSH.dispatchSubAgent({
      modelOverride: modelId,
      context: packet,
      workspace: independentReadOnlyBasePlusOwnDiff(),
      retries: 0
    })
  )

  // Score individual candidates independently first. This yields useful
  // evidence about whether MoA is adding value or just buying more attempts.
  individualScores = candidates.map(c => trustedEvaluator.scoreCandidate(c, hiddenSeed))

  // Synthesizer sees candidate proposals/diffs and visible-test evidence but NOT
  // hidden evaluator cases or hidden-test feedback.
  synthesized = DSH.dispatchSubAgent({
    modelOverride: synthesizerModel,
    context: {
      canonicalPacket: packet,
      anonymizedCandidateDiffs: shuffleAndBlindModelIdentity(candidates),
      visibleTestEvidence: visibleOnly(candidates)
    },
    task: "Select/merge/correct candidates without changing canonical contracts."
  })

  finalScore = trustedEvaluator.scoreCandidate(synthesized, hiddenSeed)

  return record({
    strategy: "MOA",
    workerModels,
    synthesizerModel,
    individualScores,
    finalScore,
    aggregateTokensCostLatency: includeAllWorkersAndSynthesizer()
  })

// Correct MoA baselines matter:
// Compare MoA not only to one cheap worker, but also to:
//   - best-of-N independent cheap attempts with evaluator selection
//   - one stronger worker at similar total cost
//   - sequential retry/escalation at similar expected cost
// Otherwise parallel sampling may be mistaken for genuine synthesis benefit.

MAIN:
  validate benchmarkSuiteVersion + startCommit + model identities are pinned
  validate every target has visible test seam + evaluator oracle
  run canary reference model on suite changes before model comparisons
  for target in selected workObjectIds:
    write append-only capability record from benchmarkWorkObject(target)
  update derived routing table only from scored immutable records
