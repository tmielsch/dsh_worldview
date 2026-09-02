# Machine-splittable work-object protocol

The pseudocode is intentionally written so a program can carve the design into bounded implementation tasks.

## Delimiters

Every independently implementable block has:

```text
/* @work-object
{ valid JSON metadata }
@end-work-object */
/* @seam WORK-ID:begin */
... pseudocode ...
/* @seam WORK-ID:end */
```

The splitter MUST treat the seam body as the implementation specification and the JSON header as routing/context metadata.

## Metadata schema

```json
{
  "id": "HG-AREA-NNN",
  "purpose": "one responsibility",
  "dependsOn": ["other work ids"],
  "exports": ["public symbols/contracts"],
  "context": ["files an implementation agent may need"],
  "touchesDSH": true,
  "risk": "low|medium|high",
  "acceptance": ["black-box probes"],
  "notes": "optional constraints"
}
```

## Splitting rules

- A work object owns one cohesive behavior, not one arbitrary file chunk.
- Dependencies must form a DAG for the first vertical slice.
- Shared types are upstream work objects; consumers do not redefine them.
- UI work objects consume adapters/stores, never raw DSH internals unless their own metadata says `touchesDSH: true`.
- Acceptance probes should be executable without understanding the architecture.
- An evaluator may merge adjacent work objects for a larger session, but must never split inside a seam unless it also generates a new explicit contract.

## Recommended evaluation features

For each work object compute: seam LOC/tokens, dependency fan-in/fan-out, number of exported symbols, number of external/DSH references, UI/browser requirement, statefulness, concurrency/streaming requirement, test surface, and architecture risk. Route high-coupling/DSH/high-risk objects to stronger sessions; route leaf render/data objects to weaker sessions.

## Context capsule generation

A work packet should contain only:

1. global invariants from `docs/00-product-contract.md`;
2. the target metadata + seam;
3. exported signatures (not bodies) of `dependsOn` objects;
4. files named in `context`;
5. acceptance probes.

This is deliberate: implementation agents should not need the whole codebase to remain architecturally correct.
