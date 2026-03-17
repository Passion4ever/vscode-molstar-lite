import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';
import { addTrimmedRange, addElement } from '../helpers';

export function parseSdf(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  interface MolBlock { atomStart: number; atomEnd: number; }
  const molecules: MolBlock[] = [];
  let i = 0;

  while (i < doc.lineCount) {
    if (i + 3 >= doc.lineCount) break;
    const countsLine = doc.lineAt(i + 3).text;
    const numAtoms = parseInt(countsLine.substring(0, 3).trim(), 10);
    if (isNaN(numAtoms) || numAtoms <= 0) {
      while (i < doc.lineCount && !doc.lineAt(i).text.trim().startsWith('$$$$')) i++;
      i++;
      continue;
    }
    const molStart = i;
    molecules.push({ atomStart: i + 4, atomEnd: i + 4 + numAtoms - 1 });

    if (molStart >= vStart && molStart <= vEnd) {
      const name = doc.lineAt(molStart).text.trimEnd();
      if (name) res.sectionHeader.push(new vscode.Range(molStart, 0, molStart, name.length));
    }
    if (molStart + 1 >= vStart && molStart + 1 <= vEnd) {
      res.comment.push(new vscode.Range(molStart + 1, 0, molStart + 1, doc.lineAt(molStart + 1).text.trimEnd().length));
    }
    if (molStart + 3 >= vStart && molStart + 3 <= vEnd) {
      res.infoText.push(new vscode.Range(molStart + 3, 0, molStart + 3, doc.lineAt(molStart + 3).text.trimEnd().length));
    }

    i = i + 4 + numAtoms;
    while (i < doc.lineCount && !doc.lineAt(i).text.trim().startsWith('$$$$')) {
      if (i >= vStart && i <= vEnd) {
        const line = doc.lineAt(i).text;
        const t = line.trim();
        if (t === 'M  END') {
          res.delimiter.push(new vscode.Range(i, line.indexOf('M'), i, line.indexOf('M') + 6));
        }
        const fieldMatch = line.match(/^>\s*<([^>]+)>/);
        if (fieldMatch) {
          const s = line.indexOf('<');
          res.sectionHeader.push(new vscode.Range(i, s, i, s + fieldMatch[1].length + 2));
        }
      }
      i++;
    }
    if (i < doc.lineCount && i >= vStart && i <= vEnd) {
      const l = doc.lineAt(i);
      res.delimiter.push(new vscode.Range(i, 0, i, l.text.length));
    }
    i++;
  }

  for (const mol of molecules) {
    if (mol.atomEnd < vStart || mol.atomStart > vEnd) continue;
    const from = Math.max(mol.atomStart, vStart);
    const to = Math.min(mol.atomEnd, vEnd);
    for (let j = from; j <= to && j < doc.lineCount; j++) {
      const line = doc.lineAt(j).text;
      if (line.length >= 30) {
        addTrimmedRange(res.coord, line, j, 0, 10);
        addTrimmedRange(res.coord, line, j, 10, 20);
        addTrimmedRange(res.coord, line, j, 20, 30);
      }
      if (line.length >= 34) {
        const raw = line.substring(30, 34).trim();
        const sym = raw.split(/\s/)[0];
        if (sym) {
          const col = line.indexOf(sym, 30);
          if (col >= 0) addElement(res.er, sym, j, col);
        }
      }
    }
  }

  return res;
}
