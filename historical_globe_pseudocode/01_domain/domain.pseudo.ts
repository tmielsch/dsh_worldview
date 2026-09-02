/* @work-object
{"id":"HG-DOMAIN-001","purpose":"Define the DSH-neutral canonical historical domain contracts","dependsOn":[],"exports":["HistoricalEvent","HistoricalEntity","HistoricalRelation","GeoPoint","TimeInstant","SourceRef"],"context":["docs/00-product-contract.md"],"touchesDSH":false,"risk":"low","acceptance":["domain package imports no DSH packages","event/entity/relation ids are stable strings","open-ended events are representable"]}
@end-work-object */
/* @seam HG-DOMAIN-001:begin */
type HistoricalId = string
type TimeInstant = ISO_8601_STRING | SIGNED_HISTORICAL_YEAR_ENCODING

type GeoPoint = { latitude: number[-90..90], longitude: number[-180..180] }
type SourceRef = { kind: "wikipedia" | "wikidata" | "seed" | string, idOrUrl: string }

type HistoricalEvent = {
  id: HistoricalId
  title: string
  summary: string
  startTime: TimeInstant
  endTime?: TimeInstant
  importance: number[0..1]
  locations: GeoPoint[]
  entities: HistoricalId[]
  relations: HistoricalId[]
  topics: string[]
  sources: SourceRef[]
}

type HistoricalEntity = {
  id: HistoricalId
  type: "person" | "organization" | "place" | "state" | "other"
  name: string
  coordinates?: GeoPoint
  sources: SourceRef[]
}

type HistoricalRelation = {
  id: HistoricalId
  source: HistoricalId
  target: HistoricalId
  type: string
  weight?: number[0..1]
  startTime?: TimeInstant
  endTime?: TimeInstant
}
/* @seam HG-DOMAIN-001:end */
