import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';

export function parseNdx(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  for (let i = vStart; i <= vEnd && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Group headers: [ name ]
    const secMatch = trimmed.match(/^\[.*?\]/);
    if (secMatch) {
      const start = line.indexOf('[');
      res.topSection.push(new vscode.Range(i, start, i, start + secMatch[0].length));
      continue;
    }

    // Lines of index numbers
    res.coord.push(new vscode.Range(i, line.indexOf(trimmed), i, line.indexOf(trimmed) + trimmed.length));
  }
  return res;
}
