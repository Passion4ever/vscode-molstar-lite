// ── Amino acid classification ──────────────────────────────────────

const HYDROPHOBIC = new Set(['ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO']);
const POLAR       = new Set(['SER', 'THR', 'ASN', 'GLN', 'TYR', 'CYS']);
const POSITIVE    = new Set(['ARG', 'LYS', 'HIS']);
const NEGATIVE    = new Set(['ASP', 'GLU']);
const SPECIAL     = new Set(['GLY']);
const WATER       = new Set(['HOH', 'WAT', 'H2O', 'DOD', 'SOL']);
const DNA         = new Set(['DA', 'DT', 'DG', 'DC']);
const RNA         = new Set(['A', 'U', 'G', 'C']);

export function classifyResidue(name: string): string | undefined {
  const t = name.trim();
  if (!t) return undefined;
  if (HYDROPHOBIC.has(t)) return 'hydrophobic';
  if (POLAR.has(t))       return 'polar';
  if (POSITIVE.has(t))    return 'positive';
  if (NEGATIVE.has(t))    return 'negative';
  if (SPECIAL.has(t))     return 'special';
  if (WATER.has(t))       return 'water';
  if (DNA.has(t))         return 'dna';
  if (RNA.has(t))         return 'rna';
  return 'ligand';
}

// ── Element classification (CPK) ───────────────────────────────────

export const ELEMENT_SET = new Set([
  'H','HE','LI','BE','B','C','N','O','F','NE','NA','MG','AL','SI','P','S','CL','AR',
  'K','CA','SC','TI','V','CR','MN','FE','CO','NI','CU','ZN','GA','GE','AS','SE','BR','KR',
  'RB','SR','Y','ZR','NB','MO','TC','RU','RH','PD','AG','CD','IN','SN','SB','TE','I','XE',
  'CS','BA','LA','CE','PR','ND','PM','SM','EU','GD','TB','DY','HO','ER','TM','YB','LU',
  'HF','TA','W','RE','OS','IR','PT','AU','HG','TL','PB','BI','PO','AT','RN',
  'FR','RA','AC','TH','PA','U','NP','PU',
]);

export function classifyElement(sym: string): string | undefined {
  const t = sym.trim().toUpperCase();
  if (!ELEMENT_SET.has(t)) return undefined;
  switch (t) {
    case 'C':  return 'carbon';
    case 'N':  return 'nitrogen';
    case 'O':  return 'oxygen';
    case 'S':  return 'sulfur';
    case 'H':  return 'hydrogen';
    case 'P':  return 'phosphorus';
    case 'FE': case 'ZN': case 'MG': case 'CA': case 'MN':
    case 'CU': case 'NA': case 'CL': case 'SE': case 'BR':
    case 'K':  case 'CO': case 'NI': case 'MO':
      return 'metal';
    default: return 'other';
  }
}

// ── PDBQT atom type → element mapping (AutoDock convention) ────────

export const PDBQT_TYPE_MAP: Record<string, string> = {
  'A':  'C',  'C':  'C',  'N':  'N',  'NA': 'N',  'NS': 'N',
  'O':  'O',  'OA': 'O',  'OS': 'O',  'S':  'S',  'SA': 'S',
  'H':  'H',  'HD': 'H',  'HS': 'H',  'P':  'P',  'F':  'F',
  'CL': 'CL', 'BR': 'BR', 'I':  'I',  'ZN': 'ZN', 'FE': 'FE',
  'MG': 'MG', 'MN': 'MN', 'CA': 'CA', 'CU': 'CU', 'NI': 'NI',
};

/** PDB atom name field (4 chars, cols 12-15) → element.
 *  Uses PDB right-justification convention:
 *    " N  " → N (1-letter element, col 13)
 *    " CA " → C (1-letter + branch, NOT calcium)
 *    "FE  " → FE (2-letter element, cols 12-13)
 */
export function elementFromPdbAtomField(raw4: string): string | undefined {
  if (raw4.length < 2) return undefined;
  if (raw4[0] === ' ') {
    const ch = raw4[1]?.toUpperCase();
    return ch && ELEMENT_SET.has(ch) ? ch : undefined;
  }
  const two = raw4.substring(0, 2).toUpperCase();
  if (ELEMENT_SET.has(two)) return two;
  const one = raw4[0].toUpperCase();
  return ELEMENT_SET.has(one) ? one : undefined;
}

// Single-letter amino acid → residue group (for FASTA protein sequences)
export const AA1_MAP: Record<string, string> = {
  'A': 'hydrophobic', 'V': 'hydrophobic', 'L': 'hydrophobic', 'I': 'hydrophobic',
  'M': 'hydrophobic', 'F': 'hydrophobic', 'W': 'hydrophobic', 'P': 'hydrophobic',
  'S': 'polar', 'T': 'polar', 'N': 'polar', 'Q': 'polar', 'Y': 'polar', 'C': 'polar',
  'R': 'positive', 'K': 'positive', 'H': 'positive',
  'D': 'negative', 'E': 'negative',
  'G': 'special',
};
