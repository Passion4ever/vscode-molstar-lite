# Change Log

All notable changes to **Molstar Lite** will be documented in this file.

---

## [1.2.1] - 2026-03-26

### 🎨 UI

- **Toolbar redesign** — Cleaner layout with primary Open button, transparent secondary buttons, pill-style S/M/L grid size toggle, SVG search and gear icons
- **Settings panel** — Color, Repr., Style, Sort, Format moved into a floating panel (gear icon), keeping the main toolbar minimal
- **Full viewer navigation** — Added prev/next buttons (and arrow key support) in full viewer to switch between files without returning to the grid
- **Theme compatibility** — Toolbar and buttons now render correctly in both light and dark VS Code themes
- **Card hover effect** — Subtle shadow and lift on hover for interactive feedback
- **Loading animation** — Pulse animation on card placeholders while thumbnails render
- **Empty state** — Added molecule icon to the empty state page
- **Custom scrollbar** — Thin VS Code-style scrollbar for the grid area
- **Tab title** — Renamed from "Molstar Viewer" to "Molstar Lite"

### ⚡ Performance

- **Render timeout 5s → 2s** — Complex structures no longer block the thumbnail queue for up to 5 seconds each; partial renders are captured instead of waiting
- **Batch data eviction** — File data is kept in memory during the entire render cycle and evicted only after all thumbnails complete, eliminating redundant disk reads when changing color/representation settings
- **Prefetch 3 → 6** — More files are prefetched during thumbnail rendering to hide IPC latency
- **Larger IntersectionObserver margin** — Cards within 400px of the viewport (up from 200px) begin rendering earlier for smoother scrolling

### 🐛 Bug Fixes

- Fix pLDDT coloring in grid view using wrong color scheme (`uncertainty` → `plddt-confidence`)
- Fix Shift+Click range selection clearing previously selected cards instead of appending
- Fix settings panel position not following toolbar on window resize
- Fix active card border radius mismatch with viewer overlay
- Fix full viewer prev/next navigation landing on filtered-out (hidden) files

### 🔧 Code Quality

- Extract duplicate snapshot-save logic into shared `saveCurrentSnapshot()` helper
- Extract `isFileVisible()` to deduplicate filter-matching logic in toolbar
- Add LRU eviction for full viewer snapshots (max 10) to cap memory usage
- Replace silent `catch` blocks with `console.warn` for easier debugging

---

## [1.2.0] - 2026-03-25

> Performance & scalability update — lazy loading, recursive folder support, and major speed improvements for large datasets.

### 📂 New Features

- **Recursive folder opening** — Right-click a folder → "Open Folder Recursively" to scan all subdirectories, with a confirmation dialog showing file/directory counts
- **Relative path labels** — Cards display relative paths (e.g. `subdir/protein.pdb`) in recursive mode to distinguish same-name files across subdirectories

### ⚡ Performance

- **Lazy file loading** — File contents are no longer read upfront; data is fetched on demand, making folder opening near-instant even for hundreds of files
- **Thumbnail prefetch** — While rendering one thumbnail, the next 3 files are prefetched in the background to hide I/O latency
- **Faster render cycle** — Reduced fixed delays in camera reset and render wait, saving ~70 seconds across 400 files
- **Batch DOM insertion** — Card creation uses `DocumentFragment` for a single DOM operation instead of one per card
- **Parallel directory scanning** — Sibling subdirectories are scanned concurrently
- **Debounced re-render** — Rapid toolbar changes coalesce into a single re-render
- **Render timeout** — 5-second timeout prevents a single malformed file from stalling the entire queue

### 🔬 Full Viewer

- **Complete Mol\* restored** — The full viewer now includes all Mol\* features: animation controls, measurements, unit cell, model export, volume streaming, and all previously disabled extensions

### 🐛 Bug Fixes

- Fix "No molecular files" empty state flashing briefly before files appear
- Fix promise chain bugs where null data would continue into structure loading
- Remove dead code and unused observer cleanup
- Deduplicate screenshot capture logic

---

## [1.1.1] - 2026-03-17

### Fixed
- Fix syntax highlighting not activating until viewer is opened — restore explicit `onLanguage` activation events

### Changed
- Update extension description

---

## [1.1.0] - 2026-03-17

> A major update that transforms Molstar Lite from a simple viewer into a full-featured molecular workbench.

### 🗂️ Grid View

Browse and manage multiple molecular structures in an interactive card grid.

- **Thumbnail previews** — Lazy-rendered 3D thumbnails, background queue for off-screen cards
- **Interactive overlay** — Click to activate a live 3D preview on any card
- **Toolbar controls** — Color scheme, representation mode, rendering style, and grid size
- **Search, sort & filter** — Real-time search by filename, sort by name/format, filter by file type with counts
- **Selection mode** — `Ctrl+Click` to toggle, `Shift+Click` for range select, batch delete with `Ctrl+Z` undo
- **Keyboard navigation** — Arrow keys, `Enter` to open, `Escape` to go back

### 🔬 Full Mol* Viewer

- **Complete Mol\* controls** — Double-click any card to open sequence panel, component management, and representation editor
- **State preservation** — Each card remembers its own viewer state independently

### 🌈 Syntax Highlighting

Built-in semantic coloring for all 15 supported file formats — no extra extension needed.

| Category | Details |
|----------|---------|
| Residues | Colored by biochemical property — hydrophobic, polar, positive, negative, special, water |
| Elements | CPK convention — C, N, O, S, H, P, metals |
| Structure | HELIX, SHEET, SSBOND, chain IDs, coordinates, occupancy, B-factors |
| Nucleotides | DNA (A/T/G/C) and RNA (A/U/G/C) with distinct colors |
| GROMACS | MDP keywords, topology sections, preprocessor directives, index groups, XVG directives |
| Config | Fully customizable via `Settings > Molstar Lite` |

### 🧬 New Formats

- **FASTA** (`.fasta` `.fa` `.fna` `.faa` `.ffn` `.fas`) — Auto-detection of protein vs. nucleotide sequences
- **MDP** (`.mdp`) — GROMACS parameter files with keyword and value highlighting
- **TOP / ITP** (`.top` `.itp`) — GROMACS topology with section headers, preprocessor directives, residue names
- **NDX** (`.ndx`) — GROMACS index files with group headers
- **XVG** (`.xvg`) — Grace/GROMACS data files with directives and comments

### 🚀 More

- **Open files or folders** — Right-click in Explorer, editor context menu, or Command Palette
- **Editor title bar icon** — One-click preview for molecular files
- **CI auto-publish** — Tag-based GitHub Actions workflow for marketplace releases

### 🔧 Under the Hood

- Completely rewritten webview architecture — modularized into `cards`, `toolbar`, `viewer`, `thumbnails`, `state`, `molstar-utils` modules
- Pluggable parser system for syntax highlighting — easy to add new formats
- Debounced highlighting updates (30ms scroll / 300ms edit) for smooth performance
- New extension icon

---

## [1.0.0] - 2026-03-11

🎉 Initial release — A lightweight Mol* 3D molecular structure viewer for VS Code.
