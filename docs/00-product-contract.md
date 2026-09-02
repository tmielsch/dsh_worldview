# Product contract — Historical Globe

## Mission

Build a real small product and a falsification platform for **DeepSeek Harness total-conversion modding**. DSH is the host/runtime; the visible application is Historical Globe.

The decisive proof is:

> Can a DSH distribution composed from its own profile and externally maintained packages be total-converted far enough that DSH becomes invisible harness/runtime infrastructure while the visible application is entirely Historical Globe?

## UI contract

- Dominant surface: freely rotatable/zoomable 3D globe.
- Time is scrubbed across a global timeline.
- Historical events/entities appear and disappear according to time.
- Markers are selectable; relationships can render as graph edges.
- LOD responds to zoom, time and importance.
- Agent/chat is a compact overlay/sidebar, never the dominant stock chat UI.
- The stock conversation surface must be replaced, not cosmetically skinned.

## DSH contract

- Dedicated DSH profile.
- Repository owns its packages/plugins; no project source copied into a personal DSH installation/plugin directory.
- Profile composes repository-owned bundle/package(s) through supported DSH mechanisms.
- Reuse DSH session/agent/tool/persistence/policy infrastructure beneath the custom UI.
- The custom agent view reads the same Session through public seams where possible and sends prompts through a public conversation/input seam.
- Machine-specific secrets and runtime state never enter the repository.

## Domain contract

DSH is not canonical historical state.

```text
Event { id, title, summary, startTime, endTime?, importance, locations[], entities[], relations[], topics[], sources[] }
Entity { id, type, name, coordinates?, sources[] }
Relation { source, target, type, weight?, startTime?, endTime? }
```

Future source direction: Wikipedia/Wikidata -> normalization -> temporal/geospatial knowledge graph -> query/filter/LOD -> globe.

## First vertical slice

Success requires all of:

1. own DSH profile;
2. own packages outside DSH installation;
3. reproducible bundle/profile configuration;
4. replacement of normal `conversation` session surface;
5. interactive 3D globe;
6. 20–100 seed events with real coordinates;
7. timeline scrubber;
8. temporal visibility;
9. clickable markers;
10. several relation edges;
11. simple LOD;
12. custom compact Agent/Session overlay;
13. custom prompt control talking to the same DSH Session.

## Second-machine proof

Fresh machine/device: clone -> install -> start profile. No manual plugin copying and no hidden dependency on a personal `~/.dsh` playground.

## Working principle

Vertical slices before framework-building. Keep DSH-specific and product-specific logic separated. Test against the running application early. Automate Browser/DevTools/stacktrace feedback where possible.
