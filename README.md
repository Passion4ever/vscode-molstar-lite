<p align="center">
  <img src="media/icon.png" width="128" height="128" alt="Molstar Lite">
</p>

<h1 align="center">Molstar Lite</h1>

<p align="center">
  <strong>Lite, powerful, and fast</strong> — a 3D molecular structure viewer for VS Code, powered by <a href="https://molstar.org/">Mol*</a>.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite"><img src="https://img.shields.io/visual-studio-marketplace/v/Passion4ever.molstar-lite?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Version"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite"><img src="https://img.shields.io/visual-studio-marketplace/i/Passion4ever.molstar-lite?style=flat-square" alt="Installs"></a>
  <a href="https://github.com/Passion4ever/vscode-molstar-lite/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"></a>
</p>

---

Browse, compare, and explore molecular structures directly in VS Code. Open a single file for detailed analysis with full [Mol\*](https://molstar.org/) controls, or open an entire folder to browse dozens of structures in a grid view.

## ✨ Features

### 🗂️ Grid View

Open multiple files or a folder to view structures as a grid of interactive cards.

<!-- TODO: Add GIF showing grid view with multiple cards -->
<!-- ![Grid View](media/screenshots/grid-view.gif) -->

- 🖼️ **Thumbnail preview** — Lazy-rendered 3D thumbnails for each structure
- 🖱️ **Click to activate** — Click a card to preview with an interactive 3D overlay; double-click or press `Enter` to open in full viewer
- 🎨 **Toolbar controls** — Change color scheme, representation, rendering style, and grid size across all cards
- 🔍 **Search, sort & filter** — Search by filename, sort by name, filter by format (with file counts)
- ✅ **Selection mode** — Select cards with click, `Ctrl+Click`, or `Shift+Click` for range selection; delete with undo support (`Ctrl+Z`)
- ⌨️ **Keyboard navigation** — Arrow keys to navigate, `Enter` for full viewer, `Escape` to go back

### 🔬 Full Viewer

Double-click any card to open the full Mol\* viewer with complete controls — sequence panel, component management, representation editor, and more. Each card remembers its own viewer state independently.

<!-- TODO: Add GIF showing full viewer with Mol* controls -->
<!-- ![Full Viewer](media/screenshots/full-viewer.gif) -->

### 🌈 Syntax Highlighting

Built-in syntax highlighting for molecular file formats with semantic coloring for residue types, element names, chain IDs, and more.

<!-- TODO: Add screenshot of syntax highlighting -->
<!-- ![Syntax Highlighting](media/screenshots/syntax-highlight.png) -->

### 🚀 More

- 👆 **One-click preview** — Click the molecule icon in the editor title bar to instantly visualize a structure
- 📂 **Open files or folders** — Right-click in Explorer, use the Command Palette, or click the Open button in the viewer
- 🌐 **Works with VS Code Remote** — Full support for SSH, WSL, and container environments

## 📋 Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| PDB | `.pdb` | Protein Data Bank |
| PDBQT | `.pdbqt` | AutoDock |
| PQR | `.pqr` | PDB with charge & radius |
| mmCIF | `.cif` `.mmcif` | Macromolecular CIF |
| GRO | `.gro` | GROMACS |
| MOL | `.mol` | MDL Molfile |
| MOL2 | `.mol2` | Tripos Mol2 |
| SDF | `.sdf` | Structure-Data File |
| XYZ | `.xyz` | XYZ chemical file |

## 🏁 Getting Started

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite)
2. Open a molecular file and click the **molecule icon** in the editor title bar
3. Or right-click a file/folder in the Explorer and select **Molstar Lite: Open**
4. Or press `Cmd+Shift+P` / `Ctrl+Shift+P` and run **Molstar Lite: Open**

## 💻 Commands

| Command | Description |
|---------|-------------|
| `Molstar Lite: Open` | Open selected files/folders in the viewer |
| `Molstar Lite: Open to the Side` | Open in a side panel |

Commands are available via the Command Palette, Explorer right-click menu, editor right-click menu, and the editor title bar icon.

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

## 🙏 Acknowledgments

Powered by [Mol\*](https://github.com/molstar/molstar) — an open-source toolkit for molecular visualization (MIT License).

## 📄 License

[MIT](LICENSE)
