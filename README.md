# DSH Worldview / Historical Globe

Design-first experiment for a **DeepSeek Harness total-conversion profile** whose visible application is an interactive historical globe while DSH remains the runtime/session/agent host.

This repository intentionally starts with an implementation-grade pseudocode architecture before real code. The pseudocode is split into machine-readable seams so later tooling can turn the design into independent work objects for implementation agents.

## Current phase

- Canonical product/architecture brief: `docs/00-product-contract.md`
- DSH extension findings: `docs/10-dsh-seams.md`
- Work-object/seam protocol: `docs/20-work-object-protocol.md`
- Full pseudocode design: `historical_globe_pseudocode/`

## Target proof

`clone -> install -> start historical-globe profile` should eventually boot a UI that looks entirely like Historical Globe, while reusing DSH sessions, agent execution, tools, persistence, policy, and streaming underneath.

## Architecture rule

Historical-domain state stays canonical and DSH-neutral. DSH is host/runtime infrastructure, never the canonical historical data model.
