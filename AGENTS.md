# Agent rules

This repository is design-first. The files under `historical_globe_pseudocode/` are executable-design contracts, not disposable notes.

## Non-negotiable

- Preserve every `@work-object` and `@seam` boundary unless an architecture-level task explicitly changes it.
- One implementation task should target one work object or a declared compatible group.
- A work object may assume only the dependencies listed in its metadata.
- Do not silently reach through adapters into DSH internals.
- Domain code must remain DSH-neutral.
- Prefer public DSH seams. Record every workaround/patch in `docs/10-dsh-seams.md` using A/B/C/D classification.
- Keep acceptance probes runnable independently where practical.
- If a required contract is missing, stop that work object and report the missing seam; do not invent cross-module behavior.

## Work-object implementation protocol

1. Read `docs/20-work-object-protocol.md`.
2. Read the target work object's complete seam block.
3. Read only its declared `context` plus exported contracts of `dependsOn` work objects.
4. Implement behind the declared interface.
5. Run the listed acceptance probes.
6. Report any contract mismatch explicitly.

The goal is to make implementation possible with deliberately narrow-context, low-capability agents without architecture drift.
