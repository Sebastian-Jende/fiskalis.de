# Fiskalis

Unabhängiges Verzeichnis für geprüfte Steuerberater, Finanzberater und Buchhalter in Deutschland.
Statisch generiert mit Astro. Inhalte (Anbieter, Bewertungen, Städte, Spezialisierungen, FAQ)
kommen ausschließlich aus einem Google Sheet, das zur Build-Zeit gelesen wird — kein Supabase,
keine sonstige bezahlte Backend-Datenbank. Kontakt zu Anbietern, Bewerbungen, Bewertungen und
Meldungen laufen bewusst **ohne eigenes Formular/Backend** über direkte `mailto:`-Links — siehe
"Entscheidung: keine Formulare" unten. Deploy als reines statisches Cloudflare-Pages-Projekt,
kein Worker nötig.

PRD: siehe veröffentlichtes Artifact (nicht im Repo).

## Setup

1. **Google Sheet freigeben** — siehe [`sheet-template/README.md`](sheet-template/README.md): das
   Sheet existiert bereits in Drive, es fehlt nur noch die Freigabe auf "Jeder mit dem Link kann
   es ansehen".
2. `.env` aus `.env.example` erstellen (die echte `GOOGLE_SHEET_ID` steht schon in `.env`, das
   liegt lokal bereits bereit):
   ```sh
   cp .env.example .env
   ```
3. Dependencies installieren und Dev-Server starten:
   ```sh
   npm install
   npm run dev
   ```
   Falls `npm install` mit einem `EACCES`/`ENOTEMPTY`-Fehler im npm-Cache fehlschlägt (kam beim
   ersten Setup hier vor — Teile von `~/.npm/_cacache` gehören `root` statt deinem Nutzer):
   `npm install --cache /tmp/npm-cache-fiskalis` als Workaround, oder `sudo chown -R $(whoami)
   ~/.npm` um die Ursache dauerhaft zu beheben.

## Entscheidung: keine Formulare (Stand 2026-09-11)

Kontaktformular, Bewerbungsformular und Bewertungsformular wurden bewusst wieder entfernt, um am
Start so schlank wie möglich zu starten:

- **Anbieterprofil:** Telefon/E-Mail/Website stehen direkt in der Kontakt-Box, kein Formular.
- **Für Anbieter (`/fuer-anbieter/`):** ein `mailto:`-Link mit vorausgefülltem Betreff/Body statt
  eines Bewerbungsformulars.
- **Bewertungen:** kein Self-Service-Formular mehr (`/bewertung-schreiben/` wurde entfernt) —
  passt zur Cold-Start-Strategie im PRD, Bewertungen zunächst selbst bei den ersten Mandanten
  einzuholen und direkt im Sheet einzutragen. Anzeige auf den Profilen funktioniert unverändert.
- **Inhalt melden (`/inhalt-melden/`):** weiterhin eine eigene Route (DSA-Pflicht, Art. 11, 12,
  16), aber nur noch Anleitung + `mailto:`-Link statt Formular.

Damit entfällt auch der Cloudflare Worker (`worker/index.ts` + `wrangler.jsonc`) komplett — es
gibt keine serverseitige Route mehr, die reine Astro-Ausgabe kann direkt als statisches
Cloudflare-Pages-Projekt deployed werden. Die Datenschutzerklärung wurde entsprechend angepasst
(kein Abschnitt mehr zu Google-Forms-Formularverarbeitung).

Self-Service-Formulare lassen sich jederzeit als spätere Ausbaustufe nachrüsten (siehe PRD,
Roadmap Phase 4) — dann wieder mit einem schlanken Worker wie bei Uhrenverzeichnis.de.

## Projektstruktur

- `src/pages/[kategorie]/index.astro` — Kategorie-Übersicht (`/steuerberater/`,
  `/finanzberater/`, `/buchhalter/`) mit clientseitigem Filter (Ort, Spezialisierung, Remote).
- `src/pages/[kategorie]/[...slug].astro` — eine Route für drei Seitentypen im selben
  `/{kategorie}/`-Namensraum: Stadt-Seite, Spezialisierungs-Seite, Anbieterprofil. Siehe
  Kommentare dort für die Disambiguierung; `assertSlugNamespaceIsUnique` lässt den Build
  laut fehlschlagen, statt eine Route still zu überschreiben.
- `src/lib/buildData.ts` — liest und normalisiert alle Inhalte aus dem Google Sheet (nur zur
  Build-Zeit). `MIN_PROVIDERS_PER_COMBO = 3`: Eine Kategorie×Stadt- oder
  Kategorie×Spezialisierung-Seite wird erst ab 3 Anbietern generiert — Schutz gegen
  Thin-Content-/Doorway-Page-Abwertung bei programmatischen Seiten (siehe Kommentar im Code).
- `src/lib/sheets.ts` — holt einen Sheet-Tab als CSV (`gviz`-Export, kein API-Key nötig) und
  parst ihn mit `papaparse`.
- `src/components/JsonLd/` — `BreadcrumbSchema`, `CollectionPageSchema` (Kategorie-/Stadt-/
  Spezialisierungs-Seiten), `ProviderSchema` (`AccountingService`/`FinancialService` je nach
  Kategorie, inkl. `AggregateRating`/`Review` ausschließlich aus echten freigegebenen
  Bewertungen). Bewusst **kein** `FAQPage`-Schema — Google hat die Rich-Snippet-Unterstützung
  dafür im Mai 2026 eingestellt, FAQ-Inhalte bleiben aber sichtbarer Text (relevant für
  AI-Overviews/GEO).
- `src/components/BewertungsHinweis.astro` — Pflicht-Hinweis nach § 5b Abs. 3 UWG, direkt am
  Bewertungsmodul eingebaut, nicht nur auf einer separaten Rechtsseite.
- `src/pages/impressum.astro`, `datenschutz.astro`, `nutzungsbedingungen.astro`,
  `anbieter-agb.astro`, `inhalt-melden.astro`, `wie-wir-pruefen.astro` — rechtliche Pflichtseiten
  bzw. E-E-A-T-Methodikseite.
- `sheet-template/` — CSV-Vorlagen (fiktive Demo-Daten) + die daraus gebaute
  `Fiskalis-Sheet-Template.xlsx`, identisch zum bereits angelegten Google Sheet.

## Befehle

| Befehl | Aktion |
| --- | --- |
| `npm run dev` | Lokaler Dev-Server auf `localhost:4321` |
| `npm run build` | Produktions-Build nach `./dist/` |
| `npm run preview` | Build lokal testen |
| `npx astro check` | Type-Checking über alle `.astro`-Dateien |

## Noch offen vor dem Live-Gang

1. **Sheet-Freigabe setzen** (siehe oben) — ohne das schlägt jeder Build fehl.
2. **Demo-Daten im Sheet durch echte Anbieter ersetzen** — siehe
   [`sheet-template/README.md`](sheet-template/README.md).
3. **GitHub-Repo verbinden + Cloudflare Pages-Deployment einrichten** (Build-Command
   `npm run build`, Output-Verzeichnis `dist`) — noch nicht eingerichtet.
4. **Deploy-Hook bei Sheet-Änderung** — Apps-Script `onEdit`-Trigger im Sheet, ruft den
   Cloudflare-Deploy-Hook auf (gleiches Muster wie bei Uhrenverzeichnis.de).
5. **Stripe Payment Link** für die Jahres-Listings einrichten (siehe PRD, §8) — aktuell ist die
   Freischaltung nach Bewerbung ein rein manueller Schritt.
