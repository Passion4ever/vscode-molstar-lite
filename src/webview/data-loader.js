import { state, vscode } from './state.js';

const pending = {};

// If the extension host never replies (lost message, disposed panel), resolve
// null so the thumbnail worker loop doesn't stall forever, and clear the
// pending entry so a later pass can retry.
const REQUEST_TIMEOUT_MS = 10000;

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
  entry.timer = setTimeout(function () {
    if (pending[uri] === entry) {
      delete pending[uri];
      entry.resolve(null);
    }
  }, REQUEST_TIMEOUT_MS);
  pending[uri] = entry;
  vscode.postMessage({ type: 'requestFileData', uri: uri });

  return entry.promise;
}

export function handleFileData(uri, data) {
  const entry = pending[uri];
  if (entry) {
    clearTimeout(entry.timer);
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
