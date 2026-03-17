import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult, StructKey } from '../colors';
import { AA1_MAP } from '../classify';

const NT_MAP: Record<string, StructKey> = {
  'A': 'ntA', 'a': 'ntA',
  'T': 'ntT', 't': 'ntT',
  'G': 'ntG', 'g': 'ntG',
  'C': 'ntC', 'c': 'ntC',
  'U': 'ntU', 'u': 'ntU',
};

export function parseFasta(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  // Quick detect: nucleotide or protein?
  let isNucleotide = true;
  for (let i = 0; i < Math.min(doc.lineCount, 20); i++) {
    const t = doc.lineAt(i).text.trim();
    if (t.startsWith('>') || t === '' || t.startsWith(';')) continue;
    if (/[^ATGCUNatgcun\-\.\s]/.test(t)) { isNucleotide = false; break; }
  }

  for (let i = vStart; i <= vEnd && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;

    if (line.startsWith('>')) {
      res.sectionHeader.push(new vscode.Range(i, 0, i, line.trimEnd().length));
      continue;
    }
    if (line.startsWith(';')) {
      res.comment.push(new vscode.Range(i, 0, i, line.trimEnd().length));
      continue;
    }

    const trimmed = line.trimEnd();
    if (!trimmed) continue;

    if (isNucleotide) {
      for (let j = 0; j < trimmed.length; j++) {
        const key = NT_MAP[trimmed[j]];
        if (key) res[key].push(new vscode.Range(i, j, i, j + 1));
      }
    } else {
      for (let j = 0; j < trimmed.length; j++) {
        const group = AA1_MAP[trimmed[j].toUpperCase()];
        if (group) res.rr[group].push(new vscode.Range(i, j, i, j + 1));
      }
    }
  }

  return res;
}
