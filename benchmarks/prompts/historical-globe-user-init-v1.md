# Projekt-Kickoff: Historical Globe — DeepSeek Harness Total-Conversion Profile

Ich möchte ein eigenständiges Experiment bauen, das gleichzeitig ein echtes kleines Produkt und eine **Generalprobe für DeepSeek-Harness-Total-Conversion-Modding** ist.

Das Ziel ist ausdrücklich **nicht**, eine normale Web-App zu bauen und DSH später irgendwie anzubinden.

Das Produkt soll **als eigenes DSH-Profil starten** und aus einem sauber definierten Bundle eigener Packages/Plugins bestehen.

Das Projekt dient damit als Übungsfeld für genau die Architektur, die später bei größeren DSH-basierten Projekten wie IvyL relevant wird.

---

## Produktidee

Die Hauptoberfläche ist eine interaktive 3D-Weltkugel.

Auf dem Globus werden zeitabhängig historische Ereignisse, Orte, Personen, Organisationen und deren Beziehungen dargestellt.

Der Nutzer kann:

- den Globus frei drehen und zoomen;
- durch die Geschichte vor- und zurückscrollen;
- Ereignisse auf der Erde erscheinen und verschwinden sehen;
- Orte und Ereignisse anklicken;
- Beziehungen als Linien/Graph-Kanten sehen;
- Informationen filtern;
- Details öffnen;
- optional mit einem Agenten über die aktuell sichtbaren Daten interagieren.

Wikipedia/Wikidata sollen später als hauptsächliche offene Datenbasis untersucht werden.

---

# DSH ist der Host

Das Produkt soll als eigenes DeepSeek-Harness-Profil gestartet werden, beispielsweise:

```text
historical-globe web

```

oder zunächst über einen projektspezifischen DSH-Profile-Entrypoint.

Langfristig soll sich das Profil wie eine eigene Anwendung anfühlen und **nicht wie DSH mit einem zusätzlichen Plugin**.

Der normale DSH-Conversation-Bereich soll deshalb als Teil des Experiments vollständig durch eine eigene Oberfläche ersetzt werden.

Beispiel:

```text
DSH runtime
    │
    └── Historical Globe Profile
          │
          ├── custom shell / conversation surface
          │
          ├── 3D globe
          │
          ├── timeline
          │
          ├── event graph
          │
          ├── compact agent/chat overlay
          │
          └── supporting plugins

```

Der normale Chat darf im Hintergrund weiterhin dieselben Sessions/Agenten verwenden, aber die Stock-Chat-Oberfläche soll nicht die zentrale UI sein.

---

# Haupt-UI

Die `conversation`-Surface soll durch eine komplett eigene Ansicht ersetzt werden:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                  3D GLOBE                    │
│                                              │
│       ● Berlin                               │
│                 ╲                            │
│                  ╲────── ● Moscow            │
│                                              │
│                            ┌──────────────┐   │
│                            │ Agent        │   │
│                            │ compact view │   │
│                            │              │   │
│                            │ [Prompt...]  │   │
│                            └──────────────┘   │
│                                              │
├──────────────────────────────────────────────┤
│ 1800 ───────── 1900 ─────── 2000 ── 2026   │
└──────────────────────────────────────────────┘

```

Der Globus ist der dominante Render.

Chat/Agent-Interaktion soll nur ein Overlay, Floating Panel oder eine kleine Sidebar sein.

Der Agent-Renderer soll möglichst nicht einfach den vorhandenen DSH-`ChatView` einbetten, sondern dieselbe Session über öffentliche Session-/Conversation-Seams lesen und selbst kompakt darstellen.

Damit soll praktisch getestet werden, wie weit man DSH von seiner Standard-Chat-UX entfernen kann.

---

# DSH-Profil und Package-Struktur

Besonders wichtig ist eine saubere Package-/Profile-Architektur.

Ich möchte **nicht**, dass eigene Plugin-Quellen direkt in irgendeinem persönlichen DSH-Installations- oder Plugin-Ordner liegen.

Stattdessen soll das Projekt seine Plugins selbst besitzen:

```text
historical-globe/
│
├── packages/
│   ├── globe-shell/
│   ├── globe-renderer/
│   ├── globe-timeline/
│   ├── globe-data/
│   ├── globe-agent-view/
│   ├── globe-dsh-profile/
│   └── ...
│
├── profiles/
│   └── historical-globe/
│
├── data/
├── docs/
└── ...

```

Die DSH-Profile sollen diese Packages über die vorgesehenen Package-/Bundle-/Cordis-Mechanismen referenzieren.

Konzeptionell ähnlich zu Houdini Packages:

```text
Profile
   ↓
Bundle / Package Manifest
   ↓
Plugins
   ↓
Services / Slots / UI Contributions

```

Ich möchte damit ausdrücklich lernen und testen:

- eigenes DSH-Profil;
- eigenes Bundle;
- mehrere zusammengehörige Plugins;
- externe Plugin-Source außerhalb einer DSH-Installation;
- Package-Referenzen / Workspace-Packages;
- Lockfile / reproduzierbare Installation;
- saubere Plugin-Abhängigkeiten;
- Cordis Services;
- Slot Replacement;
- UI-Komposition;
- Profil-spezifische Defaults;
- mögliche eigene Branding-/Shell-Konfiguration;
- später eventuell eigener CLI-Entrypoint.

Das Profil soll möglichst vollständig aus dem Repository reproduzierbar sein:

```text
clone
→ install
→ start profile

```

Maschinenspezifische Secrets und Runtime-State gehören ausdrücklich nicht ins Repository.

---

# Total-Conversion-Experiment

Dieses Projekt soll bewusst einige ungewöhnliche Dinge ausprobieren, um herauszufinden, wie sehr sich DSH tatsächlich als allgemeiner Application Host verwenden lässt.

Mindestens testen:

1. Standard-Conversation-UI vollständig ersetzen.
2. Eigenen interaktiven WebGL-/3D-Render als Hauptoberfläche betreiben.
3. DSH-Session trotzdem im Hintergrund weiterverwenden.
4. Session-Output inkrementell selbst darstellen.
5. Eigene Prompt-Controls bauen.
6. Agent-/Tool-Aktivität in einer eigenen Darstellung zeigen.
7. Mehrere eigene Plugins unter einem Profil bündeln.
8. Plugins unabhängig von der persönlichen DSH-Installation entwickeln.
9. Profil reproduzierbar auf einer zweiten Maschine booten können.
10. Klar dokumentieren, welche DSH-Seams sauber öffentlich funktionieren und wo Patches nötig wären.

Das Projekt ist ausdrücklich auch eine **Lern- und Falsifikationsplattform für spätere DSH-Total-Conversions**.

Wenn etwas nur durch einen kleinen DSH-Downstream-Patch sinnvoll lösbar ist, soll das nicht künstlich vermieden werden. Stattdessen sauber dokumentieren:

```text
A = sauberer öffentlicher Extension Seam
B = Wrapper/Adapter
C = kleiner Downstream-Patch
D = invasive Kopplung

```

---

# Produkt-Datenmodell

Unabhängig von DSH soll das eigentliche Domänenmodell neutral bleiben.

```text
Event
  id
  title
  summary
  startTime
  endTime?
  importance
  locations[]
  entities[]
  relations[]
  topics[]
  sources[]

```

```text
Entity
  id
  type
  name
  coordinates?
  sources[]

```

```text
Relation
  source
  target
  type
  weight?
  startTime?
  endTime?

```

DSH ist Host, UI- und Agent-Infrastruktur — nicht die kanonische historische Datenstruktur.

---

# Datenquellen

Für den ersten echten Datenimport sollen Wikipedia und Wikidata untersucht werden.

Mögliche Quellen:

- Wikipedia-Jahresartikel;
- Wikidata-Events;
- Wikidata-Koordinaten;
- Personen;
- Organisationen;
- Länder;
- historische Zeitpunkte;
- Beziehungen;
- Wikipedia-Linkgraph.

Langfristige Vorstellung:

```text
Wikipedia / Wikidata
        ↓
Normalization
        ↓
Temporal-Geospatial Knowledge Graph
        ↓
Query / Filtering / LOD
        ↓
3D Globe

```

---

# Visual LOD

Die Darstellung soll abhängig von Zoom, Zeit und Bedeutung verschiedene Detailstufen verwenden.

Beispielsweise:

```text
weit herausgezoomt
→ nur globale Schlüsselereignisse

regional
→ bedeutende regionale Ereignisse

lokal
→ lokale Events, Personen, Detailbeziehungen

```

Auch Graph-Kanten und Labels sollen entsprechend reduziert werden.

Eine spätere interessante Richtung wäre, die Sichtbarkeit nicht nur über harte Kategorien zu steuern, sondern über Importance-/Weight-Funktionen.

---

# Erster vertikaler Slice

Nicht sofort Wikipedia komplett ingestieren.

Der erste Slice soll beweisen, dass **DSH-Total-Conversion + Produktidee gemeinsam funktionieren**.

Er muss enthalten:

1. eigenes DSH-Profil;
2. eigene Packages außerhalb der DSH-Installation;
3. reproduzierbare Profile-/Bundle-Konfiguration;
4. ersetzte `conversation`-Surface;
5. frei rotierbaren 3D-Globus;
6. ungefähr 20–100 Testereignisse;
7. echte Koordinaten;
8. Timeline-Scrubber;
9. zeitabhängiges Ein-/Ausblenden;
10. anklickbare Event-Marker;
11. einige Graph-Kanten;
12. einfaches LOD;
13. kleine eigene Agent-/Session-Ansicht als Overlay;
14. eigener Prompt-Button/Textinput, der dieselbe DSH-Session anspricht.

Dieser Slice ist erst dann erfolgreich, wenn die Oberfläche eindeutig wie **Historical Globe** und nicht wie ein modifizierter Chat aussieht.

---

# Zweiter technischer Test

Nach dem ersten funktionierenden Slice:

- frische zweite Installation / anderes Gerät;
- Repository klonen;
- Dependencies installieren;
- Profil starten;
- keine manuelle Kopie von Plugins in DSH-Verzeichnisse;
- keine versteckte Abhängigkeit von meiner persönlichen `~/.dsh`-Spielwiese.

Das soll die Package-/Profile-Architektur praktisch validieren.

---

# Arbeitsweise

Ich bin Technical Artist und denke stark in Houdini-/Blender-artigen modularen Systemen. Ich möchte nicht zuerst lange Framework-Infrastruktur bauen.

Deshalb:

- schnell visuell testen;
- bestehende DSH-Seams nutzen;
- Plugin-/Package-Grenzen sauber halten;
- keine unnötige Eigenentwicklung;
- Vertical Slices vor abstrakter Vollarchitektur;
- DSH-spezifische und Produkt-spezifische Logik trennen;
- Probleme direkt gegen die laufende Anwendung testen;
- Browser-/DevTools-/Stacktrace-Feedback möglichst automatisiert nutzen.

Bitte keine klassische starre Dashboard-App daraus machen.

---

# Startauftrag

Beginne mit einer kurzen Untersuchung des aktuellen DSH-Plugin-/Profile-/Bundle-Modells und entwirf darauf die konkrete Repository-Struktur.

Danach:

1. lege das minimale Projekt-/Workspace-Setup an;
2. erstelle das eigene Historical-Globe-Profil;
3. lege die ersten getrennten Packages/Plugins an;
4. ersetze als ersten harten Proof die normale `conversation`-Surface;
5. rendere dort einen minimalen interaktiven 3D-Globus;
6. binde anschließend eine echte DSH-Session an;
7. baue eine kleine eigene Agent-/Prompt-UI darüber;
8. dokumentiere alle gefundenen Extension-Seams und nötigen Patches.

Der wichtigste technische Proof lautet:

> **Kann eine DSH-Distribution aus einem eigenen Profil und extern gepflegten Packages so weit total-converted werden, dass DSH nur noch die unsichtbare Harness-/Runtime-Infrastruktur darstellt und die sichtbare Anwendung vollständig Historical Globe ist?**

Arbeite darauf unmittelbar hin.
