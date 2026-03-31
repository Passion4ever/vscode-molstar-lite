import { state, cardId, MOLSTAR_CONFIG, FULL_VIEWER_CONFIG } from './state.js';
import { hideAxes, applyCurrentColorTheme, applyCanvasStyle, applyRepresentationTypeTo } from './molstar-utils.js';
import { takeScreenshotFrom } from './utils.js';
import { requestFileData } from './data-loader.js';

// ────────────────── Interactive viewer (card overlay) ──────────────────

export function activateCard(index) {
  if (state.activeCardIndex >= 0) {
    deactivateCard();
  }

  state.activeCardIndex = index;
  const card = document.getElementById(cardId(index));
  if (!card) return;
  card.classList.add('active');

  positionViewerOnCard(index);
  state.viewerOverlay.style.display = 'block';

  if (!state.viewer) {
    molstar.Viewer.create('active-viewer', MOLSTAR_CONFIG).then(function (v) {
      state.viewer = v;
      hideAxes(v);
      if (state.activeCardIndex === index) {
        loadStructureInViewer(index);
      }
    });
  } else {
    loadStructureInViewer(index);
  }
}

export function deactivateCard() {
  if (state.activeCardIndex < 0) return;

  takeScreenshotFrom(state.viewerOverlay, state.activeCardIndex);

  const card = document.getElementById(cardId(state.activeCardIndex));
  if (card) card.classList.remove('active');

  state.viewerOverlay.style.display = 'none';
  state.activeCardIndex = -1;
}

export function positionViewerOnCard(index) {
  const card = document.getElementById(cardId(index));
  if (!card) return;
  const imgArea = card.querySelector('.card-img-area');
  if (!imgArea) return;

  const wrapperRect = state.gridWrapper.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  state.viewerOverlay.style.left = (cardRect.left - wrapperRect.left + state.gridWrapper.scrollLeft) + 'px';
  state.viewerOverlay.style.top = (cardRect.top - wrapperRect.top + state.gridWrapper.scrollTop) + 'px';
  state.viewerOverlay.style.width = cardRect.width + 'px';
  state.viewerOverlay.style.height = imgArea.getBoundingClientRect().height + 'px';

  if (state.viewer) {
    setTimeout(function () {
      try { state.viewer.handleResize(); } catch (e) { /* ignore */ }
    }, 50);
  }
}

export function loadStructureInViewer(index) {
  if (!state.viewer) return;
  const file = state.files[index];
  if (!file) return;

  applyCanvasStyle(state.viewer);

  requestFileData(index).then(function (data) {
    if (!data || state.activeCardIndex !== index) return;
    state.viewer.plugin.clear().then(function () {
      if (state.activeCardIndex !== index) return;
      return state.viewer.loadStructureFromData(data, file.format, false, {
        dataLabel: file.fileName,
      });
    }).then(function () {
      if (state.activeCardIndex !== index) return;
      if (state.settings.displayMode !== 'default') {
        return applyRepresentationTypeTo(state.viewer, state.settings.displayMode);
      }
    }).then(function () {
      if (state.activeCardIndex !== index) return;
      applyCurrentColorTheme(state.viewer);
    }).catch(function (err) {
      console.warn('Failed to load structure:', err);
    });
  });
}

// ────────────────── Full viewer (in-panel) ──────────────────

export function openFullViewer(index) {
  const file = state.files[index];
  if (!file) return;
  state.fullViewerIndex = index;

  state.fullViewerOverlay.style.display = 'flex';
  document.getElementById('grid-toolbar').style.display = 'none';
  state.gridWrapper.style.display = 'none';

  const title = document.getElementById('full-viewer-title');
  if (title) title.textContent = file.fileName;

  const saved = state.fullViewerSnapshots[index];

  if (!state.fullViewer) {
    molstar.Viewer.create('full-viewer', FULL_VIEWER_CONFIG).then(function (v) {
      state.fullViewer = v;
      if (saved) {
        state.fullViewer.plugin.state.setSnapshot(saved);
      } else {
        loadInFullViewer(index);
      }
    });
  } else if (saved) {
    state.fullViewer.plugin.state.setSnapshot(saved);
  } else {
    loadInFullViewer(index);
  }
}

function loadInFullViewer(index) {
  const file = state.files[index];
  if (!file) return;
  requestFileData(index).then(function (data) {
    if (!data || state.fullViewerIndex !== index) return;
    state.fullViewer.plugin.clear().then(function () {
      if (state.fullViewerIndex !== index) return;
      return state.fullViewer.loadStructureFromData(data, file.format, false, {
        dataLabel: file.fileName,
      });
    }).catch(function (err) {
      console.warn('Failed to load in full viewer:', err);
    });
  });
}

function saveCurrentSnapshot() {
  if (!state.fullViewer || state.fullViewerIndex < 0) return;
  try {
    state.fullViewerSnapshots[state.fullViewerIndex] = state.fullViewer.plugin.state.getSnapshot({
      data: true, camera: true, canvas3d: true, componentManager: true, cameraTransition: 'instant',
    });

    // Evict oldest snapshots to cap memory (keep at most 10)
    var keys = Object.keys(state.fullViewerSnapshots);
    while (keys.length > 10) {
      delete state.fullViewerSnapshots[keys.shift()];
    }
  } catch (e) {
    console.warn('Failed to save viewer snapshot:', e);
  }
}

export function navigateFullViewer(delta) {
  if (state.fullViewerIndex < 0) return;

  saveCurrentSnapshot();

  // Find next visible file in the given direction
  var newIndex = state.fullViewerIndex + delta;
  while (newIndex >= 0 && newIndex < state.files.length) {
    var card = document.getElementById(cardId(newIndex));
    if (card && card.style.display !== 'none') break;
    newIndex += delta;
  }
  if (newIndex < 0 || newIndex >= state.files.length) return;

  openFullViewer(newIndex);
}

export function closeFullViewer() {
  saveCurrentSnapshot();

  state.fullViewerOverlay.style.display = 'none';
  document.getElementById('grid-toolbar').style.display = '';
  state.gridWrapper.style.display = '';
  state.fullViewerIndex = -1;
}
