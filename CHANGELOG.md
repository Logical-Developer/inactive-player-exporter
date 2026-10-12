# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-12

### Added
- Initial release of **Inactive Player Exporter**
- Migrated from TravcoTools Exporter v0.0 (behavior preserved)
- **Only Natar Villages** filter (detects Natar via `Travian account === "Natars"`)
- **Troop Template** with per-unit tooltips (Gaul troop names)
- **Hero follows** checkbox
- **Preview JSON** modal with copy-to-clipboard
- Auto-update via `@updateURL` / `@downloadURL`
- Persistent settings (localStorage)

### Changed
- Renamed project from `TravcoTools Exporter` to `Inactive Player Exporter`
- List name now includes `(Natar)` suffix when Natar filter is active
- Panel id/classes now use `ipe-` prefix

### Notes
- Target JSON format `farm-list-v1` unchanged and compatible with Nova Farm Manager.
- `backup/` and `private-doc/` directories are git-ignored.
