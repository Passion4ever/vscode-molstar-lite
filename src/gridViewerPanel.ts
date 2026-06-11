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

  // Single reused panel: each panel holds up to 4 WebGL contexts (2 thumbnail
  // workers + card viewer + full viewer), and Chromium caps contexts per page
  // process — multiple live panels would force-lose contexts (black canvas).
  private static _current: GridViewerPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _files: GridFile[];
  private _disposables: vscode.Disposable[] = [];

  public static create(
    extensionUri: vscode.Uri,
    files: GridFile[],
    column: vscode.ViewColumn = vscode.ViewColumn.Active
  ): GridViewerPanel {
    if (GridViewerPanel._current) {
      const existing = GridViewerPanel._current;
      existing._panel.reveal();
      existing._addFiles(files);
      return existing;
    }

    const panel = vscode.window.createWebviewPanel(
      GridViewerPanel.viewType,
      'Molstar Lite',
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

    GridViewerPanel._current = new GridViewerPanel(panel, extensionUri, files);
    return GridViewerPanel._current;
  }

  private _addFiles(files: GridFile[]) {
    const existing = new Set(this._files.map((f) => f.uri));
    const newFiles = files.filter((f) => !existing.has(f.uri));
    if (newFiles.length === 0) { return; }
    this._files.push(...newFiles);
    this._panel.webview.postMessage({
      type: 'addFiles',
      files: newFiles,
    });
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
        } else if (msg.type === 'syncFiles') {
          // Webview-side deletions/undo: mirror its file list so _addFiles
          // dedup doesn't treat deleted files as still present.
          this._files = msg.files;
        } else if (msg.type === 'benchmark') {
          GridViewerPanel._benchChannel().appendLine(
            `${new Date().toISOString()} ${msg.text}`
          );
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this._dispose(), null, this._disposables);
  }

  private static _bench: vscode.OutputChannel | undefined;

  private static _benchChannel(): vscode.OutputChannel {
    if (!GridViewerPanel._bench) {
      GridViewerPanel._bench = vscode.window.createOutputChannel(
        'Molstar Lite Benchmark'
      );
      // The channel doesn't exist in the Output dropdown until first use;
      // reveal it (without stealing focus) so results are discoverable.
      GridViewerPanel._bench.show(true);
    }
    return GridViewerPanel._bench;
  }

  // Reading an entire file into a string and posting it to the webview; very
  // large files (e.g. MD trajectories) would freeze or OOM the extension host.
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024;

  private async _handleRequestFileData(uriStr: string) {
    try {
      const uri = vscode.Uri.parse(uriStr);
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.size > GridViewerPanel.MAX_FILE_SIZE) {
        const fileName = uriStr.split('/').pop() || uriStr;
        const sizeMb = (stat.size / 1024 / 1024).toFixed(1);
        vscode.window.showWarningMessage(
          `Molstar Lite: ${fileName} is too large to display (${sizeMb} MB, limit 50 MB).`
        );
        this._panel.webview.postMessage({
          type: 'fileData',
          uri: uriStr,
          data: null,
        });
        return;
      }
      const bytes = await vscode.workspace.fs.readFile(uri);
      const data = Buffer.from(bytes).toString('utf-8');
      this._panel.webview.postMessage({
        type: 'fileData',
        uri: uriStr,
        data,
      });
    } catch (err) {
      const fileName = uriStr.split('/').pop() || uriStr;
      const reason = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Molstar Lite: failed to load ${fileName} — ${reason}`);
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

    this._addFiles(newFiles);
  }

  private _dispose() {
    if (GridViewerPanel._current === this) {
      GridViewerPanel._current = undefined;
    }
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
  <title>Molstar Lite</title>
</head>
<body>
  <script nonce="${nonce}" src="${molstarJsUri}"></script>
  <script nonce="${nonce}" src="${gridJsUri}"></script>
</body>
</html>`;
  }
}
