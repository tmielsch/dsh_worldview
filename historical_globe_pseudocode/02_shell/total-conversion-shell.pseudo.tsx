/* @work-object
{"id":"HG-SHELL-001","purpose":"Take over DSH conversation.session and render Historical Globe as the session body","dependsOn":[],"exports":["HistoricalGlobeSessionSurface plugin"],"context":["docs/10-dsh-seams.md"],"touchesDSH":true,"risk":"high","acceptance":["stock ChatView is not rendered in the active session body","custom surface survives switching between DSH sessions","session body visibly identifies Historical Globe even before globe engine loads"]}
@end-work-object */
/* @seam HG-SHELL-001:begin */
plugin HistoricalGlobeSessionSurface(ctx):
  require service "slots"

  ctx.slots.inject("conversation.session", () =>
    ctx.slots.register(
      { name: "conversation.session", /* exact runtime/session props from public slot contract */ },
      HistoricalGlobeShell
    )
  )

component HistoricalGlobeShell(sessionSlotProps):
  // IMPORTANT: do not import or embed stock ChatView.
  sessionId = public session runtime prop/session kit
  render <FullBleedHistoricalGlobe sessionId=sessionId />
/* @seam HG-SHELL-001:end */

/* @work-object
{"id":"HG-SHELL-002","purpose":"Compose renderer, timeline and agent overlay without coupling them to each other","dependsOn":["HG-GLOBE-001","HG-TIME-002","HG-AGENTUI-001","HG-SCENE-001"],"exports":["FullBleedHistoricalGlobe"],"context":[],"touchesDSH":false,"risk":"medium","acceptance":["globe owns dominant available area","timeline remains visible at bottom","agent overlay can open/close without resizing domain/render state"]}
@end-work-object */
/* @seam HG-SHELL-002:begin */
component FullBleedHistoricalGlobe({sessionId}):
  timeState = TimelineStoreProvider()
  sceneFrame = useSceneProjection(timeState.currentTime, cameraState, filters)

  render AppSurface:
    GlobeRenderer(frame=sceneFrame, onCameraChange, onPick)
    TimelineScrubber(store=timeState) anchored BOTTOM
    SelectionDetails(selectedId) optional FLOATING
    AgentOverlay(sessionId=sessionId) optional FLOATING_RIGHT

  invariant: layout state may reference selected domain ids, never mutate domain records
/* @seam HG-SHELL-002:end */
