/* @work-object
{"id":"HG-AGENT-001","purpose":"Expose a narrow project-owned read model over the current DSH Session using public client/session conversation seams","dependsOn":[],"exports":["AgentSessionReader","AgentViewState","AgentMessage","AgentActivity"],"context":["docs/10-dsh-seams.md"],"touchesDSH":true,"risk":"high","acceptance":["existing session history appears without importing stock ChatView","streaming assistant output updates incrementally","session switch cleanly detaches prior subscriptions"]}
@end-work-object */
/* @seam HG-AGENT-001:begin */
type AgentViewState = {
  sessionId,
  messages: AgentMessage[],
  activity: AgentActivity[],
  status: "idle" | "running" | "error"
}

class DshAgentSessionReader implements AgentSessionReader:
  constructor(publicDshSessionKit, sessionId)
  subscribe(listener):
    binding = publicDshSessionKit.bind(sessionId)
    projection = binding.conversation/session-event projection // exact public seam discovered during implementation
    return projection.subscribe(() => listener(project(projection.snapshot())))

  project(dshSnapshot):
    // Translate at boundary; no DSH wire types escape this adapter.
    messages = incremental human/assistant prose projection
    activity = tool/command/agent lifecycle projection
    return AgentViewState
/* @seam HG-AGENT-001:end */

/* @work-object
{"id":"HG-AGENT-002","purpose":"Send/cancel prompts to the same active DSH Session through the narrowest public input/conversation action seam","dependsOn":["HG-AGENT-001"],"exports":["AgentSessionActions"],"context":["docs/10-dsh-seams.md"],"touchesDSH":true,"risk":"high","acceptance":["custom text input sends into current session","new output is observed by HG-AGENT-001","cancel stops an active generation through public runtime action"]}
@end-work-object */
/* @seam HG-AGENT-002:begin */
class DshAgentSessionActions:
  constructor(publicConversationOrInputActions, sessionId)
  send(text):
    assert nonEmpty(text)
    publicAction.send({ sessionId, text }) // adapt to exact upstream signature
  cancel(): publicAction.cancel({ sessionId })

invariant: NEVER synthesize Session events locally to mimic sending
/* @seam HG-AGENT-002:end */

/* @work-object
{"id":"HG-AGENT-003","purpose":"Reduce generic DSH activity into compact user-facing status rows independent of stock tool cards","dependsOn":["HG-AGENT-001"],"exports":["projectCompactActivity"],"context":[],"touchesDSH":false,"risk":"medium","acceptance":["running tool activity has a stable compact row","completed activity remains inspectable by summary","unknown activity degrades to generic label rather than crashing"]}
@end-work-object */
/* @seam HG-AGENT-003:begin */
function projectCompactActivity(activity): CompactActivity[] :=
  group low-level lifecycle events by stable call/run identity
  map known kinds -> { label, phase, shortSummary }
  map unknown kinds -> { label: activity.kind, phase, shortSummary: safe generic text }
  never render raw unbounded tool output in compact overlay
/* @seam HG-AGENT-003:end */
