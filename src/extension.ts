import * as vscode from 'vscode';
import { GridViewerPanel } from './gridViewerPanel';
import { FORMAT_MAP, getFileExtension } from './utils';
import { registerSyntaxHighlight } from './syntaxHighlight';

export function activate(context: vscode.ExtensionContext) {
  registerSyntaxHighlight(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('molViewer.open', (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
      openViewer(context, uri, allUris, vscode.ViewColumn.Active);
    }),

    vscode.commands.registerCommand('molViewer.openToSide', (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
      openViewer(context, uri, allUris, vscode.ViewColumn.Beside);
    }),

    vscode.commands.registerCommand('molViewer.openRecursive', (uri?: vscode.Uri) => {
      openViewer(context, uri, undefined, vscode.ViewColumn.Active, true);
    })
  );
}

async function openViewer(
  context: vscode.ExtensionContext,
  uri: vscode.Uri | undefined,
  allUris: vscode.Uri[] | undefined,
  column: vscode.ViewColumn,
  recursive = false
) {
  const supportedExts = Object.keys(FORMAT_MAP);

  // Determine input URIs
  let inputUris: vscode.Uri[];
  if (allUris && allUris.length > 1) {
    inputUris = allUris;
  } else if (uri) {
    inputUris = [uri];
  } else if (vscode.window.activeTextEditor) {
    inputUris = [vscode.window.activeTextEditor.document.uri];
  } else {
    // No file context — open empty viewer, user can add files via Open button
    GridViewerPanel.create(context.extensionUri, [], column);
    return;
  }

  // Collect molecular files from URIs (files + folders)
  const molFiles: { uri: vscode.Uri; ext: string }[] = [];

  async function scanDirectory(dirUri: vscode.Uri, recurse: boolean) {
    const entries = await vscode.workspace.fs.readDirectory(dirUri);
    const subDirs: vscode.Uri[] = [];
    for (const [name, type] of entries) {
      if (type === vscode.FileType.File) {
        const ext = getFileExtension(name);
        if (supportedExts.includes(ext)) {
          molFiles.push({ uri: vscode.Uri.joinPath(dirUri, name), ext });
        }
      } else if (type === vscode.FileType.Directory && recurse) {
        subDirs.push(vscode.Uri.joinPath(dirUri, name));
      }
    }
    if (subDirs.length > 0) {
      await Promise.all(subDirs.map(d => scanDirectory(d, true)));
    }
  }

  for (const u of inputUris) {
    let stat: vscode.FileStat;
    try {
      stat = await vscode.workspace.fs.stat(u);
    } catch {
      continue;
    }

    if (stat.type === vscode.FileType.Directory) {
      await scanDirectory(u, recursive);
    } else {
      const ext = getFileExtension(u.fsPath);
      if (supportedExts.includes(ext)) {
        molFiles.push({ uri: u, ext });
      }
    }
  }

  if (molFiles.length === 0) {
    vscode.window.showInformationMessage('No supported molecular files found.');
    return;
  }

  // For recursive scans, show confirmation with file count
  if (recursive) {
    const dirCount = new Set(molFiles.map((f) => f.uri.path.substring(0, f.uri.path.lastIndexOf('/')))).size;
    const answer = await vscode.window.showInformationMessage(
      `Found ${molFiles.length} molecular files in ${dirCount} ${dirCount === 1 ? 'directory' : 'directories'}. Open?`,
      { modal: true },
      'Open'
    );
    if (answer !== 'Open') { return; }
  }

  // Send only metadata (no file contents) — data is loaded lazily on demand
  // For recursive scans, use relative path as fileName so duplicates are distinguishable
  const rootPath = recursive && uri ? uri.path + '/' : '';
  const fileMeta = molFiles.map((f) => ({
    format: FORMAT_MAP[f.ext],
    fileName: recursive && rootPath && f.uri.path.startsWith(rootPath)
      ? f.uri.path.substring(rootPath.length)
      : f.uri.path.split('/').pop() || '',
    uri: f.uri.toString(),
  }));

  GridViewerPanel.create(context.extensionUri, fileMeta, column);
}

export function deactivate() {}
