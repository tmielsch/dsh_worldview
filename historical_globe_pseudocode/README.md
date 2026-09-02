# Historical Globe — implementation-grade pseudocode

This directory describes the entire first vertical slice as separable work objects.

```text
DSH profile / bundle
        |
        v
TotalConversionShell  <---- DshSessionAdapter
        |
        +---- GlobeRenderer <---- SceneProjection <---- HistoricalStore
        |                               ^                   ^
        +---- Timeline -----------------+                   |
        |                                                   |
        +---- AgentOverlay ------------------------------ SeedLoader

SceneProjection = domain/time/LOD -> renderer-neutral SceneFrame
```

The renderer never knows DSH. The historical store never knows DSH. Only the profile/shell/session-adapter/diagnostic edges touch DSH.

Machine-readable global index: `work_objects/index.json`.
