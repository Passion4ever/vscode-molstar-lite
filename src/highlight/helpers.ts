import * as vscode from 'vscode';
import { classifyElement, classifyResidue } from './classify';
import type { ParseResult } from './colors';

export const MARGIN = 150;

export function getVisibleLines(editor: vscode.TextEditor): [number, number] {
  const ranges = editor.visibleRanges;
  if (ranges.length === 0) return [0, editor.document.lineCount - 1];
  const start = Math.max(0, ranges[0].start.line - MARGIN);
  const end = Math.min(editor.document.lineCount - 1, ranges[ranges.length - 1].end.line + MARGIN);
  return [start, end];
}

/** Return the char offset of the N-th whitespace-delimited field. */
export function nthFieldPos(line: string, n: number): number {
  let p = 0;
  while (p < line.length && line[p] === ' ') p++;
  for (let f = 0; f < n; f++) {
    while (p < line.length && line[p] !== ' ') p++;
    while (p < line.length && line[p] === ' ') p++;
  }
  return p < line.length ? p : -1;
}

export function addElement(er: Record<string, vscode.Range[]>, sym: string, line: number, col: number) {
  const cls = classifyElement(sym);
  if (cls) er[cls].push(new vscode.Range(line, col, line, col + sym.trim().length));
}

/** Color a trimmed value within a fixed-width column range */
export function addTrimmedRange(arr: vscode.Range[], line: string, lineNum: number, colStart: number, colEnd: number) {
  const raw = line.substring(colStart, colEnd);
  const val = raw.trim();
  if (val) {
    const off = raw.indexOf(val);
    arr.push(new vscode.Range(lineNum, colStart + off, lineNum, colStart + off + val.length));
  }
}

export function addResidue(rr: Record<string, vscode.Range[]>, name: string, line: number, col: number) {
  const cls = classifyResidue(name);
  if (cls) rr[cls].push(new vscode.Range(line, col, line, col + name.trim().length));
}

export type Parser = (doc: vscode.TextDocument, vStart: number, vEnd: number) => ParseResult;
