# Knowledge Transfer — Inactive Player Exporter

This document explains the architecture, key code locations, DOM selectors, and
extension notes for the **Inactive Player Exporter** userscript. It is meant as
an onboarding reference for future development.

## 1. Purpose

The script runs on `https://travcotools.com/en/inactive-search/*`. It reads the
table of inactive villages rendered by TravcoTools, walks through every result
page automatically, and produces a JSON document in the `farm-list-v1` format
that is compatible with **Nova Farm Manager**.

## 2. Architecture (v0.0 → v1.0.0)

The original v0.0 was a single monolithic userscript. v1.0.0 splits it into 11
numbered source files that are concatenated by `build.js` (no bundler, no
modules). Everything still runs inside a single IIFE opened in `src/00-header.js`
and closed in `src/10-bootstrap.js`, so all top-level `const`/`function`
declarations share one scope.

Load order and responsibility:

| File | Responsibility |
|---|---|
| `00-header.js` | Userscript metadata block + IIFE opening |
| `01-config.js` | Constants (`VERSION`, storage keys, `TROOP_KEYS`, `NATAR_MARKER`) |
| `02-utils.js` | Helpers: `log`, `esc`, `clamp`, `$`, `$$`, debug flag |
| `03-storage.js` | `sessionStorage` state + `localStorage` settings + legacy purge |
| `04-extractor.js` | `extractCurrentPage()` — reads one result page into row objects |
| `05-pagination.js` | `getPaginationInfo()`, `getNextPageUrl()` |
| `06-json-builder.js` | `buildNovaJSON()` — builds the `farm-list-v1` document |
| `07-ui-panel.js` | `createPanel()` + panel event bindings |
| `08-ui-modal.js` | JSON preview modal (`onPreview`, `showJSONModal`) |
| `09-ui-styles.js` | All CSS via a single `GM_addStyle` call (`ipe-` prefix) |
| `10-bootstrap.js` | Action handlers, status/progress helpers, `init()` |

## 3. Key code locations

- **Extractor**: `src/04-extractor.js` — `extractCurrentPage()`. Iterates over
  `tbody tr[data-travian-account-id]` and builds a farm object per row.
- **Pagination**: `src/05-pagination.js` — `getPaginationInfo()` reads
  `#list-object-count`, `#id_page_size` and the "last page" link; `getNextPageUrl()`
  computes the next URL and preserves `include_natars=on` when the Natar filter is on.
- **JSON builder**: `src/06-json-builder.js` — `buildNovaJSON()` reads the troop
  template inputs from the panel and maps `state.farms` to `targets`.
- **Auto-collect loop**: `src/10-bootstrap.js` — `onAutoCollect()` resets state and
  navigates to page 1; `restoreCollectingState()` runs on every subsequent page,
  appends new rows, updates progress, and navigates forward until the last page.
- **Panel**: `src/07-ui-panel.js` — `createPanel()` renders the UI and wires all
  buttons; `refreshAutoCollectLabel()` keeps the Auto-Collect label in sync.

## 4. DOM selectors (verified against `private-doc/document/Inactive search - Dom.txt`)

| Selector | Purpose |
|---|---|
| `tbody tr[data-travian-account-id]` | Village result row |
| `row.querySelectorAll('td')[1]` | Distance column |
| `.detail-button[data-url*="/player/"]` | Player link (text = player name) |
| `.detail-button[data-url*="/alliance/"]` | Alliance link |
| `td img[alt]` | Tribe |
| `span[title="Population"]` | Population (index 0 = player, 1 = village) |
| `span[title="Villages"]` | Village count |
| `.js-travian_village_url` | Travian village link |
| `.js-travian_village_url span.text-muted.small` | `[x|y]` coordinates |
| `.fa-university` | Capital marker |
| `#list-object-count` | Total result count |
| `#id_page_size` | Results per page |
| `a[title="last page"]` | Last-page link |
| `input[name="include_natars"]` | TravcoTools Natar checkbox |

Notes:

- `villageId = row.id.replace('village-row-', '')`
- `travianAccountId = row.getAttribute('data-travian-account-id')`
- The `include_natars` checkbox uses the "on" value in `switched_on_values`.

## 5. Only Natar Villages detection

Natars appear in the **Travian account** column with the text `Natars`. Detection
uses the player link text:

```js
const playerLink = row.querySelector('.detail-button[data-url*="/player/"]');
const playerName = playerLink ? playerLink.textContent.trim() : 'Unknown';
const isNatar = playerName === 'Natars'; // NATAR_MARKER
```

When the checkbox is enabled:

- `onAutoCollect()` adds `include_natars=on` to the search URL.
- `getNextPageUrl()` keeps the parameter during pagination.
- `extractCurrentPage()` drops every row whose `playerName !== 'Natars'`.
- `state.onlyNatar = true` is stored in session state, and the setting is
  persisted in `localStorage['ipe_only_natar']`.
- The Auto-Collect label becomes `🔄 Collecting Natars...` while collecting.

## 6. Output format — `farm-list-v1`

The output matches `backup/farm-list-1-10_fields-2026-10-11.json`:

```json
{
  "_format": "farm-list-v1",
  "_exported": 1791726033225,
  "list": {
    "name": "1-10 fields",
    "troops": { "t1": 0, "...": 0, "t11": 0 },
    "heroFollow": false,
    "targets": [
      { "name": "Village", "x": -78, "y": -78, "distance": 4,
        "troops": { "t1": 0, "...": 0, "t11": 0 }, "heroFollow": false }
    ]
  }
}
```

Rules:

- Every target carries its own `troops`.
- When `heroFollow === false`, each target also gets `heroFollow: false`.
- Village names have no trailing ellipsis (`…`).
- `distance` is rounded to the nearest integer.
- Targets with a `null` `x` or `y` are removed.

## 7. Storage

**sessionStorage** (`ipe_state_v1`) — transient collection state:
`{ farms, collectedPages, collecting, startPage, currentPage, lastPage,
distanceMin, distanceMax, templateTroops, heroFollow, onlyNatar, needsDetection }`.

**localStorage** — persistent settings:

- `ipe_ui_v1` → `{ minimized }`
- `ipe_only_natar` → boolean
- `ipe_troop_template` → `{ t1..t11 }`
- `ipe_hero_follow` → boolean

The legacy v0.0 keys (`travco_exporter_state_v0`, `travco_exporter_ui_v0`) are
purged once on load; there is no automatic migration.

## 8. Future development notes

- **i18n**: UI strings are currently English-only. Centralize them (e.g. a `T()`
  helper with a string table) before adding languages.
- **Light/dark theme**: all colors live in `src/09-ui-styles.js`; variable-ize
  them (CSS custom properties) to add a light theme.
- **Draggable panel**: add a drag handle on `#ipe-panel-header` and persist the
  position in `localStorage` (extend `ipe_ui_v1` with `{ top, right }`).
- **Village counter when minimized**: show `state.farms.length` in the header.
- **Keyboard shortcut**: e.g. `Shift+E` to extract the current page.
- **Toast notifications**: replace the inline status line for transient events.

## 9. Build & verification

```bash
node build.js
node --check dist/InactivePlayerExporter.user.js
```

Never edit `dist/` by hand — always edit `src/` and rebuild.
