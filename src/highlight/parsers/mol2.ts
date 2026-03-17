import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';
import { nthFieldPos, addElement, addResidue } from '../helpers';

interface Mol2Section { name: string; start: number; end: number; }

export function parseMol2(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  const sections: Mol2Section[] = [];
  for (let i = 0; i < doc.lineCount; i++) {
    const t = doc.lineAt(i).text.trim();
    if (t.startsWith('@<TRIPOS>')) {
      if (sections.length > 0) sections[sections.length - 1].end = i - 1;
      sections.push({ name: t.substring(9), start: i + 1, end: doc.lineCount - 1 });
    }
  }

  let si = 0;
  while (si < sections.length && vStart > sections[si].end) si++;

  for (let i = vStart; i <= vEnd && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    const t = line.trim();

    if (t.startsWith('@<TRIPOS>')) {
      const atIdx = line.indexOf('@');
      const gtIdx = line.indexOf('>', atIdx);
      if (gtIdx >= 0) {
        res.delimiter.push(new vscode.Range(i, atIdx, i, gtIdx + 1));
        if (line.trimEnd().length > gtIdx + 1) {
          res.keyword.push(new vscode.Range(i, gtIdx + 1, i, line.trimEnd().length));
        }
      }
      continue;
    }

    if (t.startsWith('#')) {
      res.comment.push(new vscode.Range(i, 0, i, line.trimEnd().length));
      continue;
    }

    if (!t) continue;
    while (si < sections.length - 1 && i > sections[si].end) si++;
    const sec = (si < sections.length && i >= sections[si].start && i <= sections[si].end) ? sections[si] : null;
    if (!sec) continue;

    const fields = t.split(/\s+/);

    if (sec.name === 'MOLECULE') {
      const lineInSec = i - sec.start;
      if (lineInSec === 0) {
        res.sectionHeader.push(new vscode.Range(i, line.indexOf(t), i, line.indexOf(t) + t.length));
      } else if (lineInSec === 1) {
        res.infoText.push(new vscode.Range(i, line.indexOf(t), i, line.indexOf(t) + t.length));
      } else {
        res.keyword.push(new vscode.Range(i, line.indexOf(t), i, line.indexOf(t) + t.length));
      }
    } else if (sec.name === 'ATOM') {
      if (fields.length < 6) continue;
      const idPos = nthFieldPos(line, 0);
      if (idPos >= 0) res.infoText.push(new vscode.Range(i, idPos, i, idPos + fields[0].length));
      const namePos = nthFieldPos(line, 1);
      if (namePos >= 0) res.atomName.push(new vscode.Range(i, namePos, i, namePos + fields[1].length));
      for (const fi of [2, 3, 4]) {
        if (fi < fields.length) {
          const pos = nthFieldPos(line, fi);
          if (pos >= 0) res.coord.push(new vscode.Range(i, pos, i, pos + fields[fi].length));
        }
      }
      const typePos = nthFieldPos(line, 5);
      if (typePos >= 0) {
        const atomType = fields[5];
        const elem = atomType.split('.')[0];
        if (elem) addElement(res.er, elem, i, typePos);
        const dotIdx = atomType.indexOf('.');
        if (dotIdx >= 0) {
          res.infoText.push(new vscode.Range(i, typePos + dotIdx, i, typePos + atomType.length));
        }
      }
      if (fields.length >= 7) {
        const pos = nthFieldPos(line, 6);
        if (pos >= 0) res.infoText.push(new vscode.Range(i, pos, i, pos + fields[6].length));
      }
      if (fields.length >= 8) {
        const pos = nthFieldPos(line, 7);
        if (pos >= 0) addResidue(res.rr, fields[7], i, pos);
      }
      if (fields.length >= 9) {
        const pos = nthFieldPos(line, 8);
        if (pos >= 0) res.charge.push(new vscode.Range(i, pos, i, pos + fields[8].length));
      }
    } else if (sec.name === 'BOND') {
      if (fields.length < 4) continue;
      const idPos = nthFieldPos(line, 0);
      if (idPos >= 0) res.infoText.push(new vscode.Range(i, idPos, i, idPos + fields[0].length));
      for (const fi of [1, 2]) {
        const pos = nthFieldPos(line, fi);
        if (pos >= 0) res.coord.push(new vscode.Range(i, pos, i, pos + fields[fi].length));
      }
      const btPos = nthFieldPos(line, 3);
      if (btPos >= 0) res.keyword.push(new vscode.Range(i, btPos, i, btPos + fields[3].length));
    } else if (sec.name === 'SUBSTRUCTURE') {
      if (fields.length < 3) continue;
      const idPos = nthFieldPos(line, 0);
      if (idPos >= 0) res.infoText.push(new vscode.Range(i, idPos, i, idPos + fields[0].length));
      const namePos = nthFieldPos(line, 1);
      if (namePos >= 0) addResidue(res.rr, fields[1], i, namePos);
      for (let fi = 2; fi < fields.length; fi++) {
        const pos = nthFieldPos(line, fi);
        if (pos >= 0) res.infoText.push(new vscode.Range(i, pos, i, pos + fields[fi].length));
      }
    } else {
      res.infoText.push(new vscode.Range(i, line.indexOf(t), i, line.indexOf(t) + t.length));
    }
  }

  return res;
}
