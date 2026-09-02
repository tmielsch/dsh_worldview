/* @work-object
{"id":"HG-DATA-001","purpose":"Load a small deterministic real-coordinate seed dataset for the first slice without premature Wikipedia ingestion infrastructure","dependsOn":["HG-DOMAIN-001"],"exports":["loadSeedDataset","seed.schema"],"context":["docs/00-product-contract.md"],"touchesDSH":false,"risk":"low","acceptance":["dataset contains 20–100 events","every rendered seed event has at least one valid coordinate","several relations connect resolvable endpoints","all records cite seed/source provenance"]}
@end-work-object */
/* @seam HG-DATA-001:begin */
seed.schema := exact serialized form of HistoricalEvent/HistoricalEntity/HistoricalRelation

function loadSeedDataset(json): Dataset:
  validate unique ids
  validate coordinate ranges
  validate temporal interval ordering
  validate relation endpoints exist
  validate event entity/relation references resolve
  reject whole dataset with path-rich errors on invalid record
  return immutable normalized dataset

NOTE: seed facts may be curated manually for slice 1. Do not build Wikidata import pipeline here.
/* @seam HG-DATA-001:end */
