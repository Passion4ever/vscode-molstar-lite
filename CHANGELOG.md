# Change Log

All notable changes to **Molstar Lite** will be documented in this file.

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
