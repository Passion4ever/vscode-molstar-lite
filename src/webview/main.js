import { state, vscode, cardId, MOLSTAR_CONFIG } from './state.js';
import { hideAxes, applyCurrentColorTheme } from './molstar-utils.js';
import { createToolbar, updateFileCount, populateFormatFilter, applySortAndFilter } from './toolbar.js';
import { createCards, createCardsFromIndex, renderNewThumbnails, toggleSelectMode, deleteSelectedCards, undoDelete, updateDeleteButton } from './cards.js';
import { initThumbViewer, reRenderAllThumbnails, processReRenderQueue } from './thumbnails.js';
import { activateCard, deactivateCard, positionViewerOnCard, loadStructureInViewer, openFullViewer, closeFullViewer } from './viewer.js';

// ────────────────── Callback objects ──────────────────

const viewerCallbacks = {
  deactivateCard,
  positionViewerOnCard,
};

const cardCallbacks = {
  onActivate: function (index) { activateCard(index); },
  onOpenFull: function (index) { openFullViewer(index); },
  onSelectToggle: function () {
    toggleSelectMode(state.selectMode, { deactivateCard });
  },
};

const toolbarCallbacks = {
  onColorChange: function () {
    if (state.activeCardIndex >= 0 && state.viewer) {
      applyCurrentColorTheme(state.viewer);
    }
    reRenderAllThumbnails();
  },
  onReprChange: function () {
    if (state.activeCardIndex >= 0 && state.viewer) {
      loadStructureInViewer(state.activeCardIndex);
    }
    reRenderAllThumbnails();
  },
  onStyleChange: function () {
    if (state.activeCardIndex >= 0 && state.viewer) {
      loadStructureInViewer(state.activeCardIndex);
    }
    reRenderAllThumbnails();
  },
  onGridSizeChange: function () {
    if (state.activeCardIndex >= 0) {
      requestAnimationFrame(function () {
        positionViewerOnCard(state.activeCardIndex);
      });
    }
  },
  onFilterChange: function () {
    applySortAndFilter(viewerCallbacks);
  },
  onSelectToggle: function () {
    toggleSelectMode(state.selectMode, { deactivateCard });
  },
  onDeleteSelected: function () {
    deleteSelectedCards({ deactivateCard, cardCallbacks, onDeleted: showUndoToast });
  },
};

// ────────────────── Init ──────────────────

function init() {
  const toolbar = createToolbar(toolbarCallbacks);
  document.body.appendChild(toolbar);

  state.gridWrapper = document.createElement('div');
  state.gridWrapper.id = 'grid-wrapper';
  document.body.appendChild(state.gridWrapper);

  state.gridContainer = document.createElement('div');
  state.gridContainer.id = 'grid-container';
  state.gridContainer.className = 'grid-container size-' + state.settings.gridSize;
  state.gridWrapper.appendChild(state.gridContainer);

  // Empty state (shown when no files are loaded)
  const emptyState = document.createElement('div');
  emptyState.id = 'empty-state';
  emptyState.innerHTML = '<div class="empty-title">No molecular files</div>'
    + '<div class="empty-hint">Click <strong>Open</strong> to load files, or right-click files in the Explorer.</div>'
    + '<div class="empty-hint">Supported formats: PDB, CIF, SDF, MOL, MOL2, XYZ, GRO, PQR, PDBQT</div>';
  state.gridWrapper.appendChild(emptyState);

  // Undo toast
  const undoToast = document.createElement('div');
  undoToast.id = 'undo-toast';
  undoToast.style.display = 'none';
  const undoText = document.createElement('span');
  undoText.className = 'undo-text';
  undoToast.appendChild(undoText);
  const undoBtn = document.createElement('button');
  undoBtn.textContent = 'Undo';
  undoBtn.addEventListener('click', performUndo);
  undoToast.appendChild(undoBtn);
  const undoDismiss = document.createElement('span');
  undoDismiss.className = 'undo-dismiss';
  undoDismiss.textContent = '\u00D7';
  undoDismiss.addEventListener('click', function () {
    hideUndoToast();
    state.undoState = null;
  });
  undoToast.appendChild(undoDismiss);
  document.body.appendChild(undoToast);

  // Loading indicator (shown when extension host is reading files)
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading-indicator';
  loadingIndicator.textContent = 'Loading files...';
  loadingIndicator.style.display = 'none';
  state.gridWrapper.appendChild(loadingIndicator);

  // Interactive viewer overlay (positioned on active card)
  state.viewerOverlay = document.createElement('div');
  state.viewerOverlay.id = 'viewer-overlay';
  state.viewerOverlay.style.display = 'none';
  const viewerDiv = document.createElement('div');
  viewerDiv.id = 'active-viewer';
  state.viewerOverlay.appendChild(viewerDiv);

  // Reset View button
  const resetBtn = document.createElement('button');
  resetBtn.id = 'reset-btn';
  resetBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>';
  resetBtn.title = 'Reset camera';
  resetBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (state.activeCardIndex < 0 || !state.viewer) return;
    const index = state.activeCardIndex;
    try { state.viewer.plugin.dispose(); } catch (e) { /* ignore */ }
    state.viewer = null;
    const container = document.getElementById('active-viewer');
    container.innerHTML = '';
    molstar.Viewer.create('active-viewer', MOLSTAR_CONFIG).then(function (v) {
      state.viewer = v;
      hideAxes(v);
      if (state.activeCardIndex === index) {
        loadStructureInViewer(index);
      }
    });
  });
  state.viewerOverlay.appendChild(resetBtn);

  // Expand button (open full viewer)
  const expandBtn = document.createElement('button');
  expandBtn.id = 'expand-btn';
  expandBtn.innerHTML = '&#x26F6;';
  expandBtn.title = 'Open in full viewer';
  expandBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (state.activeCardIndex >= 0) {
      openFullViewer(state.activeCardIndex);
    }
  });
  state.viewerOverlay.appendChild(expandBtn);

  // Double-click on overlay also opens full viewer
  state.viewerOverlay.addEventListener('dblclick', function () {
    if (state.activeCardIndex >= 0) {
      openFullViewer(state.activeCardIndex);
    }
  });

  state.gridWrapper.appendChild(state.viewerOverlay);

  // Full viewer overlay (covers entire panel)
  state.fullViewerOverlay = document.createElement('div');
  state.fullViewerOverlay.id = 'full-viewer-overlay';
  state.fullViewerOverlay.style.display = 'none';

  const fullTopBar = document.createElement('div');
  fullTopBar.id = 'full-viewer-topbar';
  const backBtn = document.createElement('button');
  backBtn.id = 'back-to-grid-btn';
  backBtn.innerHTML = '&larr; Back';
  backBtn.addEventListener('click', closeFullViewer);
  fullTopBar.appendChild(backBtn);
  const fullTitle = document.createElement('span');
  fullTitle.id = 'full-viewer-title';
  fullTopBar.appendChild(fullTitle);
  state.fullViewerOverlay.appendChild(fullTopBar);

  const fullViewerDiv = document.createElement('div');
  fullViewerDiv.id = 'full-viewer';
  state.fullViewerOverlay.appendChild(fullViewerDiv);

  document.body.appendChild(state.fullViewerOverlay);

  // Offscreen thumbnail renderer
  state.thumbRenderer = document.createElement('div');
  state.thumbRenderer.id = 'thumb-renderer';
  const thumbDiv = document.createElement('div');
  thumbDiv.id = 'thumb-viewer';
  thumbDiv.style.width = '300px';
  thumbDiv.style.height = '300px';
  state.thumbRenderer.appendChild(thumbDiv);
  document.body.appendChild(state.thumbRenderer);

  // Click on empty space -> deactivate active card
  state.gridWrapper.addEventListener('click', function (e) {
    if (!e.target.closest('.grid-card') &&
        !e.target.closest('#viewer-overlay') &&
        state.activeCardIndex >= 0) {
      deactivateCard();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    // Don't intercept when typing in search input
    if (e.target && e.target.tagName === 'INPUT') return;

    // Ctrl/Cmd+Z -> undo delete
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && state.undoState) {
      e.preventDefault();
      performUndo();
      return;
    }

    // Ctrl/Cmd+A -> select all (only when already in select mode)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      if (!state.selectMode) return;
      if (state.files.length === 0) return;
      e.preventDefault();
      for (let i = 0; i < state.files.length; i++) {
        const c = document.getElementById(cardId(i));
        if (c && c.style.display !== 'none') {
          c.classList.add('selected');
          state.selectedCards.add(i);
        }
      }
      updateDeleteButton();
      return;
    }

    // Escape -> close full viewer / exit select mode / deactivate card
    if (e.key === 'Escape') {
      if (state.fullViewerIndex >= 0) {
        closeFullViewer();
      } else if (state.selectMode) {
        state.selectMode = false;
        const selectBtn = document.getElementById('select-btn');
        if (selectBtn) selectBtn.classList.remove('active');
        toggleSelectMode(false, { deactivateCard });
      } else if (state.activeCardIndex >= 0) {
        deactivateCard();
      }
      return;
    }

    // Enter -> open full viewer for active card
    if (e.key === 'Enter' && state.activeCardIndex >= 0 && state.fullViewerIndex < 0) {
      openFullViewer(state.activeCardIndex);
      return;
    }

    // Arrow keys -> navigate between cards
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) === -1) return;
    if (state.fullViewerIndex >= 0) return; // don't navigate in full viewer
    if (state.selectMode) return; // don't navigate in select mode
    if (state.files.length === 0) return;
    e.preventDefault();

    // Get visible card indices in visual order (respecting CSS order)
    const visibleIndices = getVisibleCardIndices();
    if (visibleIndices.length === 0) return;

    if (state.activeCardIndex < 0) {
      // No active card -> activate first visible
      activateCard(visibleIndices[0]);
      scrollCardIntoView(visibleIndices[0]);
      return;
    }

    const currentPos = visibleIndices.indexOf(state.activeCardIndex);
    if (currentPos === -1) {
      activateCard(visibleIndices[0]);
      scrollCardIntoView(visibleIndices[0]);
      return;
    }

    let targetPos = currentPos;
    const cols = getGridColumnCount();

    if (e.key === 'ArrowRight') {
      targetPos = Math.min(currentPos + 1, visibleIndices.length - 1);
    } else if (e.key === 'ArrowLeft') {
      targetPos = Math.max(currentPos - 1, 0);
    } else if (e.key === 'ArrowDown') {
      targetPos = Math.min(currentPos + cols, visibleIndices.length - 1);
    } else if (e.key === 'ArrowUp') {
      targetPos = Math.max(currentPos - cols, 0);
    }

    if (targetPos !== currentPos) {
      activateCard(visibleIndices[targetPos]);
      scrollCardIntoView(visibleIndices[targetPos]);
    }
  });

  // IntersectionObserver for lazy thumbnail rendering
  state.cardObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      const idx = parseInt(entry.target.id.replace('card-', ''), 10);
      if (isNaN(idx)) return;
      if (entry.isIntersecting) {
        state.visibleCards.add(idx);
        if (state.needsRender.has(idx)) {
          state.needsRender.delete(idx);
          state.reRenderQueue.push(idx);
          if (state.thumbViewer && !state.isReRendering) {
            processReRenderQueue(state.reRenderGen);
          }
        }
      } else {
        state.visibleCards.delete(idx);
      }
    });
  }, {
    root: state.gridWrapper,
    rootMargin: '200px',
  });
}

// ────────────────── Undo toast ──────────────────

function showUndoToast(count) {
  const toast = document.getElementById('undo-toast');
  if (!toast) return;
  toast.querySelector('.undo-text').textContent = 'Deleted ' + count + (count === 1 ? ' file' : ' files');
  toast.style.display = 'flex';

  // Clear previous timer
  if (state.undoTimer) clearTimeout(state.undoTimer);
  state.undoTimer = setTimeout(function () {
    hideUndoToast();
    state.undoState = null; // expire undo after timeout
  }, 5000);
}

function hideUndoToast() {
  const toast = document.getElementById('undo-toast');
  if (toast) toast.style.display = 'none';
  if (state.undoTimer) {
    clearTimeout(state.undoTimer);
    state.undoTimer = null;
  }
}

function performUndo() {
  if (!state.undoState) return;
  hideUndoToast();
  undoDelete();
}

// ────────────────── Keyboard navigation helpers ──────────────────

function getVisibleCardIndices() {
  const cards = state.gridContainer.querySelectorAll('.grid-card');
  const visible = [];
  // Build array of { index, order } for visible cards, then sort by CSS order
  cards.forEach(function (card) {
    if (card.style.display === 'none') return;
    const idx = parseInt(card.id.replace('card-', ''), 10);
    if (isNaN(idx)) return;
    const order = parseInt(card.style.order, 10) || 0;
    visible.push({ idx, order });
  });
  visible.sort(function (a, b) { return a.order - b.order; });
  return visible.map(function (v) { return v.idx; });
}

function getGridColumnCount() {
  if (!state.gridContainer || state.files.length === 0) return 1;
  const firstCard = state.gridContainer.querySelector('.grid-card:not([style*="display: none"])');
  if (!firstCard) return 1;
  const containerWidth = state.gridContainer.clientWidth;
  const cardWidth = firstCard.offsetWidth;
  if (cardWidth === 0) return 1;
  return Math.max(1, Math.round(containerWidth / (cardWidth + 12))); // 12 = grid gap
}

function scrollCardIntoView(index) {
  const card = document.getElementById(cardId(index));
  if (card) {
    card.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }
}

// ────────────────── Event listeners ──────────────────

window.addEventListener('message', function (event) {
  const message = event.data;
  if (message.type === 'loadFiles') {
    state.files = message.files;
    createCards(state.files, cardCallbacks);
    populateFormatFilter();
    updateFileCount();
    initThumbViewer(function () {
      if (state.pendingSingleFileOpen) {
        state.pendingSingleFileOpen = false;
        openFullViewer(0);
      }
    });

    if (state.files.length === 1 && state.isInitialLoad) {
      state.pendingSingleFileOpen = true;
    }
    state.isInitialLoad = false;
  } else if (message.type === 'addFiles') {
    // Deduplicate by URI
    const existingUris = {};
    state.files.forEach(function (f) { existingUris[f.uri] = true; });
    const newFiles = message.files.filter(function (f) { return !existingUris[f.uri]; });
    if (newFiles.length === 0) return;
    const startIndex = state.files.length;
    newFiles.forEach(function (f) { state.files.push(f); });
    createCardsFromIndex(startIndex, newFiles, cardCallbacks);
    populateFormatFilter();
    updateFileCount();
    renderNewThumbnails(startIndex);
  } else if (message.type === 'loading') {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.style.display = message.loading ? 'flex' : 'none';
    }
  }
});

let resizeRaf = null;
window.addEventListener('resize', function () {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(function () {
    resizeRaf = null;
    if (state.activeCardIndex >= 0) {
      positionViewerOnCard(state.activeCardIndex);
    }
  });
});

// Cleanup all resources on webview unload
window.addEventListener('beforeunload', function () {
  if (state.cardObserver) {
    state.cardObserver.disconnect();
    state.cardObserver = null;
  }
  if (state.fullViewerSectionObserver) {
    state.fullViewerSectionObserver.disconnect();
    state.fullViewerSectionObserver = null;
  }
  try { if (state.viewer) state.viewer.plugin.dispose(); } catch (e) { /* ignore */ }
  try { if (state.thumbViewer) state.thumbViewer.plugin.dispose(); } catch (e) { /* ignore */ }
  try { if (state.fullViewer) state.fullViewer.plugin.dispose(); } catch (e) { /* ignore */ }
  state.viewer = null;
  state.thumbViewer = null;
  state.fullViewer = null;
});

init();
vscode.postMessage({ type: 'ready' });
