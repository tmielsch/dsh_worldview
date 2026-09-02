/* @work-object
{"id":"HG-SCENE-001","purpose":"Project canonical historical state into a renderer-neutral frame for one time/camera/filter state","dependsOn":["HG-STORE-001","HG-LOD-001"],"exports":["SceneFrame","SceneMarker","SceneEdge","projectScene"],"context":[],"touchesDSH":false,"risk":"medium","acceptance":["same snapshot+view inputs produce identical frame","renderer frame contains no DSH types","edges with invisible endpoints are omitted"]}
@end-work-object */
/* @seam HG-SCENE-001:begin */
type SceneMarker = { id, position: GeoPoint, label, importance, visualRank }
type SceneEdge = { id, sourceMarkerId, targetMarkerId, relationType, visualRank }
type SceneFrame = { time, markers: SceneMarker[], edges: SceneEdge[] }

function projectScene(store, view): SceneFrame:
  snapshot = store.query({ at: view.time, topicFilter: view.filters.topics })
  markerCandidates = flatten event locations + located entities
  markerScores = LOD.scoreMarkers(markerCandidates, view.camera)
  markers = LOD.selectMarkers(markerScores, view.budgets.markerCount)
  visibleIds = set(markers.id)

  edgeCandidates = snapshot.relations
    .where(source and target can resolve to visible marker ids)
  edges = LOD.selectEdges(scoreEdges(edgeCandidates, view.camera), view.budgets.edgeCount)

  return immutable deterministic SceneFrame
/* @seam HG-SCENE-001:end */
