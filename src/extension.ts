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
    })
  );
}

async function openViewer(
  context: vscode.ExtensionContext,
  uri: vscode.Uri | undefined,
  allUris: vscode.Uri[] | undefined,
  column: vscode.ViewColumn
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

  for (const u of inputUris) {
    let stat: vscode.FileStat;
    try {
      stat = await vscode.workspace.fs.stat(u);
    } catch {
      continue;
    }

    if (stat.type === vscode.FileType.Directory) {
      // Scan one level for supported files
      const entries = await vscode.workspace.fs.readDirectory(u);
      for (const [name, type] of entries) {
        if (type !== vscode.FileType.File) { continue; }
        const ext = getFileExtension(name);
        if (supportedExts.includes(ext)) {
          molFiles.push({ uri: vscode.Uri.joinPath(u, name), ext });
        }
      }
    } else {
      // Single file — check extension
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

  // Read file contents (with progress indicator for multiple files)
  const files: { data: string; format: string; fileName: string; uri: string }[] = [];

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Loading molecular files...' },
    async () => {
      const results = await Promise.all(
        molFiles.map(async (f) => {
          const data = await readFileContent(f.uri);
          if (!data) { return null; }
          const format = FORMAT_MAP[f.ext];
          const fileName = f.uri.path.split('/').pop() || '';
          return { data, format, fileName, uri: f.uri.toString() };
        })
      );
      for (const r of results) {
        if (r) { files.push(r); }
      }
    }
  );

  if (files.length === 0) {
    vscode.window.showErrorMessage('Failed to read molecular files.');
    return;
  }

  GridViewerPanel.create(context.extensionUri, files, column);
}

async function readFileContent(uri: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString('utf-8');
  } catch {
    vscode.window.showErrorMessage(`Failed to read file: ${uri.fsPath}`);
    return undefined;
  }
}

export function deactivate() {}
