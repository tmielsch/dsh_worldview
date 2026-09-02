/* @work-object
{"id":"HG-GLOBE-001","purpose":"Render and navigate a minimal interactive WebGL globe from SceneFrame","dependsOn":["HG-SCENE-001"],"exports":["GlobeRenderer","CameraState"],"context":[],"touchesDSH":false,"risk":"medium","acceptance":["pointer drag rotates globe","wheel/pinch changes zoom","20–100 markers render at stable coordinates","frame updates do not recreate renderer/canvas"]}
@end-work-object */
/* @seam HG-GLOBE-001:begin */
component GlobeRenderer({frame, onCameraChange, onPick}):
  canvasRef = persistent canvas
  engine = createOnce(GlobeEngine(canvasRef))

  onMount:
    engine.createEarthSphere()
    engine.installOrbitControls(onChange => onCameraChange(engine.cameraState()))
    engine.installResizeObserver()

  on frame change:
    engine.reconcileMarkers(key=id, frame.markers)
    engine.reconcileEdges(key=id, frame.edges)

  onUnmount: engine.dispose()

  render canvas only; no DSH/session imports
/* @seam HG-GLOBE-001:end */

/* @work-object
{"id":"HG-GLOBE-002","purpose":"Map pointer hits back to stable domain ids without renderer leakage","dependsOn":["HG-GLOBE-001"],"exports":["PickResult","installPicking"],"context":[],"touchesDSH":false,"risk":"low","acceptance":["clicking marker returns its stable id","clicking empty globe clears selection","LOD frame changes cannot return stale removed ids"]}
@end-work-object */
/* @seam HG-GLOBE-002:begin */
function installPicking(engine, getCurrentFrame, emit):
  onPointerClick(screenPoint):
    renderObject = engine.raycast(screenPoint).nearestPickable
    if none: emit(null); return
    id = renderObject.userData.sceneMarkerId
    if getCurrentFrame().markers contains id: emit({ kind: "marker", id })
    else emit(null)
/* @seam HG-GLOBE-002:end */
