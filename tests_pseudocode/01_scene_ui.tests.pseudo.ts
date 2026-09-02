// Visible test contracts for scene projection, globe, timeline, and shell.

/* @test-spec
{"for":"HG-SCENE-001","layers":["UNIT","PROPERTY","STATIC"],"fixtures":["scene dataset","camera fixtures","LOD budgets"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-SCENE-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-SCENE-001:begin */
suite("HG-SCENE-001", () => {
  test("projection-is-deterministic", "UNIT", () => {
    store = fakeHistoricalStore(sceneFixture())
    view = fixedSceneView()
    expectDeterministic(projectScene(store, view), projectScene(store, deepClone(view)))
  })

  test("scene-frame-has-no-dsh-types-or-imports", "STATIC", () => {
    expectNoImport("@deepseek-ai/*")
    frame = projectScene(fakeHistoricalStore(sceneFixture()), fixedSceneView())
    expect(containsDshWireValue(frame)).toBeFalse()
  })

  test("edges-require-visible-resolvable-endpoints", "UNIT", () => {
    frame = projectScene(fakeHistoricalStore(sceneFixtureWithHiddenEndpoint()), viewWithMarkerBudget(1))
    visible = set(frame.markers.ids())
    expect(frame.edges.every(e => visible.has(e.sourceMarkerId) AND visible.has(e.targetMarkerId))).toBeTrue()
  })

  test("projection-respects-marker-and-edge-budgets", "UNIT", () => {
    frame = projectScene(fakeHistoricalStore(denseSceneFixture()), viewWithBudgets({markerCount: 7, edgeCount: 4}))
    expect(frame.markers.length).toBeAtMost(7)
    expect(frame.edges.length).toBeAtMost(4)
  })

  property("store-record-order-does-not-change-frame", permutationsOfSceneFixture(), 20, dataset => {
    frame = projectScene(fakeHistoricalStore(dataset), fixedSceneView())
    expect(snapshotStructural(frame)).toEqual(canonicalSceneFrame())
  })
})
/* @test-seam HG-SCENE-001:end */

/* @test-spec
{"for":"HG-GLOBE-001","layers":["STATIC","COMPONENT","BROWSER_E2E"],"fixtures":["fake globe engine","20 marker frame","100 marker frame"],"requiresRealDSH":false,"requiresBrowser":true,"oracleFamily":"HG-GLOBE-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-GLOBE-001:begin */
suite("HG-GLOBE-001", () => {
  test("renderer-has-no-dsh-imports", "STATIC", () => expectNoImport("@deepseek-ai/*"))

  test("engine-and-canvas-survive-frame-updates", "COMPONENT", () => {
    engine = fakeGlobeEngine()
    mounted = mountGlobeRenderer({ engineFactory: () => engine, frame: frameA() })
    canvasIdentity = mounted.canvas
    expect(engine.createCount).toEqual(1)

    mounted.update({ frame: frameB() })
    mounted.update({ frame: frameC() })

    expect(engine.createCount).toEqual(1)
    expect(mounted.canvas).toBeSameObject(canvasIdentity)
    expect(engine.markerReconcileCalls).toHaveLength(3)
  })

  test("unmount-disposes-engine-exactly-once", "COMPONENT", () => {
    engine = fakeGlobeEngine()
    mounted = mountGlobeRenderer({ engineFactory: () => engine, frame: frameA() })
    mounted.unmount()
    expect(engine.disposeCount).toEqual(1)
  })

  test("drag-rotates-and-emits-camera-state", "BROWSER_E2E", () => {
    browser = openRendererFixture(frameWith20Markers())
    before = browser.cameraState()
    browser.dragGlobe({dx: 120, dy: 30})
    expect(browser.cameraState()).not.toEqual(before)
    expect(browser.lastOnCameraChange()).toEqual(browser.cameraState())
  })

  test("wheel-or-pinch-changes-zoom", "BROWSER_E2E", () => {
    browser = openRendererFixture(frameWith20Markers())
    before = browser.cameraState().zoom
    browser.wheelOnGlobe(-400)
    expect(browser.cameraState().zoom).not.toEqual(before)
  })

  test("marker-geography-is-stable-across-rerender", "BROWSER_E2E", () => {
    browser = openRendererFixture(frameWithKnownCoordinates())
    first = browser.projectedMarkerPositions()
    browser.updateFrame(equivalentFrameNewObjectIdentity())
    expect(browser.projectedMarkerPositions()).toEqual(first)
  })
})
/* @test-seam HG-GLOBE-001:end */

/* @test-spec
{"for":"HG-GLOBE-002","layers":["UNIT","COMPONENT"],"fixtures":["fake raycaster","current/stale frames"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-GLOBE-002-ORACLE"}
@end-test-spec */
/* @test-seam HG-GLOBE-002:begin */
suite("HG-GLOBE-002", () => {
  test("marker-hit-emits-stable-id", "UNIT", () => {
    emit = spy()
    engine = fakeEngineRaycast(markerRenderObject("event:42"))
    installPicking(engine, () => frameContaining("event:42"), emit)
    engine.click(point(10,10))
    expect(emit.lastCall).toEqual({kind:"marker", id:"event:42"})
  })

  test("empty-hit-clears-selection", "UNIT", () => {
    emit = spy()
    engine = fakeEngineRaycast(none)
    installPicking(engine, currentFrame, emit)
    engine.click(point(10,10))
    expect(emit.lastCall).toEqual(null)
  })

  test("removed-marker-cannot-be-returned-from-stale-render-object", "UNIT", () => {
    emit = spy()
    engine = fakeEngineRaycast(markerRenderObject("removed"))
    installPicking(engine, () => frameWithout("removed"), emit)
    engine.click(point(10,10))
    expect(emit.lastCall).toEqual(null)
  })
})
/* @test-seam HG-GLOBE-002:end */

/* @test-spec
{"for":"HG-TIME-001","layers":["UNIT","PROPERTY"],"fixtures":["CE range","pre-CE range"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-TIME-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-TIME-001:begin */
suite("HG-TIME-001", () => {
  test("set-time-clamps-at-both-ends", "UNIT", () => {
    store = newTimelineStore({minTime: time(-100), maxTime: time(100), currentTime: time(0)})
    store.setTime(time(-1000)); expect(store.snapshot().currentTime).toEqual(time(-100))
    store.setTime(time(1000)); expect(store.snapshot().currentTime).toEqual(time(100))
  })

  test("one-effective-change-emits-exactly-once", "UNIT", () => {
    store = timelineFixture()
    listener = spy(); unsubscribe = store.subscribe(listener)
    store.setTime(time(10))
    expect(listener.calls).toEqual(1)
    store.setTime(time(10))
    expect(listener.calls).toEqual(1)
    unsubscribe()
    store.setTime(time(11))
    expect(listener.calls).toEqual(1)
  })

  test("step-crosses-pre-ce-to-ce-in-canonical-order", "UNIT", () => {
    store = preCeBoundaryTimelineFixture()
    observed = []
    repeat 5: observed.push(store.step(oneYear).snapshot().currentTime)
    expect(observed).toBeChronologicallyMonotonicUnderHistoricalTimeContract()
  })

  property("clamp-is-idempotent", generatedHistoricalTimes(), 100, t => {
    store = timelineFixture()
    store.setTime(t); once = store.snapshot().currentTime
    store.setTime(once); twice = store.snapshot().currentTime
    expect(twice).toEqual(once)
  })
})
/* @test-seam HG-TIME-001:end */

/* @test-spec
{"for":"HG-TIME-002","layers":["COMPONENT","INTEGRATION"],"fixtures":["timeline store probe","globe mount probe"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-TIME-002-ORACLE"}
@end-test-spec */
/* @test-seam HG-TIME-002:begin */
suite("HG-TIME-002", () => {
  test("drag-maps-track-ends-to-time-range-ends", "COMPONENT", () => {
    store = timelineStore(min=time(-500), max=time(2026))
    scrubber = mountTimelineScrubber(store, width=1000)
    scrubber.dragTo(0); expect(store.snapshot().currentTime).toEqual(time(-500))
    scrubber.dragTo(1000); expect(store.snapshot().currentTime).toEqual(time(2026))
  })

  test("drag-is-monotonic", "COMPONENT", () => {
    store = timelineFixture(); scrubber = mountTimelineScrubber(store, width=1000)
    values = [0,100,250,500,900,1000].map(x => { scrubber.dragTo(x); return store.snapshot().currentTime })
    expect(values).toBeChronologicallyMonotonicUnderHistoricalTimeContract()
  })

  test("arrow-keys-step-time", "COMPONENT", () => {
    store = timelineFixtureAt(time(100))
    scrubber = mountTimelineScrubber(store)
    scrubber.key("ArrowRight"); afterRight = store.snapshot().currentTime
    expect(compareHistoricalTime(afterRight, time(100))).toBeGreaterThan(0)
    scrubber.key("ArrowLeft"); expect(store.snapshot().currentTime).toEqual(time(100))
  })

  test("scrub-updates-frame-without-remounting-globe", "INTEGRATION", () => {
    app = mountShellFixtureWithMountCounters()
    globeIdentity = app.globeInstanceIdentity()
    app.timeline.dragToDifferentTime()
    expect(app.sceneProjectionCallCount()).toIncrease()
    expect(app.globeInstanceIdentity()).toEqual(globeIdentity)
  })
})
/* @test-seam HG-TIME-002:end */

/* @test-spec
{"for":"HG-SHELL-001","layers":["STATIC","DSH_INTEGRATION","BROWSER_E2E"],"fixtures":["two DSH fixture sessions"],"requiresRealDSH":true,"requiresBrowser":true,"oracleFamily":"HG-SHELL-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-SHELL-001:begin */
suite("HG-SHELL-001", () => {
  test("stock-chatview-is-not-imported-by-shell", "STATIC", () => expectNoImport("*ChatView*"))

  test("conversation-session-slot-is-owned-by-historical-globe", "DSH_INTEGRATION", () => {
    profile = bootHistoricalGlobeFixture()
    expect(profile.slot("conversation.session").activeRegistrant()).toBeHistoricalGlobeSurface()
  })

  test("session-switch-keeps-custom-surface-and-changes-session-id", "BROWSER_E2E", () => {
    browser = openHistoricalGlobeWithSessions(["s1","s2"])
    expect(browser.sessionBody()).toIdentify("Historical Globe")
    browser.switchSession("s2")
    expect(browser.sessionBody()).toIdentify("Historical Globe")
    expect(browser.customSurfaceSessionId()).toEqual("s2")
    expect(browser.stockChatViewPresent()).toBeFalse()
  })

  test("branding-exists-before-globe-engine-ready", "BROWSER_E2E", () => {
    browser = openWithGlobeEngineArtificiallyDelayed()
    expect(browser.sessionBody()).toIdentify("Historical Globe")
  })
})
/* @test-seam HG-SHELL-001:end */

/* @test-spec
{"for":"HG-SHELL-002","layers":["COMPONENT","INTEGRATION"],"fixtures":["shell layout fixture","immutable domain fixture"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-SHELL-002-ORACLE"}
@end-test-spec */
/* @test-seam HG-SHELL-002:begin */
suite("HG-SHELL-002", () => {
  test("globe-is-dominant-and-timeline-bottom-anchored", "COMPONENT", () => {
    app = mountFullBleedHistoricalGlobe()
    expect(app.layout.globe.areaRatio).toBeGreaterThan(0.65)
    expect(app.layout.timeline.anchor).toEqual("BOTTOM")
  })

  test("agent-collapse-does-not-mutate-domain-or-remount-globe", "INTEGRATION", () => {
    domainBefore = snapshotStructural(app.domainSnapshot())
    globeIdentity = app.globeInstanceIdentity()
    app.agentOverlay.open(); app.agentOverlay.collapse(); app.agentOverlay.open()
    expect(snapshotStructural(app.domainSnapshot())).toEqual(domainBefore)
    expect(app.globeInstanceIdentity()).toEqual(globeIdentity)
  })

  test("selection-state-stores-id-not-domain-record-copy", "COMPONENT", () => {
    app = mountFullBleedHistoricalGlobe()
    app.pick({kind:"marker", id:"event:42"})
    expect(app.layoutSelectionState()).toEqual("event:42")
    expect(app.layoutSelectionState()).not.toContainDomainRecordObject()
  })
})
/* @test-seam HG-SHELL-002:end */
