/* @work-object
{"id":"HG-AGENTUI-001","purpose":"Render a compact custom Agent overlay for one DSH Session without stock ChatView","dependsOn":["HG-AGENT-001","HG-AGENT-002","HG-AGENT-003"],"exports":["AgentOverlay"],"context":[],"touchesDSH":false,"risk":"medium","acceptance":["overlay shows recent prose and compact activity","submit preserves draft while pending and clears submitted draft only after action accepts it","rejected send preserves draft","overlay can collapse to a small button while session continues"]}
@end-work-object */
/* @seam HG-AGENTUI-001:begin */
component AgentOverlay({sessionId}):
  reader = useAgentSessionReader(sessionId)
  actions = useAgentSessionActions(sessionId)
  draft = local UI state
  sendError = local UI state

  async submitDraft():
    submittedText = draft
    if empty(trim(submittedText)): return
    sendError = null
    try:
      acceptance = await actions.send(submittedText)
      if acceptance.accepted AND draft == submittedText:
        // Do not erase text the user typed while the request was pending.
        draft = ""
    catch error:
      sendError = safeProjectOwnedError(error)
      // Preserve draft so retry/edit remains possible.

  render FloatingPanel:
    Header("Agent", status=reader.status, collapseButton)
    ScrollArea:
      for item in mergeChronologically(reader.messages, projectCompactActivity(reader.activity)):
        render custom minimal MessageBubble OR ActivityRow
    Composer:
      TextArea(value=draft)
      if sendError: compact retry-safe error indicator
      if status == running: CancelButton(actions.cancel)
      SendButton(onClick => submitDraft())

  invariant: no import of stock DSH ChatView/message/tool card components
/* @seam HG-AGENTUI-001:end */
