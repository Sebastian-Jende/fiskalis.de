# Google Sheet Template

Demo content for local development, matching the tabs `src/lib/buildData.ts` expects: `Anbieter`,
`Bewertungen`, `Staedte`, `Spezialisierungen`, `FAQ`.

## Das Sheet existiert bereits

„Fiskalis Einträge" in deinem Drive enthält bereits alle fünf Tabs mit den Demo-Daten aus diesem
Ordner (`Fiskalis-Sheet-Template.xlsx`):

<https://docs.google.com/spreadsheets/d/1Bw5-Yt7TH-AWEXH4Ixw-wLi1Gltbl9mQTXoB9tSjrTY/edit>

`GOOGLE_SHEET_ID` in `.env` ist bereits darauf gesetzt. **Ein Schritt fehlt noch, den ich nicht
automatisch setzen konnte** (musste am 2026-09-11 neu gesetzt werden, weil die FAQ-Inhalte
korrigiert werden mussten und ich nur ganze Dateien ersetzen, keine einzelnen Zellen bearbeiten
kann — bei künftigen inhaltlichen Korrekturen bitte direkt im Sheet editieren, nicht über mich):

1. Sheet öffnen (Link oben) → **Freigeben** (oben rechts) → **Allgemeiner Zugriff** →
   **Jeder, der über den Link verfügt** → Rolle **Betrachter**.
2. Danach läuft `npm run build`/`npm run dev` ohne weitere Einrichtung.

Ohne diesen Schritt schlägt jeder Build mit `401` beim Sheet-Fetch fehl — `src/lib/sheets.ts`
liest die Tabs anonym per `gviz`-CSV-Export, das braucht öffentlichen Lesezugriff, aber keinen
API-Key.

## Falls du das Sheet neu aufsetzen willst

1. Neues Google Sheet anlegen (oder `Fiskalis-Sheet-Template.xlsx` direkt in Google Drive öffnen
   — Drive konvertiert es automatisch in ein natives Sheet mit allen fünf Tabs).
2. Freigabe wie oben auf "Jeder mit dem Link" (Betrachter) stellen.
3. Sheet-ID aus der URL (`https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`) in
   `GOOGLE_SHEET_ID` in `.env` eintragen.

## Spaltenreferenz

Die Kopfzeile jeder CSV hier ist exakt die Spaltenliste, die `buildData.ts` liest.

- `slug`-Spalten dürfen leer bleiben — ein Slug wird bei Bedarf automatisch aus dem Namen erzeugt.
- `kategorien` (Anbieter), `leistungen`, `branchen`, `spezialisierungen` sind kommagetrennte Werte
  in einer Zelle.
- `status` bei Anbieter: `pending`/`approved`/`rejected`/`archived` — nur `approved` und `pending`
  werden gebaut (siehe `getListedProviders`); rein operativ/intern, Fiskalis zeigt kein
  "Geprüft"-Abzeichen — wir listen, wir verifizieren nicht.
- `status` bei FAQ: `draft`/`published` — nur `published` wird angezeigt.
- `freigegeben` bei Bewertungen: `true`/`wahr`/`ja`/`1`/`x` gilt als freigegeben — alles andere
  (auch leer) wird nicht angezeigt.
- Eine Kategorie×Stadt- oder Kategorie×Spezialisierung-Seite wird erst ab **3 Anbietern** in
  dieser Kombination generiert (`MIN_PROVIDERS_PER_COMBO` in `buildData.ts`) — das ist Absicht,
  siehe Kommentar dort (Schutz vor Thin-Content-/Doorway-Page-Abstrafung bei zu wenigen Einträgen).

## Demo-Daten sind fiktiv

Die 14 Anbieter, alle Bewertungen und Kontaktdaten in diesen CSVs sind **bewusst erfunden** —
reine Platzhalter, um jede Funktion lokal durchzutesten. Keine echten Kanzleien, keine echten
Personen. Vor dem Live-Gang: alle Demo-Zeilen aus dem Sheet löschen und durch echte Anbieter
ersetzen.
