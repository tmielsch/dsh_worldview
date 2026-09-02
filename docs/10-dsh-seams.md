# DSH extension-seam ledger

Snapshot: 2026-09-03. DSH is still a developer preview; verify exact contracts before implementation.

Classification:

- **A** — clean public extension seam.
- **B** — project-owned wrapper/adapter over public contracts.
- **C** — small maintained downstream DSH patch.
- **D** — invasive coupling; architecture warning.

## Confirmed upstream model

### A — profiles and bundles

A profile is an ordered composition under `$DSH_HOME/profiles/<name>`. Its `package.json` declares `dsh.profile.bundles`. A bundle is an npm package declaring `dsh.bundle.patch`; its Cordis patch contributes/replaces plugin rows. Bundle layers apply in profile order, followed by profile/home/CLI patch overlays.

Implication: repository-owned packages can remain out-of-tree and be linked/installed into a dedicated profile rather than copied into DSH source/install directories.

Sources:
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md
- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/boot/app-boot

### A — complete session-body replacement

The client slot contract currently defines `conversation.session` as a session-scoped `single` slot. Its upstream comment explicitly states that taking this seat means rendering the session conversation yourself; an empty seat yields a blank session pane. This is the primary total-conversion seam for the first proof.

Source:
- https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/src/client/contract/slots.ts

### A — target-neutral conversation/session assembly

`ui-conversation` owns target-neutral assembly and exposes session/input concepts through the standard client kit. It sits between session event windows and browser views. The project should consume this rather than pair raw tool/results or reconstruct transcript topology if the required public projection is available.

Sources:
- https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/README.md
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/conversation.md

### A/B — custom rendering through slots

Current web-client architecture composes UI via `ctx.slots.register(...)`; `conversation.view` is additive, while `conversation.session` is the strict full-body takeover. Historical Globe should take the full body seat, then hide/remove unrelated shell chrome through higher-level public slots/config if those seams prove adequate.

Source:
- https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md

## Unknowns to probe, not assume

| Question | Initial class | Proof required |
|---|---:|---|
| Can the stock sidebar/top-level shell be removed entirely by profile/slot composition? | A/B? | dump config + slot inspection |
| Can a custom session body consume a stable incremental Session projection without importing private UI modules? | A/B? | compile/runtime probe |
| What is the narrowest public send/cancel/start-session API available to out-of-tree client plugins? | A/B? | inspect client service contract |
| Can tool activity be projected generically without reusing stock cards? | A/B? | inspect conversation nodes / runtime session API |
| Can branding/title/favicon/root chrome be profile-specific without patching DSH? | A/B/C? | configuration/slot probe |
| Can a repository provide a zero-copy ergonomic profile launcher while DSH still stores runtime profile state under `$DSH_HOME`? | B | bootstrap experiment |

## Patch policy

A C-level patch is acceptable if it is:

1. small and independently testable;
2. documented with upstream file/contract and reason;
3. carried as a minimal downstream patch stack;
4. guarded by a probe that tells us when upstream makes it unnecessary.

No D-level dependency is acceptable for the first vertical slice unless it falsifies the total-conversion premise and is documented as such.
