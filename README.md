# Inactive Player Exporter

> Userscript for **Travian Legends** that extracts inactive villages from
> [TravcoTools](https://travcotools.com/en/inactive-search/) and exports them
> as JSON compatible with **Nova Farm Manager** (`farm-list-v1`).

[![Install in Tampermonkey](https://img.shields.io/badge/Install-Tampermonkey-00A94F?logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/Logical-Developer/inactive-player-exporter/main/InactivePlayerExporter.user.js)

> Click the badge above to install/update the script in Tampermonkey.

---

## ✨ Features

- **Extract current page** — pull all rows from the current TravcoTools search page
- **Auto Collect All Pages** — automatically navigate through all pagination pages
- **Distance filter** — set `from` / `to` distance range for the search
- **Only Natar Villages** — export only Natar (grey) villages
- **Troop Template** — pre-fill troops for Nova Farm Manager attacks
- **Hero follows** — include hero in the attack plan
- **Preview JSON** — inspect the output before downloading
- **Copy to clipboard** — copy JSON directly from the preview modal
- **Persistent settings** — distance, troops, and filters are remembered
- **Auto-update** — Tampermonkey will notify you on new versions

---

## 📥 Installation

1. Install **Tampermonkey** (or **Violentmonkey**):
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
2. Click the install badge above.
3. Confirm installation in the Tampermonkey popup.

---

## 🚀 Usage

1. Open **https://travcotools.com/en/inactive-search/**
2. Set your search filters (distance, days, server, etc.) and click **Search**.
3. The **Inactive Player Exporter** panel appears at the top-right.
4. (Optional) Enable **Only Natar Villages** if you only want Natar targets.
5. (Optional) Fill in **Troop Template** with the troops you want to send.
   Hover over each box to see the unit name.
6. Click **Auto Collect All Pages** — the script will visit every page and
   collect all matching villages.
7. Click **Download JSON** or **Preview JSON → Copy** to get the output.
8. Import the JSON into **Nova Farm Manager**.

---

## 📄 Output Format

```json
{
  "_format": "farm-list-v1",
  "_exported": 1791726033225,
  "list": {
    "name": "1-30 fields",
    "troops": { "t1": 0, "t2": 0, "t3": 0, "t4": 3, "...": 0 },
    "heroFollow": false,
    "targets": [
      {
        "name": "Aldeia do G",
        "x": -78,
        "y": -78,
        "distance": 4,
        "troops": { "t1": 0, "t2": 0, "t3": 0, "t4": 3, "...": 0 },
        "heroFollow": false
      }
    ]
  }
}
```

When **Only Natar Villages** is enabled, `list.name` becomes
`"1-30 fields (Natar)"`.

---

## 🏗️ Development

The repository keeps the userscript sources split under `src/` and **concatenates
them** into a single-file output with a tiny Node build step (no bundler, no
dependencies).

```bash
node build.js
```

The build writes the same output to two locations:

- `InactivePlayerExporter.user.js` (repo root — the install entry point)
- `dist/InactivePlayerExporter.user.js` (canonical build output)

Syntax check:

```bash
node --check InactivePlayerExporter.user.js
```

**Debug mode** — open the page with `?ipe_debug=1` to enable verbose logs
in the browser console (prefix `[IPE]`).

---

## 🗂️ Repository Layout

```text
inactive-player-exporter/
├── InactivePlayerExporter.user.js       ← built userscript (install from here)
├── src/                                 ← modular sources concatenated by build.js
│   ├── 00-header.js
│   ├── 01-config.js
│   ├── 02-utils.js
│   ├── 03-storage.js
│   ├── 04-extractor.js
│   ├── 05-pagination.js
│   ├── 06-json-builder.js
│   ├── 07-ui-panel.js
│   ├── 08-ui-modal.js
│   ├── 09-ui-styles.js
│   └── 10-bootstrap.js
├── dist/InactivePlayerExporter.user.js  ← build output (identical copy)
├── build.js
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

`backup/` and `private-doc/` are excluded from git (see `.gitignore`).

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 🔗 Links

- Repository: https://github.com/Logical-Developer/inactive-player-exporter
- Issues: https://github.com/Logical-Developer/inactive-player-exporter/issues
- TravcoTools: https://travcotools.com/

