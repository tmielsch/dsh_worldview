/* @work-object
{"id":"HG-TIME-001","purpose":"Own normalized historical time state independently of UI and renderer","dependsOn":["HG-DOMAIN-001"],"exports":["TimelineStore"],"context":[],"touchesDSH":false,"risk":"low","acceptance":["setTime clamps to configured range","subscribers receive one update per effective change","time representation supports eventual pre-CE dates"]}
@end-work-object */
/* @seam HG-TIME-001:begin */
class TimelineStore:
  state = { minTime, maxTime, currentTime }
  setTime(next): currentTime = clamp(normalizeHistoricalTime(next), minTime, maxTime); publishIfChanged()
  step(delta): setTime(addHistoricalDuration(currentTime, delta))
  subscribe(listener): unsubscribe
  snapshot(): immutable state
/* @seam HG-TIME-001:end */

/* @work-object
{"id":"HG-TIME-002","purpose":"Provide direct-manipulation timeline scrubbing over TimelineStore","dependsOn":["HG-TIME-001"],"exports":["TimelineScrubber"],"context":[],"touchesDSH":false,"risk":"low","acceptance":["drag maps monotonically across min/max time","keyboard arrows step time","scrubbing updates scene without remounting globe"]}
@end-work-object */
/* @seam HG-TIME-002:begin */
component TimelineScrubber({store}):
  state = useExternalStore(store)
  normalized = inverseLerp(state.minTime, state.maxTime, state.currentTime)
  onDrag(xWithinTrack): store.setTime(lerpHistoricalTime(min,max, clamp01(x/width)))
  onArrow(direction): store.step(direction * adaptiveStepForVisibleRange)
  render track + sparse major ticks + current date label
/* @seam HG-TIME-002:end */
