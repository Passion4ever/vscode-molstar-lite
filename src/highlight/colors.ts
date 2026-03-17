import * as vscode from 'vscode';

// ── Default color schemes ──────────────────────────────────────────

export const DEFAULT_RESIDUE_COLORS: Record<string, string> = {
  hydrophobic: '#C8AE81',
  polar:       '#7EE787',
  positive:    '#79C0FF',
  negative:    '#FF7B72',
  special:     '#D2A8FF',
  water:       '#56D4DD',
  dna:         '#FFA657',
  rna:         '#FFAB70',
  ligand:      '#8B949E',
};

export const DEFAULT_ELEMENT_COLORS: Record<string, string> = {
  carbon:      '#909090',
  nitrogen:    '#6CB6FF',
  oxygen:      '#FF7B72',
  sulfur:      '#E3B341',
  hydrogen:    '#7A828E',
  phosphorus:  '#FFA657',
  metal:       '#D2A8FF',
  other:       '#A0A0A0',
};

// Structural decoration colors
export const STRUCTURAL_COLORS: Record<string, { color: string; fontWeight?: string }> = {
  delimiter:     { color: '#FF7B72', fontWeight: 'bold' },   // $$$$, M END
  sectionHeader: { color: '#39A3E9', fontWeight: 'bold' },   // titles, @<TRIPOS>, > <field>
  keyword:       { color: '#3FAEF3' },                        // MODEL/TER/END, bond types
  comment:       { color: '#3C802D' },                        // REMARK, # comments
  recordType:    { color: '#39A3E9' },                        // ATOM/HETATM/HEADER keywords
  chainId:       { color: '#AF3FAF', fontWeight: 'bold' },   // chain ID
  atomName:      { color: '#03CE7D', fontWeight: 'bold' },   // atom names
  charge:        { color: '#E3B341' },                        // partial charge
  radius:        { color: '#56D4DD' },                        // atomic radius
  coord:         { color: '#3FAEF3' },                        // coordinates
  occupancy:     { color: '#87B860' },                        // occupancy
  bFactor:       { color: '#CE9178' },                        // B-factor
  helix:         { color: '#827AF0' },                        // HELIX records
  sheet:         { color: '#5EF0BF' },                        // SHEET records
  ssbond:        { color: '#E68F0E' },                        // SSBOND records
  infoText:      { color: '#7EC5C5' },                        // metadata content
  // Nucleotide colors
  ntA:           { color: '#47FF19' },                        // Adenine  = green
  ntT:           { color: '#4192FF' },                        // Thymine  = blue
  ntG:           { color: '#F09000' },                        // Guanine  = orange
  ntC:           { color: '#FF4641' },                        // Cytosine = red
  ntU:           { color: '#8A89FF' },                        // Uracil   = purple
  // GROMACS-specific decorations
  mdpKeyword:    { color: '#D95EF1', fontWeight: 'bold' },   // MDP parameter names
  preprocessor:  { color: '#A66BDD' },                        // #include, #ifdef, etc.
  topSection:    { color: '#C3F709' },                        // [ section_name ] in TOP/NDX
  xvgDirective:  { color: '#CA7553' },                        // @ lines in XVG
};

// ── Structural keys ────────────────────────────────────────────────

export const STRUCT_KEYS = Object.keys(STRUCTURAL_COLORS) as readonly StructKey[];
export type StructKey = keyof typeof STRUCTURAL_COLORS;

// ── Types ──────────────────────────────────────────────────────────

export type DecorationStore = {
  residue: Record<string, vscode.TextEditorDecorationType>;
  element: Record<string, vscode.TextEditorDecorationType>;
} & Record<StructKey, vscode.TextEditorDecorationType>;

export type ParseResult = {
  rr: Record<string, vscode.Range[]>;
  er: Record<string, vscode.Range[]>;
} & Record<StructKey, vscode.Range[]>;

// ── Helpers ────────────────────────────────────────────────────────

export function getColors() {
  const cfg = vscode.workspace.getConfiguration('molstarLite.highlight');
  const residue = { ...DEFAULT_RESIDUE_COLORS, ...cfg.get<Record<string, string>>('residueColors') };
  const element = { ...DEFAULT_ELEMENT_COLORS, ...cfg.get<Record<string, string>>('elementColors') };
  return { residue, element };
}

export function emptyResult(): ParseResult {
  const rr: Record<string, vscode.Range[]> = {};
  const er: Record<string, vscode.Range[]> = {};
  for (const k of Object.keys(DEFAULT_RESIDUE_COLORS)) rr[k] = [];
  for (const k of Object.keys(DEFAULT_ELEMENT_COLORS)) er[k] = [];
  const res = { rr, er } as ParseResult;
  for (const k of STRUCT_KEYS) res[k] = [];
  return res;
}

export function createDecorations(): DecorationStore {
  const colors = getColors();
  const residue: Record<string, vscode.TextEditorDecorationType> = {};
  for (const [k, color] of Object.entries(colors.residue)) {
    residue[k] = vscode.window.createTextEditorDecorationType({ color });
  }
  const element: Record<string, vscode.TextEditorDecorationType> = {};
  for (const [k, color] of Object.entries(colors.element)) {
    element[k] = vscode.window.createTextEditorDecorationType({
      color,
      fontWeight: k === 'metal' ? 'bold' : undefined,
    });
  }
  const store = { residue, element } as DecorationStore;
  for (const [k, opts] of Object.entries(STRUCTURAL_COLORS)) {
    store[k as StructKey] = vscode.window.createTextEditorDecorationType(opts);
  }
  return store;
}

export function disposeDecorations(deco: DecorationStore) {
  for (const t of Object.values(deco.residue)) t.dispose();
  for (const t of Object.values(deco.element)) t.dispose();
  for (const k of STRUCT_KEYS) deco[k].dispose();
}
