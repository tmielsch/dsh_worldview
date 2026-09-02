/* @work-object
{"id":"HG-DIAG-001","purpose":"Probe DSH seams at boot and classify total-conversion assumptions so upstream drift fails visibly","dependsOn":["HG-SHELL-001","HG-AGENT-001","HG-AGENT-002"],"exports":["runDshSeamProbe","SeamProbeReport"],"context":["docs/10-dsh-seams.md"],"touchesDSH":true,"risk":"high","acceptance":["report verifies conversation.session registration/takeover","report identifies unavailable session read/send seam","failure names expected upstream contract instead of generic crash"]}
@end-work-object */
/* @seam HG-DIAG-001:begin */
runDshSeamProbe(ctx):
  checks = [
    assert service/slot registry available,
    assert slot "conversation.session" exists with expected single/session semantics,
    assert session read adapter can bind current/fixture session,
    assert prompt action adapter resolves,
    inspect whether unwanted stock shell chrome remains
  ]
  return { dshVersion, checks[], classificationHints[] }

if a formerly-C seam becomes A: flag patch as removable
if an A seam disappears: fail development boot with migration hint
/* @seam HG-DIAG-001:end */

/* @work-object
{"id":"HG-DIAG-002","purpose":"Give implementation agents a browser-visible self-test surface for UI/runtime errors and core interactions","dependsOn":["HG-GLOBE-002","HG-TIME-002","HG-AGENTUI-001","HG-DIAG-001"],"exports":["HistoricalGlobeSelfTest"],"context":[],"touchesDSH":false,"risk":"medium","acceptance":["self-test can rotate/zoom/scrub/select/send against a test session","uncaught errors and console errors are captured as structured failures","test report includes screenshots or DOM/renderer checkpoints where harness tooling supports them"]}
@end-work-object */
/* @seam HG-DIAG-002:begin */
HistoricalGlobeSelfTest.run(browserDriver):
  open historical-globe profile
  assert stock ChatView absent from session body
  assert globe canvas healthy and frame count advances
  drag globe; assert camera state changed
  scrub timeline; assert visible marker set changed
  click known marker; assert selected stable id
  enter prompt; submit; assert same session receives user turn and streaming response begins
  collect console errors + unhandled rejections + failed network requests
  return structured PASS/FAIL report with step evidence
/* @seam HG-DIAG-002:end */
