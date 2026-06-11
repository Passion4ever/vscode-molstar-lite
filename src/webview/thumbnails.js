import { state, vscode, MOLSTAR_CONFIG, THUMB_WORKER_COUNT } from './state.js';
import { hideAxes, applyCurrentColorTheme, applyCanvasStyle, applyRepresentationTypeTo, resetCameraOf } from './molstar-utils.js';
import { takeScreenshotFrom, updateCardImage, revokeScreenshot, markCardFailed, waitForRender } from './utils.js';
import { requestFileData, requestThumb, clearThumbResults } from './data-loader.js';

export function initThumbViewer(onReady) {
  const creates = [];
  for (let i = 0; i < THUMB_WORKER_COUNT; i++) {
    const id = 'thumb-viewer-' + i;
    creates.push(
      molstar.Viewer.create(id, MOLSTAR_CONFIG).then(function (v) {
        hideAxes(v);
        try {
          v.plugin.managers.structure.component.setOptions({ visualQuality: 'low' });
        } catch (e) { /* ignore */ }
        applyCanvasStyle(v);
        return { viewer: v, container: document.getElementById(id), busy: false };
      })
    );
  }
  Promise.all(creates).then(function (workers) {
    state.thumbWorkers = workers;
    setTimeout(function () {
      doReRenderAllThumbnails();
      if (onReady) onReady();
    }, 100);
  });
}

let reRenderTimer = null;

export function reRenderAllThumbnails() {
  if (reRenderTimer) clearTimeout(reRenderTimer);
  reRenderTimer = setTimeout(doReRenderAllThumbnails, 200);
}

function doReRenderAllThumbnails() {
  reRenderTimer = null;
  state.reRenderGen++;
  state.needsRender.clear();
  clearThumbResults();

  const visibleQueue = [];
  state.files.forEach(function (_, i) {
    if (state.visibleCards.has(i)) {
      visibleQueue.push(i);
    } else {
      state.needsRender.add(i);
    }
  });
  state.reRenderQueue = visibleQueue;
  state.bench = visibleQueue.length > 0
    ? { gen: state.reRenderGen, start: performance.now(), first: 0, count: 0 }
    : null;

  if (state.thumbWorkers.length > 0) {
    state.thumbWorkers.forEach(function (w) { applyCanvasStyle(w.viewer); });
    startWorkers();
  }
}

// Wake any idle workers to drain the queue. Used both to kick off a render pass
// and by the IntersectionObserver when a lazily-revealed card needs rendering.
export function nudgeThumbnails() {
  startWorkers();
}

function startWorkers() {
  state.thumbWorkers.forEach(function (w) {
    if (!w.busy && state.reRenderQueue.length > 0) {
      w.busy = true;
      state.activeWorkers++;
      pumpWorker(w);
    }
  });
}

// One worker's render loop: pull an index, render it on this worker's own
// viewer, screenshot, then pull the next. Each worker stays strictly serial on
// its own viewer (the next render only starts after the current one fully
// settles), so a stale-gen render finishes cleanly before the new pass reuses
// the viewer.
function pumpWorker(worker) {
  const gen = state.reRenderGen;

  if (state.reRenderQueue.length === 0) {
    worker.busy = false;
    state.activeWorkers--;
    if (state.activeWorkers <= 0) {
      state.activeWorkers = 0;
      reportBench();
      // Batch-evict file data after the whole pass completes.
      evictCachedData();
    }
    return;
  }

  const index = state.reRenderQueue.shift();
  const file = state.files[index];
  if (!file) { pumpWorker(worker); return; }

  const appearance = currentAppearance();

  // Prefetch upcoming items to hide IPC latency: cache lookup first, file
  // data only on a miss (a cache hit never needs the file contents).
  const PREFETCH = 6;
  for (let i = 0; i < Math.min(PREFETCH, state.reRenderQueue.length); i++) {
    prefetchItem(state.reRenderQueue[i], appearance);
  }

  const v = worker.viewer;
  const stale = function () { return gen !== state.reRenderGen; };

  requestThumb(index, appearance).then(function (cached) {
    if (cached) {
      if (!stale()) {
        revokeScreenshot(index);
        state.screenshots[index] = cached;
        updateCardImage(index, cached);
        benchTick(gen);
      }
      pumpWorker(worker);
      return;
    }
    requestFileData(index).then(function (data) {
      if (!data) { markCardFailed(index); pumpWorker(worker); return; }
      v.plugin.clear().then(function () {
        return v.loadStructureFromData(data, file.format, false, {
          dataLabel: file.fileName,
        });
      }).then(function () {
        if (state.settings.displayMode !== 'default') {
          return applyRepresentationTypeTo(v, state.settings.displayMode);
        }
      }).then(function () {
        return applyCurrentColorTheme(v);
      }).then(function () {
        return resetCameraOf(v);
      }).then(function () {
        return waitForRender(v);
      }).then(function () {
        // Only commit the screenshot if the settings (gen) haven't changed under
        // us; otherwise this render used stale settings — drop it and let the new
        // pass re-render this index.
        if (!stale()) {
          takeScreenshotFrom(worker.container, index, {
            uri: file.uri,
            appearance: appearance,
          });
          benchTick(gen);
        }
        pumpWorker(worker);
      }).catch(function (err) {
        console.warn('Failed to render thumbnail for', file.fileName, err);
        if (!stale()) markCardFailed(index);
        pumpWorker(worker);
      });
    });
  });
}

// The disk-cache key includes every setting that changes how a thumbnail
// looks; switching a setting back to a previously rendered combination is a
// cache hit.
function currentAppearance() {
  return state.settings.colorTheme + '|' + state.settings.displayMode + '|' + state.settings.style;
}

function prefetchItem(index, appearance) {
  requestThumb(index, appearance).then(function (cached) {
    if (!cached) requestFileData(index);
  });
}

function benchTick(gen) {
  if (state.bench && state.bench.gen === gen) {
    state.bench.count++;
    if (!state.bench.first) {
      state.bench.first = performance.now() - state.bench.start;
    }
  }
}

function evictCachedData() {
  state.files.forEach(function (f) { f.data = null; });
  clearThumbResults();
}

// Report the completed pass's timing to the extension host (logged to the
// "Molstar Lite Benchmark" output channel) so optimizations can be measured
// against a fixed test set. Dropped if the settings changed mid-pass.
function reportBench() {
  const b = state.bench;
  state.bench = null;
  if (!b || b.gen !== state.reRenderGen || b.count === 0) return;
  const total = Math.round(performance.now() - b.start);
  vscode.postMessage({
    type: 'benchmark',
    text: 'thumbnails=' + b.count + ' first=' + Math.round(b.first) + 'ms total=' + total + 'ms',
  });
}
