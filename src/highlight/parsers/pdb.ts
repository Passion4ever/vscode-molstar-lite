import * as vscode from 'vscode';
import { emptyResult } from '../colors';
import type { ParseResult } from '../colors';
import { classifyResidue, PDBQT_TYPE_MAP, elementFromPdbAtomField } from '../classify';
import { addElement, addTrimmedRange, addResidue } from '../helpers';

type ElementMode = 'pdb' | 'pdbqt' | 'pqr';

const PDB_RECORD_KEYWORDS = new Set([
  'HEADER', 'TITLE ', 'COMPND', 'SOURCE', 'KEYWDS', 'EXPDTA', 'AUTHOR',
  'REVDAT', 'NUMMDL', 'CRYST1', 'ORIGX1', 'ORIGX2', 'ORIGX3',
  'SCALE1', 'SCALE2', 'SCALE3', 'MTRIX1', 'MTRIX2', 'MTRIX3', 'LINK  ',
  'CONECT', 'MASTER', 'HET   ', 'HETNAM', 'HETSYN', 'FORMUL',
  'DBREF ', 'SEQADV', 'MODRES', 'CAVEAT', 'SPRSDE', 'OBSLTE',
]);

function parsePdbFamily(doc: vscode.TextDocument, vStart: number, vEnd: number, mode: ElementMode): ParseResult {
  const res = emptyResult();

  for (let i = vStart; i <= vEnd && i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    const rec = line.substring(0, 6);

    // ── ATOM / HETATM lines ──
    if (line.startsWith('ATOM  ') || line.startsWith('HETATM')) {
      res.recordType.push(new vscode.Range(i, 0, i, 6));

      if (line.length >= 16) {
        const raw4 = line.substring(12, 16);
        const atomName = raw4.trim();
        if (atomName) {
          const off = 12 + raw4.indexOf(atomName);
          res.atomName.push(new vscode.Range(i, off, i, off + atomName.length));
        }
      }

      if (line.length >= 20) {
        const raw = line.substring(17, 20);
        const name = raw.trim();
        if (name) addResidue(res.rr, name, i, 17 + raw.indexOf(name));
      }

      if (line.length >= 22) {
        const ch = line[21];
        if (ch !== ' ') {
          res.chainId.push(new vscode.Range(i, 21, i, 22));
        }
      }

      if (line.length >= 54) {
        addTrimmedRange(res.coord, line, i, 30, 38);
        addTrimmedRange(res.coord, line, i, 38, 46);
        addTrimmedRange(res.coord, line, i, 46, 54);
      }

      if (line.length >= 60) addTrimmedRange(res.occupancy, line, i, 54, 60);
      if (line.length >= 66) addTrimmedRange(res.bFactor, line, i, 60, 66);

      if (mode === 'pdb') {
        if (line.length >= 78) {
          const raw = line.substring(76, 78);
          const sym = raw.trim();
          if (sym) addElement(res.er, sym, i, 76 + raw.indexOf(sym));
        }
      } else if (mode === 'pdbqt') {
        const trimmed = line.trimEnd();
        const lastSpace = trimmed.lastIndexOf(' ');
        if (lastSpace >= 0) {
          const atomType = trimmed.substring(lastSpace + 1);
          const elem = PDBQT_TYPE_MAP[atomType.toUpperCase()];
          if (elem) addElement(res.er, elem, i, lastSpace + 1);
          const beforeType = trimmed.substring(0, lastSpace).trimEnd();
          const chgSpace = beforeType.lastIndexOf(' ');
          if (chgSpace >= 0) {
            const chgStr = beforeType.substring(chgSpace + 1);
            res.charge.push(new vscode.Range(i, chgSpace + 1, i, chgSpace + 1 + chgStr.length));
          }
        }
      } else if (mode === 'pqr') {
        const trimmed = line.trimEnd();
        const fields = trimmed.split(/\s+/);
        if (fields.length >= 2) {
          const radStr = fields[fields.length - 1];
          const radPos = trimmed.lastIndexOf(radStr);
          if (radPos >= 0) res.radius.push(new vscode.Range(i, radPos, i, radPos + radStr.length));
          if (fields.length >= 3) {
            const chgStr = fields[fields.length - 2];
            const searchArea = trimmed.substring(0, radPos).trimEnd();
            const chgPos = searchArea.lastIndexOf(chgStr);
            if (chgPos >= 0) res.charge.push(new vscode.Range(i, chgPos, i, chgPos + chgStr.length));
          }
        }
      }
      continue;
    }

    if (line.startsWith('REMARK')) {
      res.comment.push(new vscode.Range(i, 0, i, line.length));
      continue;
    }

    if (line.startsWith('SEQRES')) {
      res.recordType.push(new vscode.Range(i, 0, i, 6));
      for (let col = 19; col + 3 <= line.length; col += 4) {
        const raw = line.substring(col, col + 3);
        const name = raw.trim();
        if (name) addResidue(res.rr, name, i, col + raw.indexOf(name));
      }
      continue;
    }

    if (line.startsWith('HELIX ') || line.startsWith('SHEET ') || line.startsWith('SSBOND')) {
      const arr = line.startsWith('HELIX ') ? res.helix : line.startsWith('SHEET ') ? res.sheet : res.ssbond;
      arr.push(new vscode.Range(i, 0, i, 6));
      const rest = line.substring(6);
      const re = /\b(ALA|VAL|LEU|ILE|MET|PHE|TRP|PRO|SER|THR|ASN|GLN|TYR|CYS|ARG|LYS|HIS|ASP|GLU|GLY|HOH|WAT)\b/g;
      let m;
      while ((m = re.exec(rest)) !== null) {
        addResidue(res.rr, m[1], i, 6 + m.index);
      }
      if (line.length > 6) res.infoText.push(new vscode.Range(i, 6, i, line.trimEnd().length));
      continue;
    }

    if (/^(TER   |END\s*$|MODEL |ENDMDL)/.test(line)) {
      res.keyword.push(new vscode.Range(i, 0, i, line.trimEnd().length));
      continue;
    }

    if (mode === 'pdbqt' && /^(ROOT|ENDROOT|BRANCH|ENDBRANCH|TORSDOF)\b/.test(line)) {
      const end = line.indexOf(' ', 0);
      res.keyword.push(new vscode.Range(i, 0, i, end > 0 ? end : line.trimEnd().length));
      continue;
    }

    if (line.startsWith('SITE  ')) {
      res.recordType.push(new vscode.Range(i, 0, i, 6));
      const fields = line.substring(18).split(/\s+/);
      let searchFrom = 18;
      for (const f of fields) {
        if (!f) continue;
        const cls = classifyResidue(f);
        if (cls && cls !== 'ligand') {
          const pos = line.indexOf(f, searchFrom);
          if (pos >= 0) { addResidue(res.rr, f, i, pos); searchFrom = pos + f.length; continue; }
        }
        searchFrom = line.indexOf(f, searchFrom);
        if (searchFrom >= 0) searchFrom += f.length; else break;
      }
      continue;
    }

    if (line.startsWith('JRNL  ')) {
      res.recordType.push(new vscode.Range(i, 0, i, 6));
      if (line.length > 12) res.infoText.push(new vscode.Range(i, 12, i, line.trimEnd().length));
      continue;
    }

    if (PDB_RECORD_KEYWORDS.has(rec)) {
      res.recordType.push(new vscode.Range(i, 0, i, 6));
      const contentEnd = line.trimEnd().length;
      if (contentEnd > 6) res.infoText.push(new vscode.Range(i, 6, i, contentEnd));
    }
  }
  return res;
}

export function parsePdb(doc: vscode.TextDocument, vS: number, vE: number) { return parsePdbFamily(doc, vS, vE, 'pdb'); }
export function parsePdbqt(doc: vscode.TextDocument, vS: number, vE: number) { return parsePdbFamily(doc, vS, vE, 'pdbqt'); }
export function parsePqr(doc: vscode.TextDocument, vS: number, vE: number) { return parsePdbFamily(doc, vS, vE, 'pqr'); }
