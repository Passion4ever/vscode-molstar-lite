import { state, cardId, MOLSTAR_CONFIG, FULL_VIEWER_CONFIG } from './state.js';
import { hideAxes, applyCurrentColorTheme, applyCanvasStyle, applyRepresentationTypeTo, hideBuiltinSections } from './molstar-utils.js';
import { revokeScreenshot, updateCardImage } from './utils.js';

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

  const canvas = state.viewerOverlay.querySelector('canvas');
  if (canvas) {
    try {
      const idx = state.activeCardIndex;
      canvas.toBlob(function (blob) {
        if (!blob) return;
        revokeScreenshot(idx);
        const url = URL.createObjectURL(blob);
        state.screenshots[idx] = url;
        updateCardImage(idx, url);
      }, 'image/png');
    } catch (e) { /* ignore */ }
  }

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

  state.viewer.plugin.clear().then(function () {
    return state.viewer.loadStructureFromData(file.data, file.format, false, {
      dataLabel: file.fileName,
    });
  }).then(function () {
    if (state.settings.displayMode !== 'default') {
      return applyRepresentationTypeTo(state.viewer, state.settings.displayMode);
    }
  }).then(function () {
    applyCurrentColorTheme(state.viewer);
  }).catch(function (err) {
    console.warn('Failed to load structure:', err);
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
      state.fullViewerSectionObserver = hideBuiltinSections(document.getElementById('full-viewer'));
      if (saved) {
        state.fullViewer.plugin.state.setSnapshot(saved);
      } else {
        loadInFullViewer(file);
      }
    });
  } else if (saved) {
    state.fullViewer.plugin.state.setSnapshot(saved);
  } else {
    loadInFullViewer(file);
  }
}

function loadInFullViewer(file) {
  state.fullViewer.plugin.clear().then(function () {
    return state.fullViewer.loadStructureFromData(file.data, file.format, false, {
      dataLabel: file.fileName,
    });
  }).catch(function (err) {
    console.warn('Failed to load in full viewer:', err);
  });
}

export function closeFullViewer() {
  if (state.fullViewer && state.fullViewerIndex >= 0) {
    try {
      state.fullViewerSnapshots[state.fullViewerIndex] = state.fullViewer.plugin.state.getSnapshot({
        data: true,
        camera: true,
        canvas3d: true,
        componentManager: true,
        cameraTransition: 'instant',
      });
    } catch (e) { /* ignore */ }
  }

  state.fullViewerOverlay.style.display = 'none';
  document.getElementById('grid-toolbar').style.display = '';
  state.gridWrapper.style.display = '';
  state.fullViewerIndex = -1;
}
