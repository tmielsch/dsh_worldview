/* @work-object
{"id":"HG-STORE-001","purpose":"Own canonical in-memory first-slice historical state and deterministic temporal queries","dependsOn":["HG-DOMAIN-001"],"exports":["HistoricalStore","HistoricalSnapshot","HistoricalQuery"],"context":[],"touchesDSH":false,"risk":"low","acceptance":["loading same records twice yields same snapshot","queryAt returns only temporally active events/relations","query output order is deterministic"]}
@end-work-object */
/* @seam HG-STORE-001:begin */
interface HistoricalStore {
  replaceAll(dataset): void
  snapshot(): HistoricalSnapshot
  query(query: HistoricalQuery): HistoricalSnapshot
}

type HistoricalQuery = {
  at: TimeInstant
  topicFilter?: Set<string>
  minimumImportance?: number
}

function isActive(intervalOwner, at): boolean :=
  intervalOwner.startTime <= at AND (intervalOwner.endTime absent OR at <= intervalOwner.endTime)

function query(query): HistoricalSnapshot :=
  events = allEvents.filter(isActive(_, query.at))
                    .filter(topic/importance predicates)
                    .sort(stable by importance desc then id asc)
  relations = allRelations.filter(isActive(_, query.at))
                          .filter(endpoints still relevant)
                          .sort(stable by id)
  entities = entities referenced by returned events/relations
  return immutable snapshot
/* @seam HG-STORE-001:end */
