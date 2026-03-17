import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';
import { ELEMENT_SET } from '../classify';
import { nthFieldPos, addElement } from '../helpers';

export function parseXyz(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  let i = 0;
  while (i < doc.lineCount) {
    const countLine = doc.lineAt(i).text.trim();
    const numAtoms = parseInt(countLine, 10);
    if (isNaN(numAtoms) || numAtoms <= 0) { i++; continue; }

    if (i >= vStart && i <= vEnd) {
      const ct = doc.lineAt(i).text;
      const cv = ct.trim();
      res.keyword.push(new vscode.Range(i, ct.indexOf(cv), i, ct.indexOf(cv) + cv.length));
    }
    if (i + 1 >= vStart && i + 1 <= vEnd && i + 1 < doc.lineCount) {
      const cl = doc.lineAt(i + 1).text.trimEnd();
      if (cl) res.comment.push(new vscode.Range(i + 1, 0, i + 1, cl.length));
    }

    const dataStart = i + 2;
    const dataEnd = dataStart + numAtoms - 1;

    if (dataEnd >= vStart && dataStart <= vEnd) {
      const from = Math.max(dataStart, vStart);
      const to = Math.min(dataEnd, vEnd);
      for (let j = from; j <= to && j < doc.lineCount; j++) {
        const line = doc.lineAt(j).text;
        const t = line.trim();
        if (!t) continue;
        const fields = t.split(/\s+/);
        const sym = fields[0];
        if (sym && ELEMENT_SET.has(sym.toUpperCase())) {
          const col = line.indexOf(sym);
          if (col >= 0) addElement(res.er, sym, j, col);
        }
        for (let fi = 1; fi <= 3 && fi < fields.length; fi++) {
          const pos = nthFieldPos(line, fi);
          if (pos >= 0) res.coord.push(new vscode.Range(j, pos, j, pos + fields[fi].length));
        }
      }
    }

    i = dataStart + numAtoms;
  }

  return res;
}
