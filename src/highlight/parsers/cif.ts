import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult, StructKey } from '../colors';
import { nthFieldPos, addElement, addResidue } from '../helpers';

function cifFieldRole(field: string): StructKey | 'residue' | 'element' | null {
  const f = field.toLowerCase();
  if (f.endsWith('comp_id') || f.endsWith('mon_id')) return 'residue';
  if (f.endsWith('type_symbol')) return 'element';
  if (f.endsWith('atom_id') || f.endsWith('atom_id_1') || f.endsWith('atom_id_2')) return 'atomName';
  if (f.endsWith('asym_id') || f.endsWith('strand_id')) return 'chainId';
  if (f.endsWith('cartn_x') || f.endsWith('cartn_y') || f.endsWith('cartn_z')) return 'coord';
  if (f.endsWith('.occupancy')) return 'occupancy';
  if (f.endsWith('b_iso_or_equiv')) return 'bFactor';
  if (f.endsWith('group_pdb')) return 'recordType';
  if (f.endsWith('value_order')) return 'keyword';
  return null;
}

interface CifLoop {
  dataStart: number;
  dataEnd: number;
  roles: Map<number, StructKey | 'residue' | 'element'>;
}

export function parseCif(doc: vscode.TextDocument, vStart: number, vEnd: number): ParseResult {
  const res = emptyResult();

  const loops: CifLoop[] = [];
  let headers: string[] = [];
  let inHeader = false;

  for (let i = 0; i < doc.lineCount; i++) {
    const t = doc.lineAt(i).text.trim();
    if (t === 'loop_') { inHeader = true; headers = []; continue; }
    if (inHeader && t.startsWith('_')) { headers.push(t.split(/\s/)[0]); continue; }
    if (inHeader && !t.startsWith('_') && headers.length > 0) {
      inHeader = false;
      const roles = new Map<number, StructKey | 'residue' | 'element'>();
      for (let c = 0; c < headers.length; c++) {
        const role = cifFieldRole(headers[c]);
        if (role) roles.set(c, role);
      }
      if (roles.size > 0) {
        let dataEnd = doc.lineCount - 1;
        for (let j = i; j < doc.lineCount; j++) {
          const jt = doc.lineAt(j).text.trim();
          if (jt === '' || jt === '#' || jt.startsWith('_') || jt === 'loop_') { dataEnd = j - 1; break; }
        }
        loops.push({ dataStart: i, dataEnd, roles });
      }
    }
  }

  for (let i = vStart; i <= vEnd && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    const t = line.trim();

    if (t.startsWith('#')) { res.comment.push(new vscode.Range(i, 0, i, line.trimEnd().length)); continue; }
    if (t.startsWith('data_')) { res.keyword.push(new vscode.Range(i, line.indexOf('data_'), i, line.trimEnd().length)); continue; }
    if (t === 'loop_') { res.keyword.push(new vscode.Range(i, line.indexOf('loop_'), i, line.indexOf('loop_') + 5)); continue; }
    if (t.startsWith('_')) {
      const spaceIdx = t.indexOf(' ');
      const keyStart = line.indexOf('_');
      const keyEnd = keyStart + (spaceIdx > 0 ? spaceIdx : t.length);
      res.sectionHeader.push(new vscode.Range(i, keyStart, i, keyEnd));
      if (spaceIdx > 0) {
        const valText = line.substring(keyEnd).trim();
        if (valText) { const vs = line.indexOf(valText, keyEnd); res.infoText.push(new vscode.Range(i, vs, i, vs + valText.length)); }
      }
      continue;
    }

    let handled = false;
    for (const loop of loops) {
      if (i < loop.dataStart || i > loop.dataEnd) continue;
      handled = true;
      const fields = t.split(/\s+/);
      for (const [col, role] of loop.roles) {
        if (col >= fields.length) continue;
        const pos = nthFieldPos(line, col);
        if (pos < 0) continue;
        if (role === 'residue') addResidue(res.rr, fields[col], i, pos);
        else if (role === 'element') addElement(res.er, fields[col], i, pos);
        else res[role].push(new vscode.Range(i, pos, i, pos + fields[col].length));
      }
      break;
    }

    if (!handled) {
      const quotes = /('[^']*'|"[^"]*")/g;
      let qm;
      while ((qm = quotes.exec(line)) !== null) {
        res.infoText.push(new vscode.Range(i, qm.index, i, qm.index + qm[0].length));
      }
    }
  }

  return res;
}
