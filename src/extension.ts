import * as vscode from 'vscode';
import { MolViewerPanel } from './molViewerPanel';
import { extToFormat } from './utils';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('molViewer.preview', (uri?: vscode.Uri) => {
      openPreview(context, uri, vscode.ViewColumn.Active);
    }),

    vscode.commands.registerCommand('molViewer.previewToSide', (uri?: vscode.Uri) => {
      openPreview(context, uri, vscode.ViewColumn.Beside);
    }),

    vscode.commands.registerCommand('molViewer.addToViewer', (uri?: vscode.Uri) => {
      addToViewer(context, uri);
    })
  );
}

async function openPreview(context: vscode.ExtensionContext, uri: vscode.Uri | undefined, column: vscode.ViewColumn) {
  const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
  if (!fileUri) {
    vscode.window.showErrorMessage('No file selected.');
    return;
  }

  const format = extToFormat(fileUri.fsPath);
  if (!format) {
    vscode.window.showErrorMessage('Unsupported file format.');
    return;
  }

  const data = await readFileContent(fileUri);
  if (!data) { return; }

  const panel = MolViewerPanel.createOrShow(context.extensionUri, column);
  const fileName = vscode.workspace.asRelativePath(fileUri);
  panel.addMolecule(data, format, fileName);
}

async function addToViewer(context: vscode.ExtensionContext, uri?: vscode.Uri) {
  const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
  if (!fileUri) {
    vscode.window.showErrorMessage('No file selected.');
    return;
  }

  const format = extToFormat(fileUri.fsPath);
  if (!format) {
    vscode.window.showErrorMessage('Unsupported file format.');
    return;
  }

  const panel = MolViewerPanel.getActivePanel();
  if (!panel) {
    vscode.window.showErrorMessage('No active Mol Viewer panel. Open a preview first.');
    return;
  }

  const data = await readFileContent(fileUri);
  if (!data) { return; }

  const fileName = vscode.workspace.asRelativePath(fileUri);
  panel.addMolecule(data, format, fileName);
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
