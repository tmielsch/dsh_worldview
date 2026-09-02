// Visible test contracts for profile/bundle/domain/store/LOD.

/* @test-spec
{"for":"HG-BUNDLE-001","layers":["STATIC","DSH_INTEGRATION"],"fixtures":["temporary external checkout","temporary DSH_HOME"],"requiresRealDSH":true,"requiresBrowser":false,"oracleFamily":"HG-BUNDLE-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-BUNDLE-001:begin */
suite("HG-BUNDLE-001", () => {
  test("bundle-manifest-declares-patch", "STATIC", () => {
    manifest = readBundlePackageJson()
    expect(manifest.dsh.bundle.patch).toEqual("./cordis.patch.yml")
  })

  test("bundle-owns-only-client-plugin-rows", "STATIC", () => {
    manifest = readBundlePackageJson()
    patch = readBundlePatch()
    expect(manifest.dependencies).toContain("@dsh-worldview/globe-shell")
    expect(manifest.dependencies).toContain("@dsh-worldview/globe-agent-view")
    expect(patch).toRegisterClientPlugin("historical-globe-shell", "@dsh-worldview/globe-shell")
    expect(patch).toRegisterClientPlugin("historical-globe-agent-view", "@dsh-worldview/globe-agent-view")
  })

  test("external-repository-bundle-resolves", "DSH_INTEGRATION", () => {
    checkout = copyOrCloneRepoToFreshTempPath()
    dshHome = emptyTemporaryDshHome()
    installWorkspaceFrozen(checkout)
    linkBundleIntoFixtureProfile(checkout, dshHome)
    dump = dshDumpConfig(dshHome, fixtureProfile)
    expect(dump).toIdentifyBundleLayer("@dsh-worldview/historical-globe-bundle")
    expectNoPathMatching(originalDeveloperCheckoutPath)
  })
})
/* @test-seam HG-BUNDLE-001:end */

/* @test-spec
{"for":"HG-PROFILE-001","layers":["STATIC","DSH_INTEGRATION"],"fixtures":["temporary DSH_HOME"],"requiresRealDSH":true,"requiresBrowser":false,"oracleFamily":"HG-PROFILE-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-PROFILE-001:begin */
suite("HG-PROFILE-001", () => {
  test("profile-bundle-order-is-explicit", "STATIC", () => {
    manifest = readProfilePackageJson()
    expect(manifest.dsh.profile.bundles).toEqual([
      "@deepseek-ai/dsh-base",
      "@dsh-worldview/historical-globe-bundle"
    ])
  })

  test("product-composition-not-hidden-in-user-patch", "STATIC", () => {
    expect(readProfileCordisPatch()).toEqual([])
  })

  test("profile-dump-config-resolves-all-bundles", "DSH_INTEGRATION", () => {
    env = bootstrapFixtureProfileInEmptyDshHome()
    dump = dshDumpConfig(env.dshHome, "historical-globe")
    expect(dump).toResolveBundle("@deepseek-ai/dsh-base")
    expect(dump).toResolveBundle("@dsh-worldview/historical-globe-bundle")
    expectNoPathMatching(originalDeveloperCheckoutPath)
  })
})
/* @test-seam HG-PROFILE-001:end */

/* @test-spec
{"for":"HG-DOMAIN-001","layers":["STATIC","UNIT","PROPERTY"],"fixtures":["CE and pre-CE domain records","boundary coordinates"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-DOMAIN-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-DOMAIN-001:begin */
suite("HG-DOMAIN-001", () => {
  test("domain-has-no-dsh-dependency", "STATIC", () => {
    expectNoImport("@deepseek-ai/*")
    expectNoImport("*dsh*") // concrete writer scopes this to package imports, not arbitrary prose
  })

  test("open-ended-event-is-representable", "UNIT", () => {
    event = validHistoricalEvent({ startTime: "1914-07-28", endTime: absent })
    expect(typeCheck(event)).toPass()
  })

  test("pre-ce-time-is-representable", "UNIT", () => {
    event = validHistoricalEvent({ startTime: signedHistoricalYear(-44) })
    expect(typeCheck(event)).toPass()
  })

  test("coordinate-boundaries-are-representable", "UNIT", () => {
    expect(typeCheck({ latitude: -90, longitude: -180 })).toPass()
    expect(typeCheck({ latitude: 90, longitude: 180 })).toPass()
  })

  test("ids-remain-stable-strings-across-record-kinds", "UNIT", () => {
    expect(validHistoricalEvent({ id: "event:abc" }).id).toEqual("event:abc")
    expect(validHistoricalEntity({ id: "entity:abc" }).id).toEqual("entity:abc")
    expect(validHistoricalRelation({ id: "relation:abc" }).id).toEqual("relation:abc")
  })
})
/* @test-seam HG-DOMAIN-001:end */

/* @test-spec
{"for":"HG-STORE-001","layers":["UNIT","PROPERTY"],"fixtures":["temporal dataset","topic dataset","relation endpoint dataset"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-STORE-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-STORE-001:begin */
suite("HG-STORE-001", () => {
  test("replace-all-is-idempotent", "UNIT", () => {
    store = newStore()
    dataset = temporalFixture()
    store.replaceAll(dataset)
    first = snapshotStructural(store.snapshot())
    store.replaceAll(deepClone(dataset))
    second = snapshotStructural(store.snapshot())
    expect(second).toEqual(first)
  })

  test("query-includes-inclusive-start-and-end-boundaries", "UNIT", () => {
    store = newStoreWith(eventInterval("e", time(10), time(20)))
    expect(store.query({ at: time(9) }).events.ids()).not.toContain("e")
    expect(store.query({ at: time(10) }).events.ids()).toContain("e")
    expect(store.query({ at: time(20) }).events.ids()).toContain("e")
    expect(store.query({ at: time(21) }).events.ids()).not.toContain("e")
  })

  test("open-ended-event-remains-active", "UNIT", () => {
    store = newStoreWith(eventInterval("e", time(10), absent))
    expect(store.query({ at: time(10_000) }).events.ids()).toContain("e")
  })

  test("topic-and-importance-filters-compose", "UNIT", () => {
    store = newStoreWith(topicImportanceFixture())
    result = store.query({ at: fixtureTime, topicFilter: set("war"), minimumImportance: 0.7 })
    expect(result.events.every(e => e.topics contains "war" AND e.importance >= 0.7)).toBeTrue()
  })

  test("event-order-is-deterministic", "UNIT", () => {
    store = newStoreWith(events([
      { id: "b", importance: 0.5 },
      { id: "a", importance: 0.5 },
      { id: "c", importance: 0.9 }
    ]))
    expect(store.query({ at: fixtureTime }).events.ids()).toEqual(["c", "a", "b"])
  })

  test("relations-with-irrelevant-endpoints-are-not-returned", "UNIT", () => {
    store = newStoreWith(relationEndpointFixture())
    result = store.query({ at: fixtureTime })
    expect(result.relations.every(r => endpointsAreRelevant(r, result))).toBeTrue()
  })

  test("snapshots-are-immutable", "UNIT", () => {
    store = newStoreWith(temporalFixture())
    expectImmutable(store.snapshot())
    expectImmutable(store.query({ at: fixtureTime }))
  })

  property("input-permutation-does-not-change-query-output", permutationOf(temporalFixture()), 20, shuffledDataset => {
    store = newStoreWith(shuffledDataset)
    expect(snapshotStructural(store.query({ at: fixtureTime }))).toEqual(canonicalQueryFixtureResult())
  })
})
/* @test-seam HG-STORE-001:end */

/* @test-spec
{"for":"HG-LOD-001","layers":["UNIT","PROPERTY"],"fixtures":["ranked marker candidates","camera zoom fixtures"],"requiresRealDSH":false,"requiresBrowser":false,"oracleFamily":"HG-LOD-001-ORACLE"}
@end-test-spec */
/* @test-seam HG-LOD-001:begin */
suite("HG-LOD-001", () => {
  test("far-view-favors-high-importance", "UNIT", () => {
    candidates = candidatesAtComparableCameraRelevance([
      { id: "low", importance: 0.1 },
      { id: "high", importance: 0.9 }
    ])
    scored = candidates.map(c => scoreMarker(c, farGlobalCamera()))
    expect(rankOf(scored, "high")).toBeHigherThan(rankOf(scored, "low"))
  })

  test("selection-respects-budget", "UNIT", () => {
    scored = knownScoredCandidates(10)
    expect(selectMarkers(scored, 0)).toHaveLength(0)
    expect(selectMarkers(scored, 3)).toHaveLength(3)
  })

  test("deterministic-id-breaks-exact-score-ties", "UNIT", () => {
    tied = exactScoreTieCandidates(["b", "a"])
    expect(selectMarkers(tied, 2).ids()).toEqual(stableExpectedTieOrder(["a", "b"]))
  })

  property("larger-budget-preserves-higher-ranked-prefix", generatedScoredCandidates(), 50, scored => {
    small = selectMarkers(scored, 5)
    large = selectMarkers(scored, 8)
    expect(large.ids().slice(0, small.length)).toEqual(small.ids())
  })

  property("selection-is-deterministic-under-input-permutation", generatedScoredCandidates(), 50, scored => {
    expected = selectMarkers(scored, 7)
    for permutation in severalPermutations(scored):
      expect(selectMarkers(permutation, 7)).toEqual(expected)
  })
})
/* @test-seam HG-LOD-001:end */
