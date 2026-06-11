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

// ── Thumbnail disk cache lookups ──
// Same pattern as requestFileData: dedup in-flight requests, resolve null on
// timeout so a lost reply degrades to a normal render instead of a stall.

const pendingThumbs = {};
// Replies that arrived before their consumer asked (prefetch). Held for one
// render pass only — cleared at the next pass start and after pass completion
// — so a prefetched reply isn't re-requested (and re-read from disk) when the
// worker reaches that card moments later.
let thumbResults = {};
const THUMB_TIMEOUT_MS = 3000;

export function clearThumbResults() {
  thumbResults = {};
}

export function requestThumb(index, appearance) {
  const file = state.files[index];
  if (!file) return Promise.resolve(null);

  const key = file.uri + '|' + appearance;
  if (key in thumbResults) return Promise.resolve(thumbResults[key]);
  if (pendingThumbs[key]) return pendingThumbs[key].promise;

  const entry = {};
  entry.promise = new Promise(function (resolve) {
    entry.resolve = resolve;
  });
  entry.timer = setTimeout(function () {
    if (pendingThumbs[key] === entry) {
      delete pendingThumbs[key];
      entry.resolve(null);
    }
  }, THUMB_TIMEOUT_MS);
  pendingThumbs[key] = entry;
  vscode.postMessage({ type: 'requestThumb', uri: file.uri, appearance: appearance });

  return entry.promise;
}

export function handleThumbData(uri, appearance, dataUrl) {
  const key = uri + '|' + appearance;
  const entry = pendingThumbs[key];
  if (entry) {
    clearTimeout(entry.timer);
    delete pendingThumbs[key];
    thumbResults[key] = dataUrl || null;
    entry.resolve(dataUrl || null);
  }
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
