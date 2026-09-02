# split-work-objects — pseudocode

Purpose: convert the architecture pseudocode into bounded implementation packets without asking implementation agents to rediscover architecture.

```ts
INPUTS:
  repoRoot
  targetWorkIds?          // absent => all objects
  maxPacketTokens?        // evaluator may use this after extraction

CONSTANTS:
  HEADER_START = "/* @work-object"
  HEADER_END   = "@end-work-object */"
  SEAM_PREFIX  = "/* @seam "

function scanRepository(repoRoot): WorkObjectMap {
  files = recursivelyReadTextFiles(repoRoot / "historical_globe_pseudocode")
  objects = new Map()

  for file in files:
    cursor = 0
    while next HEADER_START exists:
      metadataText = exact text between HEADER_START and HEADER_END
      metadata = JSON.parse(metadataText)
      validate(metadata, repoRoot / "work_objects/schema.json")

      beginMarker = `/* @seam ${metadata.id}:begin */`
      endMarker   = `/* @seam ${metadata.id}:end */`
      seamBody = exact text between unique beginMarker and endMarker

      assert metadata.id not already registered
      objects.set(metadata.id, {
        metadata,
        seamBody,
        sourceFile: relative(file),
        sourceRange: exact line interval
      })

  validateDependencyGraph(objects)
  validateAgainstIndex(objects, repoRoot / "work_objects/index.json")
  return objects
}

function validateDependencyGraph(objects): void {
  for object in objects:
    for dependencyId in object.metadata.dependsOn:
      assert objects.has(dependencyId)
      assert dependencyId != object.id

  assert graph(objects.dependsOn) is acyclic
}

function exportedContract(object): string {
  // First implementation may use metadata.exports + seam extraction heuristics.
  // Later replace with language-aware interface extraction once real code exists.
  return summarize ONLY public types/signatures named by object.metadata.exports
}

function buildContextCapsule(target, objects): ContextCapsule {
  globalInvariants = extractNonNegotiableSections(
    read("docs/00-product-contract.md"),
    read("AGENTS.md")
  )

  dependencyContracts = []
  for depId in target.metadata.dependsOn:
    dependencyContracts.push({
      id: depId,
      contract: exportedContract(objects[depId])
    })

  explicitContext = target.metadata.context.map(read)

  return {
    workObjectId: target.id,
    instructions: [
      "Implement only this seam behind the declared contract.",
      "Do not redesign dependencies.",
      "Do not use undeclared DSH internals.",
      "Run every acceptance probe and report mismatches."
    ],
    globalInvariants,
    metadata: target.metadata,
    specification: target.seamBody,
    dependencyContracts,
    explicitContext,
    acceptance: target.metadata.acceptance
  }
}

function estimateDifficulty(object, objects): EvaluationFeatures {
  return {
    tokens: tokenCount(object.seamBody),
    dependencyFanIn: object.metadata.dependsOn.length,
    dependencyFanOut: countConsumers(object.id),
    exportCount: object.metadata.exports.length,
    contextFileCount: object.metadata.context.length,
    touchesDSH: object.metadata.touchesDSH,
    risk: object.metadata.risk,
    browserLikely: inferFromPurposeAndFile(object),
    statefulLikely: inferStatefulness(object.seamBody),
    streamingOrConcurrencyLikely: inferStreaming(object.seamBody),
    externalReferenceCount: countExternalSymbols(object.seamBody)
  }
}

function emitPackets(objects, targetWorkIds): void {
  ordered = topologicalSort(objects)
  selected = filter(ordered, targetWorkIds)

  for object in selected:
    packet = buildContextCapsule(object, objects)
    features = estimateDifficulty(object, objects)

    write(`generated/work_objects/${object.id}/packet.md`, renderPacket(packet))
    write(`generated/work_objects/${object.id}/features.json`, JSON.stringify(features))
}

MAIN:
  objects = scanRepository(repoRoot)
  emitPackets(objects, targetWorkIds)
```

## Evaluator boundary

The splitter does **not** decide which model/session gets a work object. It emits stable packets plus measurable features. A separate evaluator may then:

- assign one packet to a small session;
- group adjacent compatible packets for a larger session;
- route high-risk DSH seams to stronger models;
- reject a proposed grouping if it creates undeclared dependency/context coupling.

The evaluator must never silently rewrite architecture contracts while routing work.
