import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';

export function parseXvg(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  for (let i = vStart; i <= vEnd && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Comment lines: #
    if (trimmed.startsWith('#')) {
      res.comment.push(new vscode.Range(i, line.indexOf('#'), i, line.length));
      continue;
    }

    // Grace directives: @
    if (trimmed.startsWith('@')) {
      res.xvgDirective.push(new vscode.Range(i, line.indexOf('@'), i, line.trimEnd().length));
      continue;
    }

    // Data lines (numbers)
    res.coord.push(new vscode.Range(i, line.indexOf(trimmed), i, line.indexOf(trimmed) + trimmed.length));
  }
  return res;
}
