import * as vscode from 'vscode';
import { getNonce, FORMAT_MAP, getFileExtension } from './utils';

interface GridFile {
  data?: string;
  format: string;
  fileName: string;
  uri: string;
}

export class GridViewerPanel {
  public static readonly viewType = 'molViewer.gridView';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _files: GridFile[];
  private _disposables: vscode.Disposable[] = [];

  public static create(
    extensionUri: vscode.Uri,
    files: GridFile[],
    column: vscode.ViewColumn = vscode.ViewColumn.Active
  ): GridViewerPanel {
    const panel = vscode.window.createWebviewPanel(
      GridViewerPanel.viewType,
      'Molstar Viewer',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
          vscode.Uri.joinPath(extensionUri, 'src', 'webview'),
        ],
      }
    );

    return new GridViewerPanel(panel, extensionUri, files);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    files: GridFile[]
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._files = files;

    this._panel.webview.html = this._getHtmlForWebview();

    this._panel.webview.onDidReceiveMessage(
      async (msg) => {
        if (msg.type === 'ready') {
          this._panel.webview.postMessage({
            type: 'loadFiles',
            files: this._files,
          });
        } else if (msg.type === 'open') {
          this._handleOpen();
        } else if (msg.type === 'requestFileData') {
          await this._handleRequestFileData(msg.uri);
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this._dispose(), null, this._disposables);
  }

  private async _handleRequestFileData(uriStr: string) {
    try {
      const uri = vscode.Uri.parse(uriStr);
      const bytes = await vscode.workspace.fs.readFile(uri);
      const data = Buffer.from(bytes).toString('utf-8');
      this._panel.webview.postMessage({
        type: 'fileData',
        uri: uriStr,
        data,
      });
    } catch {
      this._panel.webview.postMessage({
        type: 'fileData',
        uri: uriStr,
        data: null,
      });
    }
  }

  private async _handleOpen() {
    const supportedExts = Object.keys(FORMAT_MAP);
    const filters: Record<string, string[]> = {
      'Molecular Files': supportedExts.map(e => e.slice(1)),
    };

    const uris = await vscode.window.showOpenDialog({
      canSelectMany: true,
      canSelectFiles: true,
      canSelectFolders: true,
      filters,
      openLabel: 'Open',
    });

    if (!uris || uris.length === 0) { return; }

    this._panel.webview.postMessage({ type: 'loading', loading: true });

    // Resolve folders to individual files, collect metadata only
    const newFiles: GridFile[] = [];
    for (const u of uris) {
      let stat: vscode.FileStat;
      try { stat = await vscode.workspace.fs.stat(u); } catch { continue; }

      if (stat.type === vscode.FileType.Directory) {
        const entries = await vscode.workspace.fs.readDirectory(u);
        for (const [name, type] of entries) {
          if (type !== vscode.FileType.File) { continue; }
          const ext = getFileExtension(name);
          if (supportedExts.includes(ext)) {
            newFiles.push({
              format: FORMAT_MAP[ext],
              fileName: name,
              uri: vscode.Uri.joinPath(u, name).toString(),
            });
          }
        }
      } else {
        const ext = getFileExtension(u.fsPath);
        if (supportedExts.includes(ext)) {
          newFiles.push({
            format: FORMAT_MAP[ext],
            fileName: u.path.split('/').pop() || '',
            uri: u.toString(),
          });
        }
      }
    }

    this._panel.webview.postMessage({ type: 'loading', loading: false });
    if (newFiles.length === 0) { return; }

    this._files.push(...newFiles);
    this._panel.webview.postMessage({
      type: 'addFiles',
      files: newFiles,
    });
  }

  private _dispose() {
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      d?.dispose();
    }
  }

  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const nonce = getNonce();

    const molstarJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'molstar.js')
    );
    const molstarCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'molstar.css')
    );
    const gridJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'grid.js')
    );
    const gridCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'grid.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' 'unsafe-eval'; worker-src blob:; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data: blob:; font-src ${webview.cspSource} data:; connect-src ${webview.cspSource} blob: data:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${molstarCssUri}">
  <link rel="stylesheet" href="${gridCssUri}">
  <title>Molstar Viewer</title>
</head>
<body>
  <script nonce="${nonce}" src="${molstarJsUri}"></script>
  <script nonce="${nonce}" src="${gridJsUri}"></script>
</body>
</html>`;
  }
}
