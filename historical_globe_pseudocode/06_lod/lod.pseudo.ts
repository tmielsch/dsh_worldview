/* @work-object
{"id":"HG-LOD-001","purpose":"Select bounded visible markers/edges using importance, zoom and optional focus without hard-coded category tiers","dependsOn":["HG-DOMAIN-001"],"exports":["LODPolicy","scoreMarker","selectMarkers","selectEdges"],"context":[],"touchesDSH":false,"risk":"medium","acceptance":["far zoom favors high-importance events","increasing marker budget never removes a previously selected higher-ranked marker absent ties","selection is deterministic"]}
@end-work-object */
/* @seam HG-LOD-001:begin */
LODPolicy := {
  importanceWeight: 0.65,
  cameraRelevanceWeight: 0.25,
  focusWeight: 0.10,
  markerBudgetByZoom: smooth curve,
  edgeBudgetByZoom: smooth curve
}

scoreMarker(candidate, camera):
  globalImportance = candidate.importance
  geographicRelevance = smooth function of camera-facingness + zoom + screen distance
  focusBoost = candidate matches active selection/topic ? 1 : 0
  return weighted score + deterministic id tie-break

selectMarkers(scored, budget): stableTopN(scored, budget)
selectEdges(scored, budget): stableTopN(scored, budget)
/* @seam HG-LOD-001:end */
