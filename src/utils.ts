export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf('.');
  return lastDot >= 0 ? path.slice(lastDot).toLowerCase() : '';
}

export const FORMAT_MAP: Record<string, string> = {
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
