import * as vscode from 'vscode';
import { getNonce } from './utils';

export class MolViewerPanel {
  public static readonly viewType = 'molViewer.preview';
  private static _panels: Set<MolViewerPanel> = new Set();

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _ready = false;
  private _pendingMessages: Array<{ type: string; data: string; format: string; fileName: string }> = [];

  public static createOrShow(extensionUri: vscode.Uri, column?: vscode.ViewColumn): MolViewerPanel {
    const panel = vscode.window.createWebviewPanel(
      MolViewerPanel.viewType,
      'Mol Viewer',
      column || vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
          vscode.Uri.joinPath(extensionUri, 'src', 'webview'),
        ],
      }
    );

    const molPanel = new MolViewerPanel(panel, extensionUri);
    return molPanel;
  }

  public static getActivePanel(): MolViewerPanel | undefined {
    for (const p of MolViewerPanel._panels) {
      if (p._panel.visible) {
        return p;
      }
    }
    const first = MolViewerPanel._panels.values().next();
    return first.done ? undefined : first.value;
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._panel.webview.html = this._getHtmlForWebview();

    MolViewerPanel._panels.add(this);
    this._updateContext();

    this._panel.webview.onDidReceiveMessage(
      (msg) => {
        if (msg.type === 'ready') {
          this._ready = true;
          for (const m of this._pendingMessages) {
            this._panel.webview.postMessage(m);
          }
          this._pendingMessages = [];
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.onDidChangeViewState(() => this._updateContext(), null, this._disposables);
  }

  public addMolecule(data: string, format: string, fileName: string) {
    const msg = { type: 'addMolecule', data, format, fileName };
    if (this._ready) {
      this._panel.webview.postMessage(msg);
    } else {
      this._pendingMessages.push(msg);
    }
    this._panel.reveal();
  }

  public dispose() {
    MolViewerPanel._panels.delete(this);
    this._updateContext();

    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      d?.dispose();
    }
  }

  private _updateContext() {
    vscode.commands.executeCommand('setContext', 'molViewer.hasActivePanel', MolViewerPanel._panels.size > 0);
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
    const viewerJsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'viewer.js')
    );
    const viewerCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'viewer.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' 'unsafe-eval'; worker-src blob:; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data: blob:; font-src ${webview.cspSource} data:; connect-src ${webview.cspSource} blob: data:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${molstarCssUri}">
  <link rel="stylesheet" href="${viewerCssUri}">
  <title>Mol Viewer</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${molstarJsUri}"></script>
  <script nonce="${nonce}" src="${viewerJsUri}"></script>
</body>
</html>`;
  }
}
