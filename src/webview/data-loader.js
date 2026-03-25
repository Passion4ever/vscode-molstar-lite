import { state, vscode } from './state.js';

const pending = {};

export function requestFileData(index) {
  const file = state.files[index];
  if (!file) return Promise.resolve(null);
  if (file.data) return Promise.resolve(file.data);

  const uri = file.uri;
  if (pending[uri]) return pending[uri].promise;

  const entry = {};
  entry.promise = new Promise(function (resolve) {
    entry.resolve = resolve;
  });
  pending[uri] = entry;
  vscode.postMessage({ type: 'requestFileData', uri: uri });

  return entry.promise;
}

export function handleFileData(uri, data) {
  const entry = pending[uri];
  if (entry) {
    delete pending[uri];
    if (data) {
      // Match by URI (index may shift after card deletion)
      for (let i = 0; i < state.files.length; i++) {
        if (state.files[i].uri === uri) { state.files[i].data = data; break; }
      }
    }
    entry.resolve(data);
  }
}
