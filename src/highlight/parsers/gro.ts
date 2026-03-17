import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';
import { addTrimmedRange, addResidue } from '../helpers';

export function parseGro(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();
  if (doc.lineCount < 3) return res;

  if (vStart === 0) {
    res.comment.push(new vscode.Range(0, 0, 0, doc.lineAt(0).text.trimEnd().length));
  }
  if (vStart <= 1) {
    const countText = doc.lineAt(1).text.trim();
    if (countText) {
      const off = doc.lineAt(1).text.indexOf(countText);
      res.keyword.push(new vscode.Range(1, off, 1, off + countText.length));
    }
  }

  const numAtoms = parseInt(doc.lineAt(1).text.trim(), 10);
  if (isNaN(numAtoms)) return res;

  const from = Math.max(2, vStart);
  const to = Math.min(2 + numAtoms - 1, vEnd);
  for (let i = from; i <= to && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    if (line.length < 20) continue;

    const resName = line.substring(5, 10).trim();
    if (resName) {
      const raw = line.substring(5, 10);
      addResidue(res.rr, resName, i, 5 + raw.indexOf(resName));
    }
    if (line.length >= 15) {
      const raw5 = line.substring(10, 15);
      const atomName = raw5.trim();
      if (atomName) {
        res.atomName.push(new vscode.Range(i, 10 + raw5.indexOf(atomName), i, 10 + raw5.indexOf(atomName) + atomName.length));
      }
    }
    if (line.length >= 44) {
      addTrimmedRange(res.coord, line, i, 20, 28);
      addTrimmedRange(res.coord, line, i, 28, 36);
      addTrimmedRange(res.coord, line, i, 36, 44);
    }
  }

  const boxLine = 2 + numAtoms;
  if (boxLine >= vStart && boxLine <= vEnd && boxLine < doc.lineCount) {
    res.coord.push(new vscode.Range(boxLine, 0, boxLine, doc.lineAt(boxLine).text.trimEnd().length));
  }

  return res;
}
