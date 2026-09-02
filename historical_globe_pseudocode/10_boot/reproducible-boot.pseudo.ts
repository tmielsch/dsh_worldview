/* @work-object
{"id":"HG-BOOT-001","purpose":"Bootstrap a repository-owned workspace into a dedicated DSH profile reproducibly without copying source into DSH installation","dependsOn":["HG-PROFILE-001","HG-BUNDLE-001"],"exports":["bootstrapHistoricalGlobeProfile","start command"],"context":["docs/10-dsh-seams.md"],"touchesDSH":true,"risk":"high","acceptance":["fresh clone can install workspace dependencies","bootstrap creates/updates only intended profile state under DSH_HOME","dump-config resolves repository bundle","start command boots custom surface"]}
@end-work-object */
/* @seam HG-BOOT-001:begin */
bootstrapHistoricalGlobeProfile(repoRoot, dshHome):
  assert compatible DSH version or install pinned project dev dependency
  install workspace with frozen lockfile
  initialize dedicated profile "historical-globe" through supported dsh plugin/profile command
  add/link repository bundle using a reproducible repository-relative strategy
  verify profile manifest bundle order
  run `dsh --profile historical-globe --dump-config`
  run HG-DIAG-001

start := one documented command wrapping `dsh --profile historical-globe ...`

NEVER:
  copy plugin source into DSH package directories
  commit secrets/runtime sessions
  depend on unrelated packages already present in user's web profile
/* @seam HG-BOOT-001:end */

/* @work-object
{"id":"HG-BOOT-002","purpose":"Falsify hidden machine-local dependencies on a clean second environment","dependsOn":["HG-BOOT-001","HG-DIAG-002"],"exports":["secondMachineSmoke"],"context":["docs/00-product-contract.md"],"touchesDSH":true,"risk":"medium","acceptance":["clean environment passes clone->install->bootstrap->start","no manual file copying","self-test passes using only declared config/secrets"]}
@end-work-object */
/* @seam HG-BOOT-002:begin */
secondMachineSmoke(cleanEnvironment):
  clone repository
  checkout exact revision
  install with frozen lockfile
  provide only explicitly documented secrets/config
  bootstrapHistoricalGlobeProfile()
  start profile
  run HistoricalGlobeSelfTest
  assert no dependency path resolves into developer's original checkout/home except declared DSH runtime home
/* @seam HG-BOOT-002:end */
