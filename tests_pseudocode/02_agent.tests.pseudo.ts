// Visible test contracts for DSH session adapter and compact agent UI.

/* @test-spec
{"for":"HG-AGENT-001","layers":["UNIT","DSH_INTEGRATION"],"fixtures":["fake public DSH session kit","streaming session fixture","two-session fixture"],"requiresRealDSH":true,"requiresBrowser":false,"oracleFamily":"HG-AGENT-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-AGENT-001:begin */
suite("HG-AGENT-001", () => {
  test("existing-history-projects-to-project-owned-message-types", "UNIT", () => {
    kit = fakeDshSessionKit({history: dshHistoryFixture()})
    reader = new DshAgentSessionReader(kit, "s1")
    state = firstSnapshot(reader)
    expect(state.messages).toEqual(expectedAgentMessages())
    expect(containsDshWireValue(state)).toBeFalse()
  })

  test("streaming-assistant-output-updates-incrementally", "UNIT", () => {
    kit = fakeDshSessionKit({history: []})
    reader = new DshAgentSessionReader(kit, "s1")
    observed = collectSnapshots(reader)
    kit.emitAssistantDelta("hel")
    kit.emitAssistantDelta("lo")
    expect(observed).toContainStateWithAssistantText("hel")
    expect(observed.last().messages.last().text).toEqual("hello")
  })

  test("tool-and-agent-lifecycle-becomes-project-owned-activity", "UNIT", () => {
    kit = fakeDshSessionKit()
    reader = new DshAgentSessionReader(kit, "s1")
    observed = collectSnapshots(reader)
    kit.emitToolStart(fixtureToolCall)
    expect(observed.last().activity).toContainProjectOwnedActivityFor(fixtureToolCall.id)
    expect(containsDshWireValue(observed.last())).toBeFalse()
  })

  test("reader-disposal-detaches-session-subscription", "UNIT", () => {
    kit = fakeDshSessionKitWithSubscriptionProbe()
    reader = new DshAgentSessionReader(kit, "s1")
    unsubscribe = reader.subscribe(noop)
    expect(kit.subscriptionProbe.activeCount).toEqual(1)
    unsubscribe()
    expect(kit.subscriptionProbe.activeCount).toEqual(0)
  })

  test("real-public-session-seam-projects-fixture-history", "DSH_INTEGRATION", () => {
    dsh = bootDshFixtureWithKnownSession()
    reader = new DshAgentSessionReader(resolvePublicSessionKit(dsh), dsh.fixtureSessionId)
    expect(firstSnapshot(reader).messages).toContainKnownFixtureHistory()
  })
})
/* @test-seam HG-AGENT-001:end */

/* @test-spec
{"for":"HG-AGENT-002","layers":["UNIT","DSH_INTEGRATION"],"fixtures":["fake conversation actions","real DSH fixture session"],"requiresRealDSH":true,"requiresBrowser":false,"oracleFamily":"HG-AGENT-002-ORACLE"}
@end-test-spec */
/* @test-seam HG-AGENT-002:begin */
suite("HG-AGENT-002", () => {
  test("empty-prompt-is-rejected-before-public-action", "UNIT", async () => {
    actionsProbe = fakeConversationActions()
    actions = new DshAgentSessionActions(actionsProbe, "s1")
    await expectRejects(actions.send("   "), NonEmptyPromptError)
    expect(actionsProbe.sendCalls).toEqual(0)
  })

  test("send-targets-bound-session-and-returns-action-acceptance", "UNIT", async () => {
    actionsProbe = fakeConversationActions({sendResult: accepted()})
    actions = new DshAgentSessionActions(actionsProbe, "s1")
    result = await actions.send("hello")
    expect(actionsProbe.lastSend).toEqual({sessionId:"s1", text:"hello"})
    expect(result).toRepresentAcceptedSend()
  })

  test("send-rejection-propagates-to-caller", "UNIT", async () => {
    actionsProbe = fakeConversationActions({sendResult: rejected("busy")})
    actions = new DshAgentSessionActions(actionsProbe, "s1")
    await expectRejects(actions.send("hello"), ActionRejected)
  })

  test("cancel-targets-bound-session", "UNIT", async () => {
    actionsProbe = fakeConversationActions()
    actions = new DshAgentSessionActions(actionsProbe, "s1")
    await actions.cancel()
    expect(actionsProbe.lastCancel).toEqual({sessionId:"s1"})
  })

  test("send-does-not-synthesize-local-session-events", "UNIT", async () => {
    actionsProbe = fakeConversationActions()
    localProjection = sessionProjectionMutationProbe()
    actions = new DshAgentSessionActions(actionsProbe, "s1")
    await actions.send("hello")
    expect(localProjection.syntheticAppendCalls).toEqual(0)
  })

  test("real-send-is-observed-through-reader", "DSH_INTEGRATION", async () => {
    dsh = bootDshFixtureWithWritableSession()
    reader = bindProjectReader(dsh)
    actions = bindProjectActions(dsh)
    await actions.send("benchmark fixture prompt")
    expectEventually(() => reader.snapshot().messages contains userText("benchmark fixture prompt"), timeout)
  })
})
/* @test-seam HG-AGENT-002:end */

/* @test-spec
{"for":"HG-AGENT-003","layers":["UNIT","PROPERTY"],"fixtures":["known tool lifecycle","unknown activity","large raw output"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-AGENT-003-ORACLE"}
@end-test-spec */
/* @test-seam HG-AGENT-003:begin */
suite("HG-AGENT-003", () => {
  test("lifecycle-events-group-by-stable-call-identity", "UNIT", () => {
    activities = lifecycleEventsForCallsInterleaved(["call-a","call-b"])
    compact = projectCompactActivity(activities)
    expect(compact).toHaveOneLogicalRowPerCallIdentity()
    expect(compact.row("call-a").phase).toEqual("completed")
  })

  test("completed-known-activity-keeps-short-inspectable-summary", "UNIT", () => {
    compact = projectCompactActivity(completedKnownToolActivity())
    expect(compact.first().phase).toEqual("completed")
    expect(compact.first().shortSummary).toBeNonEmpty()
  })

  test("unknown-activity-degrades-without-crash", "UNIT", () => {
    unknown = {kind:"future-dsh-kind", phase:"running", payload:{anything:true}}
    compact = projectCompactActivity([unknown])
    expect(compact.first().label).toEqual("future-dsh-kind")
    expect(compact.first().shortSummary).toBeSafeGenericText()
  })

  test("raw-tool-output-is-bounded", "UNIT", () => {
    activity = completedToolWithRawOutput(repeat("x", 1_000_000))
    compact = projectCompactActivity([activity])
    expect(serializedSize(compact)).toBeFarBelow(serializedSize(activity))
    expect(compact).not.toContain(repeat("x", 10_000))
  })

  property("activity-ordering-is-stable-for-equivalent-lifecycle-order", generatedEquivalentActivityStreams(), 50, stream => {
    expect(snapshotStructural(projectCompactActivity(stream))).toEqual(canonicalCompactProjection(stream.semanticCalls))
  })
})
/* @test-seam HG-AGENT-003:end */

/* @test-spec
{"for":"HG-AGENTUI-001","layers":["STATIC","COMPONENT","INTEGRATION"],"fixtures":["fake reader","accepting/rejecting actions","running session"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-AGENTUI-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-AGENTUI-001:begin */
suite("HG-AGENTUI-001", () => {
  test("overlay-does-not-import-stock-chat-components", "STATIC", () => {
    expectNoImport("*ChatView*")
    expectNoImport("*stock*message*card*")
    expectNoImport("*stock*tool*card*")
  })

  test("recent-prose-and-activity-merge-chronologically", "COMPONENT", () => {
    reader = fakeAgentReader(interleavedMessageAndActivityFixture())
    overlay = mountAgentOverlay({reader, actions: fakeAgentActions()})
    expect(overlay.visibleItems()).toEqual(expectedChronologicalCompactItems())
  })

  test("accepted-send-clears-draft-after-acceptance", "COMPONENT", async () => {
    deferred = deferredAcceptedSend()
    overlay = mountAgentOverlay({reader: idleReader(), actions: fakeAgentActions({send: deferred.promise})})
    overlay.type("hello")
    overlay.clickSend()
    expect(overlay.draft()).toEqual("hello") // pending: preserve user text
    deferred.accept()
    await flushAsync()
    expect(overlay.draft()).toEqual("")
  })

  test("rejected-send-preserves-draft", "COMPONENT", async () => {
    actions = fakeAgentActions({send: rejectWith("busy")})
    overlay = mountAgentOverlay({reader: idleReader(), actions})
    overlay.type("hello")
    overlay.clickSend()
    await flushAsync()
    expect(overlay.draft()).toEqual("hello")
    expect(overlay).toExposeSendFailureWithoutCrashing()
  })

  test("running-status-shows-cancel-and-invokes-action", "COMPONENT", () => {
    actions = fakeAgentActions()
    overlay = mountAgentOverlay({reader: runningReader(), actions})
    expect(overlay.cancelButton()).toBeVisible()
    overlay.clickCancel()
    expect(actions.cancelCalls).toEqual(1)
  })

  test("collapse-does-not-stop-session-or-reader", "INTEGRATION", () => {
    reader = streamingReaderProbe()
    actions = fakeAgentActions()
    overlay = mountAgentOverlay({reader, actions})
    overlay.collapse()
    reader.emitAssistantDelta("still running")
    expect(reader.subscriptionProbe.activeCount).toEqual(1)
    expect(actions.cancelCalls).toEqual(0)
    overlay.expand()
    expect(overlay).toContainText("still running")
  })
})
/* @test-seam HG-AGENTUI-001:end */
