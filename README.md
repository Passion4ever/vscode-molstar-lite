<p align="center">
  <img src="media/icon.png" width="128" height="128" alt="Molstar Lite">
</p>

<h1 align="center">Molstar Lite</h1>

<p align="center">
  A lightweight <a href="https://molstar.org/">Mol*</a> 3D molecular structure viewer for VS Code.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite"><img src="https://img.shields.io/visual-studio-marketplace/v/Passion4ever.molstar-lite?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Version"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite"><img src="https://img.shields.io/visual-studio-marketplace/i/Passion4ever.molstar-lite?style=flat-square" alt="Installs"></a>
  <a href="https://github.com/Passion4ever/vscode-molstar-lite/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"></a>
</p>

---

Preview molecular structures directly in VS Code with a single click — just like Markdown preview, but for molecules.

## Features

- **One-Click Preview** — Click the molecule icon in the editor title bar to instantly visualize structures
- **Side-by-Side View** — Preview opens beside your editor, keeping your code in view
- **Multi-Molecule Overlay** — Add multiple structures to the same viewer for comparison
- **Multiple Tabs** — Open several viewer panels simultaneously
- **Streamlined UI** — Curated Mol\* interface with only essential panels and controls
- **Keyboard Shortcut** — `Cmd+Shift+M` / `Ctrl+Shift+M` for quick preview

## Supported Formats

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

## Getting Started

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Passion4ever.molstar-lite)
2. Open any supported molecular file (e.g. `.pdb`, `.cif`, `.mol2`)
3. Click the **molecule icon** in the editor title bar — or press `Cmd+Shift+M`

### Overlay Multiple Structures

1. Open a structure in the viewer
2. Right-click another file in the Explorer
3. Select **Add to Mol Viewer**

## Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Mol Viewer: Open Mol Viewer` | Open preview in current column | — |
| `Mol Viewer: Open Mol Viewer to the Side` | Open preview to the side | `Cmd+Shift+M` |
| `Mol Viewer: Add to Mol Viewer` | Overlay molecule on existing viewer | — |

All commands are available via the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`), right-click context menus in Explorer and Editor, and the editor title bar icon.

## Acknowledgments

Powered by [Mol\*](https://github.com/molstar/molstar) — an open-source toolkit for molecular visualization (MIT License).

## License

[MIT](LICENSE)
