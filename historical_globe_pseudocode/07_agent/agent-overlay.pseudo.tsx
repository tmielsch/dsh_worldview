/* @work-object
{"id":"HG-AGENTUI-001","purpose":"Render a compact custom Agent overlay for one DSH Session without stock ChatView","dependsOn":["HG-AGENT-001","HG-AGENT-002","HG-AGENT-003"],"exports":["AgentOverlay"],"context":[],"touchesDSH":false,"risk":"medium","acceptance":["overlay shows recent prose and compact activity","submit clears draft only after action accepts it","overlay can collapse to a small button while session continues"]}
@end-work-object */
/* @seam HG-AGENTUI-001:begin */
component AgentOverlay({sessionId}):
  reader = useAgentSessionReader(sessionId)
  actions = useAgentSessionActions(sessionId)
  draft = local UI state

  render FloatingPanel:
    Header("Agent", status=reader.status, collapseButton)
    ScrollArea:
      for item in mergeChronologically(reader.messages, projectCompactActivity(reader.activity)):
        render custom minimal MessageBubble OR ActivityRow
    Composer:
      TextArea(value=draft)
      if status == running: CancelButton(actions.cancel)
      SendButton(onClick => { actions.send(draft); draft = "" })

  invariant: no import of stock DSH ChatView/message/tool card components
/* @seam HG-AGENTUI-001:end */
