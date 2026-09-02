// Visible test contracts for seed data, diagnostics, and reproducible boot.

/* @test-spec
{"for":"HG-DATA-001","layers":["UNIT","PROPERTY"],"fixtures":["valid 20-event seed fixture","invalid-reference fixtures","invalid-coordinate fixtures"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-DATA-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-DATA-001:begin */
suite("HG-DATA-001", () => {
  test("valid-first-slice-seed-loads-immutably", "UNIT", () => {
    dataset = loadSeedDataset(validSeedFixture(eventCount=20))
    expect(dataset.events.length).toBeBetweenInclusive(20, 100)
    expectImmutable(dataset)
  })

  test("every-seed-event-has-valid-coordinate", "UNIT", () => {
    dataset = loadSeedDataset(validSeedFixture(eventCount=20))
    expect(dataset.events.every(e => e.locations.length >= 1)).toBeTrue()
    expect(dataset.events.flatMap(e => e.locations).every(isCoordinateInRange)).toBeTrue()
  })

  test("relations-and-references-resolve", "UNIT", () => {
    dataset = loadSeedDataset(validSeedFixture(eventCount=20))
    expect(dataset.relations.length).toBeGreaterThan(0)
    expect(allRelationEndpointsExist(dataset)).toBeTrue()
    expect(allEventEntityAndRelationReferencesResolve(dataset)).toBeTrue()
  })

  test("all-records-have-provenance", "UNIT", () => {
    dataset = loadSeedDataset(validSeedFixture(eventCount=20))
    expect(allEventsAndEntitiesHaveSources(dataset)).toBeTrue()
  })

  test("duplicate-id-rejects-whole-dataset-with-path", "UNIT", () => {
    expectThrows(() => loadSeedDataset(seedWithDuplicateId()), error => {
      expect(error).toIdentifyOffendingPathAndId()
      expect(error).not.toBePartialSuccess()
    })
  })

  test("invalid-coordinate-rejects-with-path", "UNIT", () => {
    expectThrows(() => loadSeedDataset(seedWithCoordinate({latitude: 91, longitude: 0})), error =>
      expect(error).toIdentifyOffendingCoordinatePath())
  })

  test("reversed-temporal-interval-rejects", "UNIT", () => {
    expectThrows(() => loadSeedDataset(seedWithEvent({startTime: time(20), endTime: time(10)})), TemporalIntervalError)
  })

  test("dangling-relation-endpoint-rejects", "UNIT", () => {
    expectThrows(() => loadSeedDataset(seedWithDanglingRelationEndpoint()), error => expect(error).toIdentifyReferencePath())
  })

  property("valid-record-order-does-not-change-normalized-dataset", permutationsOfValidSeed(), 20, seed => {
    expect(snapshotStructural(loadSeedDataset(seed))).toEqual(canonicalNormalizedSeed())
  })
})
/* @test-seam HG-DATA-001:end */

/* @test-spec
{"for":"HG-DIAG-001","layers":["UNIT","DSH_INTEGRATION"],"fixtures":["fake slot registry variants","real DSH fixture"],"requiresRealDSH":true,"requiresBrowser":false,"oracleFamily":"HG-DIAG-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-DIAG-001:begin */
suite("HG-DIAG-001", () => {
  test("healthy-fixture-reports-required-seams", "UNIT", () => {
    ctx = fakeDshContextWithAllExpectedPublicSeams()
    report = runDshSeamProbe(ctx)
    expect(report.checks).toPass("slot-registry")
    expect(report.checks).toPass("conversation.session")
    expect(report.checks).toPass("session-read")
    expect(report.checks).toPass("prompt-action")
  })

  test("missing-conversation-slot-names-contract", "UNIT", () => {
    ctx = fakeDshContextWithoutConversationSessionSlot()
    report = runDshSeamProbe(ctx)
    failure = report.failureFor("conversation.session")
    expect(failure).toNameExpectedUpstreamContract("conversation.session")
    expect(failure).toContainMigrationHint()
  })

  test("missing-read-or-send-seam-is-distinguished", "UNIT", () => {
    readMissing = runDshSeamProbe(fakeDshContext({sessionRead:false, promptAction:true}))
    sendMissing = runDshSeamProbe(fakeDshContext({sessionRead:true, promptAction:false}))
    expect(readMissing.failureIds()).toContain("session-read")
    expect(sendMissing.failureIds()).toContain("prompt-action")
  })

  test("seam-classification-drift-is-actionable", "UNIT", () => {
    report = runDshSeamProbe(fakeDshContextWhereFormerPatchNowPublic())
    expect(report.classificationHints).toContainPatchRemovalHint()
  })

  test("real-dsh-version-and-slot-semantics-are-reported", "DSH_INTEGRATION", () => {
    dsh = bootMinimalRealDshFixture()
    report = runDshSeamProbe(dsh.context)
    expect(report.dshVersion).toEqual(dsh.actualVersion)
    expect(report.checks).toPass("conversation.session")
  })
})
/* @test-seam HG-DIAG-001:end */

/* @test-spec
{"for":"HG-DIAG-002","layers":["BROWSER_E2E"],"fixtures":["known marker profile fixture","test session"],"requiresRealDSH":true,"requiresBrowser":true,"oracleFamily":"HG-DIAG-002-ORACLE"}
@end-test-spec */
/* @test-seam HG-DIAG-002:begin */
suite("HG-DIAG-002", () => {
  test("self-test-proves-core-vertical-slice", "BROWSER_E2E", async () => {
    report = await HistoricalGlobeSelfTest.run(realBrowserDriver())
    expect(report.step("stock-chat-absent")).toPass()
    expect(report.step("globe-frame-healthy")).toPass()
    expect(report.step("rotate")).toPass()
    expect(report.step("zoom")).toPass()
    expect(report.step("timeline-scrub")).toPass()
    expect(report.step("known-marker-pick")).toPass()
    expect(report.step("same-session-prompt")).toPass()
  })

  test("self-test-captures-runtime-errors-as-structured-failures", "BROWSER_E2E", async () => {
    browser = browserFixtureThatEmits({consoleError:"fixture console error", unhandledRejection:"fixture rejection"})
    report = await HistoricalGlobeSelfTest.run(browser)
    expect(report).toContainStructuredRuntimeFailure("fixture console error")
    expect(report).toContainStructuredRuntimeFailure("fixture rejection")
    expect(report.status).toEqual("FAIL")
  })

  test("step-evidence-identifies-failure-location", "BROWSER_E2E", async () => {
    browser = browserFixtureWithBrokenPickingOnly()
    report = await HistoricalGlobeSelfTest.run(browser)
    expect(report.step("known-marker-pick")).toFailWithEvidence()
    expect(report.step("rotate")).toPass()
  })
})
/* @test-seam HG-DIAG-002:end */

/* @test-spec
{"for":"HG-BOOT-001","layers":["STATIC","DSH_INTEGRATION","BROWSER_E2E"],"fixtures":["fresh checkout path","empty DSH_HOME"],"requiresRealDSH":true,"requiresBrowser":true,"oracleFamily":"HG-BOOT-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-BOOT-001:begin */
suite("HG-BOOT-001", () => {
  test("frozen-workspace-install-succeeds-from-fresh-checkout", "STATIC", () => {
    checkout = freshCheckoutAtRandomTempPath()
    result = installWorkspaceFrozen(checkout)
    expect(result).toPass()
  })

  test("bootstrap-touches-only-dedicated-profile-state", "DSH_INTEGRATION", () => {
    dshHome = seededDshHomeWithUnrelatedProfileSentinels()
    before = filesystemSnapshot(dshHome)
    bootstrapHistoricalGlobeProfile(repoRoot, dshHome)
    after = filesystemSnapshot(dshHome)
    expect(diff(before, after)).toTouchOnlyAllowedHistoricalGlobeProfileState()
    expectUnrelatedProfileSentinelsUnchanged()
  })

  test("dump-config-resolves-repository-owned-bundle", "DSH_INTEGRATION", () => {
    env = freshBootstrapFixture()
    dump = dshDumpConfig(env.dshHome, "historical-globe")
    expect(dump).toResolveBundle("@dsh-worldview/historical-globe-bundle")
  })

  test("bootstrap-does-not-copy-source-into-dsh-package-tree", "STATIC", () => {
    env = freshBootstrapFixture()
    expect(findProjectSourceCopiesUnderDshInstall(env)).toEqual([])
  })

  test("documented-start-command-opens-custom-surface", "BROWSER_E2E", () => {
    env = freshBootstrapFixture()
    process = runDocumentedStartCommand(env)
    browser = connectBrowser(process)
    expect(browser.sessionBody()).toIdentify("Historical Globe")
    expect(browser.stockChatViewPresent()).toBeFalse()
  })
})
/* @test-seam HG-BOOT-001:end */

/* @test-spec
{"for":"HG-BOOT-002","layers":["CLEAN_ENVIRONMENT","BROWSER_E2E"],"fixtures":["container/VM clean environment","explicit-only config"],"requiresRealDSH":true,"requiresBrowser":true,"oracleFamily":"HG-BOOT-002-ORACLE"}
@end-test-spec */
/* @test-seam HG-BOOT-002:begin */
suite("HG-BOOT-002", () => {
  test("clone-install-bootstrap-start-passes-in-clean-environment", "CLEAN_ENVIRONMENT", async () => {
    env = createCleanEnvironmentWithoutDeveloperHomeState()
    env.clone(repositoryUrl, exactRevision)
    env.installFrozen()
    env.provideOnly(documentedRequiredConfig())
    env.bootstrapHistoricalGlobe()
    app = env.startHistoricalGlobe()
    report = await HistoricalGlobeSelfTest.run(app.browser)
    expect(report.status).toEqual("PASS")
  })

  test("no-path-resolves-to-original-machine", "CLEAN_ENVIRONMENT", () => {
    env = runCleanEnvironmentSmoke()
    paths = captureResolvedModuleAndPluginPaths(env)
    expect(paths).not.toContainPrefix(originalDeveloperCheckoutOrHome())
    expect(paths).toContainOnly(env.checkout, env.declaredDshRuntimeHome, packageManagerCacheIfAllowed)
  })

  test("manual-copy-step-is-never-required", "CLEAN_ENVIRONMENT", () => {
    trace = runBootstrapWithFilesystemOperationTracing()
    expect(trace).not.toContainUndeclaredCopyIntoDshPluginOrPackageDirectory()
  })
})
/* @test-seam HG-BOOT-002:end */
