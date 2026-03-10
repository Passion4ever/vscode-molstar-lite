import path from 'path';

export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const FORMAT_MAP: Record<string, string> = {
  '.pdb': 'pdb',
  '.pdbqt': 'pdbqt',
  '.pqr': 'pqr',
  '.cif': 'mmcif',
  '.mmcif': 'mmcif',
  '.gro': 'gro',
  '.mol': 'mol',
  '.mol2': 'mol2',
  '.sdf': 'sdf',
  '.xyz': 'xyz',
};

export function extToFormat(filePath: string): string | undefined {
  const ext = path.extname(filePath).toLowerCase();
  return FORMAT_MAP[ext];
}
