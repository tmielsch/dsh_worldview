# First-slice implementation order

The pseudocode dependency graph permits parallelism, but the proof should advance in this order:

1. **Profile/bundle boot:** HG-PROFILE-001, HG-BUNDLE-001, HG-BOOT-001.
2. **Hard total-conversion proof:** HG-SHELL-001. Render an unmistakable custom blank/globe shell in `conversation.session` before doing domain work.
3. **Domain + seed:** HG-DOMAIN-001, HG-DATA-001, HG-STORE-001.
4. **Time/scene/LOD:** HG-TIME-001, HG-LOD-001, HG-SCENE-001.
5. **Globe interaction:** HG-GLOBE-001, HG-GLOBE-002, HG-TIME-002.
6. **Real DSH session:** HG-AGENT-001, HG-AGENT-002, HG-AGENT-003, HG-AGENTUI-001.
7. **Diagnostics/falsification:** HG-DIAG-001, HG-DIAG-002.
8. **Second-machine proof:** HG-BOOT-002.

Do not begin Wikipedia/Wikidata ingestion until the total-conversion/session proof is working. The first data adapter is intentionally seed-only.
