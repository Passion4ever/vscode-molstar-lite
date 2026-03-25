<p align="center">
  <img src="media/icon.png" width="128" height="128" alt="Molstar Lite">
</p>

<h1 align="center">Molstar Lite</h1>

<p align="center">
  <strong>Lightweight yet powerful</strong> — a molecular structure toolkit for VS Code, powered by <a href="https://molstar.org/">Mol*</a>.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite"><img src="https://img.shields.io/visual-studio-marketplace/v/Passion4ever.molstar-lite?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Version"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite"><img src="https://img.shields.io/visual-studio-marketplace/i/Passion4ever.molstar-lite?style=flat-square" alt="Installs"></a>
  <a href="https://github.com/Passion4ever/vscode-molstar-lite/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"></a>
</p>

---

Browse, compare, and explore molecular structures directly in VS Code. Open a single file for detailed analysis with full [Mol\*](https://molstar.org/) controls, or open an entire folder to browse hundreds of structures in a grid view — folders open instantly, no matter how many files.

## ✨ Features

### 🗂️ Grid View

Open multiple files or a folder to view structures as a grid of interactive cards.

<!-- ![Grid View](media/screenshots/grid-view.gif) -->

- 🖼️ **Thumbnail preview** — Lazy-rendered 3D thumbnails for each structure
- 🖱️ **Click to activate** — Click a card to preview with an interactive 3D overlay; double-click or press `Enter` to open in full viewer
- 🎨 **Toolbar controls** — Change color scheme, representation, rendering style, and grid size across all cards
- 🔍 **Search, sort & filter** — Search by filename, sort by name, filter by format (with file counts)
- ✅ **Selection mode** — Select cards with click, `Ctrl+Click`, or `Shift+Click` for range selection; delete with undo support (`Ctrl+Z`)
- ⌨️ **Keyboard navigation** — Arrow keys to navigate, `Enter` for full viewer, `Escape` to go back

### 🔬 Full Viewer

Double-click any card to open the full Mol\* viewer with complete controls — sequence panel, component management, representation editor, and more. Each card remembers its own viewer state independently.

<!-- ![Full Viewer](media/screenshots/full-viewer.gif) -->

### 🌈 Syntax Highlighting

Built-in semantic syntax highlighting for molecular file formats. Opens automatically when you edit any supported file — no extra extension needed.

<!-- ![Syntax Highlighting](media/screenshots/syntax-highlight.png) -->

- 🧬 **Residue coloring** — Amino acids colored by biochemical property (hydrophobic, polar, positive, negative, special)
- ⚛️ **Element coloring** — Atom symbols colored using CPK convention (C, N, O, S, H, P, metals)
- 🏷️ **Structural records** — ATOM/HETATM, HELIX, SHEET, SSBOND, chain IDs, coordinates, B-factors
- 🧪 **Nucleotide coloring** — DNA (A/T/G/C) and RNA (A/U/G/C) bases with distinct colors in FASTA files
- 🔧 **GROMACS toolkit** — MDP parameters, topology sections, preprocessor directives, index groups, XVG data
- ⚙️ **Fully configurable** — Customize all residue and element colors via `Settings > Molstar Lite`

### 🚀 More

- 👆 **One-click preview** — Click the molecule icon in the editor title bar to instantly visualize a structure
- 📂 **Open files or folders** — Right-click in Explorer, use the Command Palette, or click the Open button in the viewer
- 🔄 **Recursive folder scan** — Right-click a folder and choose "Open Folder Recursively" to find all molecular files in subdirectories, with a confirmation dialog before opening
- 🌐 **Works with VS Code Remote** — Full support for SSH, WSL, and container environments

## 📋 Supported Formats

| Format | Extension | Description | 3D Viewer | Syntax Highlighting |
|--------|-----------|-------------|:---------:|:-------------------:|
| PDB | `.pdb` | Protein Data Bank | ✓ | ✓ |
| PDBQT | `.pdbqt` | AutoDock | ✓ | ✓ |
| PQR | `.pqr` | PDB with charge & radius | ✓ | ✓ |
| mmCIF | `.cif` `.mmcif` | Macromolecular CIF | ✓ | ✓ |
| GRO | `.gro` | GROMACS coordinate | ✓ | ✓ |
| MOL | `.mol` | MDL Molfile | ✓ | ✓ |
| MOL2 | `.mol2` | Tripos Mol2 | ✓ | ✓ |
| SDF | `.sdf` | Structure-Data File | ✓ | ✓ |
| XYZ | `.xyz` | XYZ chemical file | ✓ | ✓ |
| FASTA | `.fasta` `.fa` `.fna` `.faa` `.ffn` `.fas` | Sequence file (protein & nucleotide) | — | ✓ |
| MDP | `.mdp` | GROMACS parameters | — | ✓ |
| TOP | `.top` | GROMACS topology | — | ✓ |
| ITP | `.itp` | GROMACS include topology | — | ✓ |
| NDX | `.ndx` | GROMACS index | — | ✓ |
| XVG | `.xvg` | Grace/GROMACS data | — | ✓ |

## 🏁 Getting Started

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite)
2. Open a molecular file and click the **molecule icon** in the editor title bar
3. Or right-click a file/folder in the Explorer and select **Molstar Lite: Open**
4. Or right-click a folder and select **Molstar Lite: Open Folder Recursively** to scan all subdirectories
5. Or select multiple files in the Explorer, right-click and open them together in grid view
6. Or press `Cmd+Shift+P` / `Ctrl+Shift+P` and run **Molstar Lite: Open**

## 💻 Commands

| Command | Context | Description |
|---------|---------|-------------|
| `Molstar Lite: Open` | Single file | Open one molecular file in full viewer |
| `Molstar Lite: Open` | Multiple files | Select multiple files in Explorer → right-click → open all in grid view |
| `Molstar Lite: Open` | Folder | Open all molecular files in a folder (one level) |
| `Molstar Lite: Open to the Side` | Single file | Open in a side panel (via editor title bar icon or editor right-click menu) |
| `Molstar Lite: Open Folder Recursively` | Folder | Recursively scan all subdirectories and open all molecular files found |

Commands are available via the Command Palette, Explorer right-click menu, editor right-click menu, and the editor title bar icon.

## ⚙️ Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `molstarLite.highlight.enabled` | `true` | Enable/disable syntax highlighting |
| `molstarLite.highlight.residueColors` | *(see below)* | Colors for amino acid groups |
| `molstarLite.highlight.elementColors` | *(see below)* | CPK colors for elements |

**Residue color groups:** hydrophobic, polar, positive, negative, special, water, dna, rna, ligand

**Element color groups:** carbon, nitrogen, oxygen, sulfur, hydrogen, phosphorus, metal, other

## ⌨️ Keyboard Shortcuts (in viewer)

| Key | Action |
|-----|--------|
| `Arrow keys` | Navigate between cards |
| `Enter` | Open active card in full viewer |
| `Escape` | Close full viewer / exit select mode / deactivate card |
| `Ctrl+A` | Select all cards (in select mode) |
| `Ctrl+Z` | Undo last delete |
| `Ctrl+Click` | Toggle card selection |
| `Shift+Click` | Range selection |

## 💬 Feedback

Found a bug? Have a feature request? Feel free to [open an issue](https://github.com/Passion4ever/vscode-molstar-lite/issues) on GitHub.

## 🙏 Acknowledgments

Powered by [Mol\*](https://github.com/molstar/molstar) — an open-source toolkit for molecular visualization (MIT License).

## 📄 License

[MIT](LICENSE)
