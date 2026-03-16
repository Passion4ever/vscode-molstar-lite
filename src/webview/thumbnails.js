import { state, MOLSTAR_CONFIG } from './state.js';
import { hideAxes, applyCurrentColorTheme, applyCanvasStyle, applyRepresentationTypeTo, resetCameraOf } from './molstar-utils.js';
import { takeScreenshotFrom, markCardFailed, waitForRender } from './utils.js';

export function initThumbViewer(onReady) {
  molstar.Viewer.create('thumb-viewer', MOLSTAR_CONFIG).then(function (v) {
    state.thumbViewer = v;
    hideAxes(v);
    try {
      v.plugin.managers.structure.component.setOptions({
        visualQuality: 'low',
      });
    } catch (e) { /* ignore */ }
    applyCanvasStyle(v);
    setTimeout(function () {
      reRenderAllThumbnails();
      if (onReady) onReady();
    }, 100);
  });
}

export function reRenderAllThumbnails() {
  state.reRenderGen++;
  state.needsRender.clear();

  const visibleQueue = [];
  state.files.forEach(function (_, i) {
    if (state.visibleCards.has(i)) {
      visibleQueue.push(i);
    } else {
      state.needsRender.add(i);
    }
  });
  state.reRenderQueue = visibleQueue;

  if (state.thumbViewer) {
    state.isReRendering = false;
    applyCanvasStyle(state.thumbViewer);
    processReRenderQueue(state.reRenderGen);
  }
}

export function processReRenderQueue(gen) {
  if (gen !== state.reRenderGen) return;
  if (state.reRenderQueue.length === 0) {
    state.isReRendering = false;
    return;
  }

  state.isReRendering = true;
  const index = state.reRenderQueue.shift();
  const file = state.files[index];

  if (!file) {
    processReRenderQueue(gen);
    return;
  }

  state.thumbViewer.plugin.clear().then(function () {
    if (gen !== state.reRenderGen) return;
    return state.thumbViewer.loadStructureFromData(file.data, file.format, false, {
      dataLabel: file.fileName,
    });
  }).then(function () {
    if (gen !== state.reRenderGen) return;
    if (state.settings.displayMode !== 'default') {
      return applyRepresentationTypeTo(state.thumbViewer, state.settings.displayMode);
    }
  }).then(function () {
    if (gen !== state.reRenderGen) return;
    applyCurrentColorTheme(state.thumbViewer);
    return resetCameraOf(state.thumbViewer);
  }).then(function () {
    if (gen !== state.reRenderGen) return;
    return waitForRender();
  }).then(function () {
    if (gen !== state.reRenderGen) { state.isReRendering = false; return; }
    takeScreenshotFrom(state.thumbRenderer, index);
    processReRenderQueue(gen);
  }).catch(function (err) {
    if (gen !== state.reRenderGen) { state.isReRendering = false; return; }
    console.warn('Failed to render thumbnail for', file.fileName, err);
    markCardFailed(index);
    processReRenderQueue(gen);
  });
}
