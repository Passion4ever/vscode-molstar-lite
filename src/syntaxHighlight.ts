import * as vscode from 'vscode';
import { STRUCT_KEYS, createDecorations, disposeDecorations } from './highlight/colors';
import type { DecorationStore } from './highlight/colors';
import { getVisibleLines } from './highlight/helpers';
import type { Parser } from './highlight/helpers';

// ── Parsers ────────────────────────────────────────────────────────

import { parsePdb, parsePdbqt, parsePqr } from './highlight/parsers/pdb';
import { parseCif } from './highlight/parsers/cif';
import { parseSdf } from './highlight/parsers/sdf';
import { parseMol2 } from './highlight/parsers/mol2';
import { parseXyz } from './highlight/parsers/xyz';
import { parseGro } from './highlight/parsers/gro';
import { parseFasta } from './highlight/parsers/fasta';
import { parseMdp } from './highlight/parsers/mdp';
import { parseTop } from './highlight/parsers/top';
import { parseNdx } from './highlight/parsers/ndx';
import { parseXvg } from './highlight/parsers/xvg';

const PARSERS: Record<string, Parser> = {
  pdb:   parsePdb,
  pdbqt: parsePdbqt,
  pqr:   parsePqr,
  cif:   parseCif,
  sdf:   parseSdf,
  mol:   parseSdf,
  mol2:  parseMol2,
  xyz:   parseXyz,
  gro:   parseGro,
  fasta: parseFasta,
  mdp:   parseMdp,
  top:   parseTop,
  itp:   parseTop,
  ndx:   parseNdx,
  xvg:   parseXvg,
};

// ── Main entry point ───────────────────────────────────────────────

export function registerSyntaxHighlight(context: vscode.ExtensionContext) {
  let deco = createDecorations();

  function isEnabled(): boolean {
    return vscode.workspace.getConfiguration('molstarLite.highlight').get('enabled', true);
  }

  function update(editor: vscode.TextEditor | undefined) {
    if (!editor) return;
    const parser = PARSERS[editor.document.languageId];
    if (!parser) return;

    if (!isEnabled()) {
      for (const t of Object.values(deco.residue)) editor.setDecorations(t, []);
      for (const t of Object.values(deco.element)) editor.setDecorations(t, []);
      for (const k of STRUCT_KEYS) editor.setDecorations(deco[k], []);
      return;
    }

    const [vStart, vEnd] = getVisibleLines(editor);
    const res = parser(editor.document, vStart, vEnd);

    for (const [k, ranges] of Object.entries(res.rr)) {
      editor.setDecorations(deco.residue[k], ranges);
    }
    for (const [k, ranges] of Object.entries(res.er)) {
      editor.setDecorations(deco.element[k], ranges);
    }
    for (const k of STRUCT_KEYS) editor.setDecorations(deco[k], res[k]);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  function debouncedUpdate(editor: vscode.TextEditor | undefined, delay = 300) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => update(editor), delay);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(update),
    vscode.window.onDidChangeTextEditorVisibleRanges(e => {
      if (PARSERS[e.textEditor.document.languageId]) {
        debouncedUpdate(e.textEditor, 30);
      }
    }),
    vscode.workspace.onDidChangeTextDocument(e => {
      const editor = vscode.window.activeTextEditor;
      if (editor && e.document === editor.document && PARSERS[editor.document.languageId]) {
        debouncedUpdate(editor);
      }
    }),
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('molstarLite.highlight')) {
        disposeDecorations(deco);
        deco = createDecorations();
        update(vscode.window.activeTextEditor);
      }
    }),
  );

  update(vscode.window.activeTextEditor);
  context.subscriptions.push({ dispose: () => disposeDecorations(deco) });
}
