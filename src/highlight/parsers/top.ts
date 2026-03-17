import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';
import { addResidue } from '../helpers';

const AA_RE = /\b(ALA|VAL|LEU|ILE|MET|PHE|TRP|PRO|SER|THR|ASN|GLN|TYR|CYS|ARG|LYS|HIS|ASP|GLU|GLY|HOH|WAT|SOL)\b/g;

export function parseTop(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  for (let i = vStart; i <= vEnd && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    const trimmed = line.trim();

    // Comments: ; or *
    if (trimmed.startsWith(';') || trimmed.startsWith('*')) {
      res.comment.push(new vscode.Range(i, line.indexOf(trimmed[0]), i, line.length));
      continue;
    }

    if (!trimmed) continue;

    // Preprocessor directives: #include, #ifdef, #ifndef, #define, #endif, #else, #undef
    if (trimmed.startsWith('#')) {
      const end = line.trimEnd().length;
      res.preprocessor.push(new vscode.Range(i, line.indexOf('#'), i, end));
      continue;
    }

    // Section headers: [ name ]
    const secMatch = trimmed.match(/^\[.*?\]/);
    if (secMatch) {
      const start = line.indexOf('[');
      res.topSection.push(new vscode.Range(i, start, i, start + secMatch[0].length));
      // Inline comment after section header
      const semi = line.indexOf(';', start + secMatch[0].length);
      if (semi >= 0) res.comment.push(new vscode.Range(i, semi, i, line.length));
      continue;
    }

    // Inline comment
    const semiIdx = line.indexOf(';');
    if (semiIdx >= 0) {
      res.comment.push(new vscode.Range(i, semiIdx, i, line.length));
    }
    const contentEnd = semiIdx >= 0 ? semiIdx : line.trimEnd().length;
    const content = line.substring(0, contentEnd);

    // Amino acid residue names
    AA_RE.lastIndex = 0;
    let m;
    while ((m = AA_RE.exec(content)) !== null) {
      addResidue(res.rr, m[1], i, m.index);
    }

    // Numbers in data lines
    const numRe = /(?<![a-zA-Z])(-?\d+\.?\d*(?:[eE][+-]?\d+)?)(?![a-zA-Z])/g;
    numRe.lastIndex = 0;
    while ((m = numRe.exec(content)) !== null) {
      res.coord.push(new vscode.Range(i, m.index, i, m.index + m[0].length));
    }
  }
  return res;
}
