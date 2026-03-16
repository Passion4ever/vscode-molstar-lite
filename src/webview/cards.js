import { state, cardId } from './state.js';
import { revokeScreenshot, updateCardImage } from './utils.js';
import { updateFileCount, populateFormatFilter } from './toolbar.js';

export function createCards(fileList, callbacks) {
  fileList.forEach(function (file, index) {
    const card = createSingleCard(file, index, callbacks);
    state.gridContainer.appendChild(card);
  });
}

export function createSingleCard(file, index, callbacks) {
  const card = document.createElement('div');
  card.className = 'grid-card';
  card.id = cardId(index);
  if (state.selectMode) {
    card.classList.add('selectable');
  }

  const imgArea = document.createElement('div');
  imgArea.className = 'card-img-area loading';

  const hoverHint = document.createElement('div');
  hoverHint.className = 'card-hover-hint';
  hoverHint.innerHTML = 'Click to activate<br>Double-click for full viewer';
  imgArea.appendChild(hoverHint);

  card.appendChild(imgArea);

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = file.fileName;
  label.title = file.fileName;
  card.appendChild(label);

  // Single click
  card.addEventListener('click', function (e) {
    // Ctrl/Cmd+Click or Shift+Click -> enter select mode automatically
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      if (!state.selectMode) {
        state.selectMode = true;
        const selectBtn = document.getElementById('select-btn');
        if (selectBtn) selectBtn.classList.add('active');
        callbacks.onSelectToggle();
      }

      if (e.shiftKey && state.lastClickedIndex >= 0) {
        state.selectedCards.forEach(function (si) {
          const sc = document.getElementById(cardId(si));
          if (sc) sc.classList.remove('selected');
        });
        state.selectedCards.clear();

        const lo = Math.min(state.lastClickedIndex, index);
        const hi = Math.max(state.lastClickedIndex, index);
        for (let i = lo; i <= hi; i++) {
          const c = document.getElementById(cardId(i));
          if (c && c.style.display !== 'none') {
            c.classList.add('selected');
            state.selectedCards.add(i);
          }
        }
      } else {
        card.classList.toggle('selected');
        if (card.classList.contains('selected')) {
          state.selectedCards.add(index);
        } else {
          state.selectedCards.delete(index);
        }
        state.lastClickedIndex = index;
      }

      updateDeleteButton();
      return;
    }

    if (state.selectMode) {
      card.classList.toggle('selected');
      if (card.classList.contains('selected')) {
        state.selectedCards.add(index);
      } else {
        state.selectedCards.delete(index);
      }
      state.lastClickedIndex = index;
      updateDeleteButton();
      return;
    }
    if (state.activeCardIndex === index) return;
    callbacks.onActivate(index);
  });

  // Double click -> open full viewer in-panel
  card.addEventListener('dblclick', function () {
    if (!state.selectMode) {
      callbacks.onOpenFull(index);
    }
  });

  // Observe for lazy thumbnail rendering
  if (state.cardObserver) {
    state.cardObserver.observe(card);
  }

  return card;
}

export function createCardsFromIndex(startIndex, newFiles, callbacks) {
  newFiles.forEach(function (file, i) {
    const card = createSingleCard(file, startIndex + i, callbacks);
    state.gridContainer.appendChild(card);
  });
}

export function renderNewThumbnails(startIndex) {
  for (let i = startIndex; i < state.files.length; i++) {
    state.needsRender.add(i);
  }
}

export function toggleSelectMode(enabled, callbacks) {
  const cards = state.gridContainer.querySelectorAll('.grid-card');
  if (enabled) {
    if (state.activeCardIndex >= 0) {
      callbacks.deactivateCard();
    }
    cards.forEach(function (card) { card.classList.add('selectable'); });
  } else {
    cards.forEach(function (card) {
      card.classList.remove('selectable');
      card.classList.remove('selected');
    });
    state.selectedCards.clear();
    state.lastClickedIndex = -1;
  }
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
    deleteBtn.style.display = enabled ? '' : 'none';
  }
  // Disable appearance controls in select mode
  ['grid-color-select', 'grid-rep-select', 'grid-style-select'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.disabled = enabled;
  });
  updateDeleteButton();
}

export function updateDeleteButton() {
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
    deleteBtn.disabled = !state.selectMode || state.selectedCards.size === 0;
    if (state.selectMode && state.selectedCards.size > 0) {
      deleteBtn.textContent = 'Delete (' + state.selectedCards.size + ')';
    } else {
      deleteBtn.textContent = 'Delete';
    }
  }
}

export function deleteSelectedCards(callbacks) {
  if (state.selectedCards.size === 0) return;

  const deletedSet = new Set(state.selectedCards);

  // Close full viewer if open (before index remapping)
  if (state.fullViewerIndex >= 0) {
    state.fullViewerOverlay.style.display = 'none';
    document.getElementById('grid-toolbar').style.display = '';
    state.gridWrapper.style.display = '';
    state.fullViewerIndex = -1;
  }

  // Deactivate viewer
  if (state.activeCardIndex >= 0) {
    callbacks.deactivateCard();
  }

  // Save undo state before modifying anything
  state.undoState = {
    files: state.files.slice(),
    screenshots: Object.assign({}, state.screenshots),
    fullViewerSnapshots: Object.assign({}, state.fullViewerSnapshots),
    deletedCount: deletedSet.size,
    cardCallbacks: callbacks.cardCallbacks,
  };

  // Build new files array and remap screenshots/snapshots
  const newFiles = [];
  const newScreenshots = {};
  const newSnapshots = {};
  for (let i = 0; i < state.files.length; i++) {
    if (deletedSet.has(i)) continue;
    const newIdx = newFiles.length;
    newFiles.push(state.files[i]);
    if (state.screenshots[i]) newScreenshots[newIdx] = state.screenshots[i];
    if (state.fullViewerSnapshots[i]) newSnapshots[newIdx] = state.fullViewerSnapshots[i];
  }

  state.files = newFiles;
  state.screenshots = newScreenshots;
  state.fullViewerSnapshots = newSnapshots;
  state.selectedCards.clear();

  // Exit select mode after delete
  state.selectMode = false;
  state.lastClickedIndex = -1;
  const selectBtn = document.getElementById('select-btn');
  if (selectBtn) selectBtn.classList.remove('active');

  // Unobserve old cards before clearing DOM
  if (state.cardObserver) {
    state.gridContainer.querySelectorAll('.grid-card').forEach(function (card) {
      state.cardObserver.unobserve(card);
    });
  }
  state.visibleCards.clear();
  state.needsRender.clear();

  // Remove old card DOM elements and rebuild
  rebuildCards(callbacks.cardCallbacks, newScreenshots);
  populateFormatFilter();
  updateFileCount();
  updateDeleteButton();

  // Show undo toast
  if (callbacks.onDeleted) {
    callbacks.onDeleted(deletedSet.size);
  }
}

export function undoDelete() {
  if (!state.undoState) return;
  const undo = state.undoState;
  state.undoState = null;

  // Unobserve old cards
  if (state.cardObserver) {
    state.gridContainer.querySelectorAll('.grid-card').forEach(function (card) {
      state.cardObserver.unobserve(card);
    });
  }
  state.visibleCards.clear();
  state.needsRender.clear();

  // Restore state
  state.files = undo.files;
  state.screenshots = undo.screenshots;
  state.fullViewerSnapshots = undo.fullViewerSnapshots;

  // Rebuild cards
  rebuildCards(undo.cardCallbacks, undo.screenshots);
  populateFormatFilter();
  updateFileCount();
}

function rebuildCards(cardCallbacks, screenshotsToRestore) {
  state.gridContainer.innerHTML = '';
  if (state.files.length > 0) {
    createCards(state.files, cardCallbacks);
    for (const idx in screenshotsToRestore) {
      updateCardImage(Number(idx), screenshotsToRestore[idx]);
    }
  }
}
