// Pseudocode: derive bounded TEST-WRITER and EVALUATOR packets from the same
// canonical work-object + test contracts.

INPUTS:
  repoRoot
  workObjectId
  benchmarkMode = true

function loadTarget(workObjectId):
  work = scanWorkObjects(repoRoot)[workObjectId]
  testIndex = readJson("tests_pseudocode/test-index.json")
  testFile = testIndex.visibleTestFiles[workObjectId]
  testSpec = extractUniqueBlock(testFile, `@test-spec for=${workObjectId}`)
  visibleTestSeam = extractBetween(
    testFile,
    `/* @test-seam ${workObjectId}:begin */`,
    `/* @test-seam ${workObjectId}:end */`
  )
  return {work, testSpec, visibleTestSeam}

function buildTestWriterPacket(target): Packet:
  return {
    role: "TEST-WRITER",
    workObjectId: target.work.id,
    instructions: [
      "Translate the supplied visible pseudocode assertions faithfully into the repository's concrete test framework.",
      "Do not inspect product implementation before authoring the initial benchmark tests unless explicitly allowed.",
      "Do not weaken or reinterpret assertions.",
      "Add only fixture/framework plumbing required by this test seam.",
      "If an assertion cannot be made objective from the supplied contract, return BLOCKED_CONTRACT."
    ],
    productContract: target.work.metadata + target.work.seamBody,
    dependencyContracts: exportedContracts(target.work.dependsOn),
    testSpec: target.testSpec,
    visibleTests: target.visibleTestSeam,
    harnessContract: read("tests_pseudocode/test-harness.pseudo.ts"),
    writableScope: concreteTestPathsReservedFor(target.work.id),
    FORBIDDEN_CONTEXT: [
      "tests_pseudocode/evaluator-oracles.pseudo.ts",
      "materialized hidden fixtures",
      "implementation body under test when benchmarkMode and whiteBoxAllowed != true"
    ]
  }

function buildImplementationPacket(target, validatedConcreteVisibleTests): Packet:
  return {
    role: "WORKER",
    workObjectId: target.work.id,
    instructions: standardWorkerInstructions,
    productContract: target.work.metadata + target.work.seamBody,
    dependencyContracts: exportedContracts(target.work.dependsOn),
    explicitContext: readDeclaredContext(target.work.metadata.context),
    visibleTestContract: target.visibleTestSeam,
    concreteVisibleTests: validatedConcreteVisibleTests,
    writableScope: implementationPathsReservedFor(target.work.id),
    FORBIDDEN_CONTEXT: [
      "tests_pseudocode/evaluator-oracles.pseudo.ts",
      "materialized hidden fixtures",
      "other workers' implementation bodies unless declared context"
    ]
  }

function buildEvaluatorPacket(target, hiddenSeed, concreteCandidate): Packet:
  // Evaluator is trusted and gets more context than worker.
  oracleFamily = extractOracleFamily(
    "tests_pseudocode/evaluator-oracles.pseudo.ts",
    target.work.id
  )

  hiddenCases = materializeOracleCases(
    oracleFamily,
    seed=hiddenSeed,
    count=benchmarkPolicy.caseCountFor(target.testSpec.layers)
  )

  return {
    role: "EVALUATOR",
    workObjectId: target.work.id,
    canonicalProductContract: target.work,
    visibleTestContract: target.visibleTestSeam,
    oracleFamily,
    hiddenCases,
    candidate: concreteCandidate,
    checks: [
      "validate concrete visible tests faithfully implement pseudocode test contract",
      "run visible tests",
      "run hidden/evaluator cases",
      "run static architecture/scope/dependency checks",
      "classify failures",
      "emit immutable scored attempt record"
    ]
  }

function validateTestWriterOutput(target, concreteTests): Result:
  // Important: generated tests are themselves evaluated before being trusted.
  referenceMutationSet = generateKnownBadReferenceImplementations(target.work.id)
  assert concreteTests pass against known-good reference implementation when available
  assert concreteTests fail expected members of referenceMutationSet
  assert every mandatory pseudocode assertion maps to >=1 concrete assertion/probe
  assert test writer did not modify product implementation
  return PASS

MAIN:
  target = loadTarget(workObjectId)
  emit("generated/test-writer/...", buildTestWriterPacket(target))
  // After TEST-WRITER result is validated:
  emit("generated/implementer/...", buildImplementationPacket(target, validatedTests))
  // Evaluator packet is generated only inside trusted benchmark execution and
  // is never placed in the worker-visible workspace/context.
