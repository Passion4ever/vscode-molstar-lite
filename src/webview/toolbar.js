import { state, vscode, cardId } from './state.js';

function createGroup() {
  const g = document.createElement('div');
  g.className = 'tb-group';
  return g;
}

function createSelect(id, options, onChange) {
  const select = document.createElement('select');
  select.id = id;
  options.forEach(function (o) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    select.appendChild(opt);
  });
  select.addEventListener('change', onChange);
  return select;
}

export function createToolbar(callbacks) {
  const tb = document.createElement('div');
  tb.id = 'grid-toolbar';

  // ── Group: Open ──
  const openGroup = createGroup();
  const openBtn = document.createElement('button');
  openBtn.id = 'open-btn';
  openBtn.textContent = 'Open';
  openBtn.title = 'Open files or folders';
  openBtn.addEventListener('click', function () {
    vscode.postMessage({ type: 'open' });
  });
  openGroup.appendChild(openBtn);
  tb.appendChild(openGroup);

  // ── Group: Select / Delete ──
  const selectGroup = createGroup();

  const selectBtn = document.createElement('button');
  selectBtn.id = 'select-btn';
  selectBtn.textContent = 'Select';
  selectBtn.title = 'Toggle selection mode (or Ctrl+Click card)';
  selectBtn.addEventListener('click', function () {
    state.selectMode = !state.selectMode;
    selectBtn.classList.toggle('active', state.selectMode);
    callbacks.onSelectToggle();
  });
  selectGroup.appendChild(selectBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.id = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.title = 'Delete selected cards (Ctrl+A to select all)';
  deleteBtn.disabled = true;
  deleteBtn.style.display = 'none';
  deleteBtn.addEventListener('click', function () {
    if (state.selectMode && state.selectedCards.size > 0) {
      callbacks.onDeleteSelected();
    }
  });
  selectGroup.appendChild(deleteBtn);
  tb.appendChild(selectGroup);

  // ── Group: Grid size ──
  const sizeGroup = createGroup();
  sizeGroup.classList.add('size-group');
  ['small', 'medium', 'large'].forEach(function (size) {
    const btn = document.createElement('button');
    btn.textContent = size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L';
    btn.title = size.charAt(0).toUpperCase() + size.slice(1) + ' grid';
    if (size === state.settings.gridSize) btn.classList.add('active');
    btn.addEventListener('click', function () {
      state.settings.gridSize = size;
      state.gridContainer.className = 'grid-container size-' + size;
      sizeGroup.querySelectorAll('button').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      callbacks.onGridSizeChange();
    });
    sizeGroup.appendChild(btn);
  });
  tb.appendChild(sizeGroup);

  // ── Group: Search ──
  const searchGroup = createGroup();
  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'search-wrapper';
  const searchIcon = document.createElement('span');
  searchIcon.className = 'search-icon';
  searchIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  searchWrapper.appendChild(searchIcon);
  const searchInput = document.createElement('input');
  searchInput.id = 'grid-search-input';
  searchInput.type = 'text';
  searchInput.placeholder = 'Search...';
  const searchClear = document.createElement('span');
  searchClear.className = 'search-clear';
  searchClear.textContent = '\u00D7';
  searchClear.title = 'Clear search';
  searchClear.style.display = 'none';
  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    state.settings.searchText = '';
    searchClear.style.display = 'none';
    callbacks.onFilterChange();
    searchInput.focus();
  });
  let searchTimer = null;
  searchInput.addEventListener('input', function () {
    searchClear.style.display = searchInput.value ? '' : 'none';
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.settings.searchText = searchInput.value.trim().toLowerCase();
      callbacks.onFilterChange();
    }, 150);
  });
  searchWrapper.appendChild(searchInput);
  searchWrapper.appendChild(searchClear);
  searchGroup.appendChild(searchWrapper);
  tb.appendChild(searchGroup);

  // ── File count (pushed to right) ──
  const fileCount = document.createElement('span');
  fileCount.id = 'file-count';
  fileCount.className = 'file-count';
  tb.appendChild(fileCount);

  // ── Settings gear button (far right) ──
  const gearBtn = document.createElement('button');
  gearBtn.id = 'settings-btn';
  gearBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  gearBtn.title = 'Display settings';
  gearBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var panel = document.getElementById('settings-panel');
    if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
  });
  tb.appendChild(gearBtn);

  // ── Settings floating panel ──
  const panel = document.createElement('div');
  panel.id = 'settings-panel';
  panel.style.display = 'none';
  // Stop clicks inside panel from closing it
  panel.addEventListener('click', function (e) { e.stopPropagation(); });

  const panelHeader = document.createElement('div');
  panelHeader.className = 'settings-header';
  const panelTitle = document.createElement('span');
  panelTitle.textContent = 'Display Settings';
  panelHeader.appendChild(panelTitle);
  panel.appendChild(panelHeader);

  const panelBody = document.createElement('div');
  panelBody.className = 'settings-body';

  panelBody.appendChild(createSettingsRow('Color', createSelect('grid-color-select', [
    { value: 'default', label: 'Default' },
    { value: 'element-symbol', label: 'Element' },
    { value: 'residue-name', label: 'Residue' },
    { value: 'secondary-structure', label: 'Secondary' },
    { value: 'chain-id', label: 'Chain' },
    { value: 'plddt-confidence', label: 'pLDDT' },
    { value: 'sequence-id', label: 'Rainbow' },
    { value: 'illustrative', label: 'Illustrative' },
    { value: 'uniform', label: 'Uniform' },
  ], function () {
    state.settings.colorTheme = this.value;
    callbacks.onColorChange();
  })));

  panelBody.appendChild(createSettingsRow('Repr.', createSelect('grid-rep-select', [
    { value: 'default', label: 'Default' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'ball-and-stick', label: 'Ball & Stick' },
    { value: 'spacefill', label: 'Spacefill' },
    { value: 'molecular-surface', label: 'Surface' },
    { value: 'gaussian-surface', label: 'Gaussian' },
  ], function () {
    state.settings.displayMode = this.value;
    callbacks.onReprChange();
  })));

  panelBody.appendChild(createSettingsRow('Style', createSelect('grid-style-select', [
    { value: 'default', label: 'Default' },
    { value: 'illustrative', label: 'Illustrative' },
  ], function () {
    state.settings.style = this.value;
    callbacks.onStyleChange();
  })));

  panelBody.appendChild(createSettingsRow('Sort', createSelect('grid-sort-select', [
    { value: 'name-asc', label: 'Name A\u2192Z' },
    { value: 'name-desc', label: 'Name Z\u2192A' },
  ], function () {
    state.settings.sortBy = this.value;
    callbacks.onFilterChange();
  })));

  panelBody.appendChild(createSettingsRow('Format', createSelect('grid-filter-select', [
    { value: 'all', label: 'All' },
  ], function () {
    state.settings.filterFormat = this.value;
    callbacks.onFilterChange();
  })));

  panel.appendChild(panelBody);
  tb.appendChild(panel);

  // Click anywhere outside panel to close it
  document.addEventListener('click', function () {
    if (panel.style.display !== 'none') panel.style.display = 'none';
  });

  return tb;
}

function createSettingsRow(labelText, control) {
  const row = document.createElement('div');
  row.className = 'settings-row';
  const label = document.createElement('label');
  label.textContent = labelText;
  row.appendChild(label);
  row.appendChild(control);
  return row;
}

function isFileVisible(file) {
  var matchFormat = state.settings.filterFormat === 'all' || file.format === state.settings.filterFormat;
  var matchSearch = !state.settings.searchText || file.fileName.toLowerCase().indexOf(state.settings.searchText) !== -1;
  return matchFormat && matchSearch;
}

export function updateFileCount() {
  const el = document.getElementById('file-count');
  if (!el) return;
  const total = state.files.length;
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.style.display = (total === 0 && !state.isLoading) ? '' : 'none';
  }
  if (total === 0) {
    el.textContent = '';
    return;
  }
  const hasFilter = state.settings.filterFormat !== 'all' || state.settings.searchText;
  if (!hasFilter) {
    el.textContent = total + (total === 1 ? ' file' : ' files');
  } else {
    let visible = 0;
    state.files.forEach(function (f) {
      if (isFileVisible(f)) visible++;
    });
    el.textContent = visible + ' / ' + total;
  }
}

export function populateFormatFilter() {
  const select = document.getElementById('grid-filter-select');
  if (!select) return;
  const currentValue = select.value;
  while (select.options.length > 1) {
    select.remove(1);
  }
  const formatCounts = {};
  state.files.forEach(function (f) {
    formatCounts[f.format] = (formatCounts[f.format] || 0) + 1;
  });
  Object.keys(formatCounts).sort().forEach(function (fmt) {
    const opt = document.createElement('option');
    opt.value = fmt;
    opt.textContent = fmt.toUpperCase() + ' (' + formatCounts[fmt] + ')';
    select.appendChild(opt);
  });
  if (currentValue && select.querySelector('option[value="' + currentValue + '"]')) {
    select.value = currentValue;
  }
}

export function applySortAndFilter(viewerCallbacks) {
  const indices = state.files.map(function (_, i) { return i; });

  if (state.settings.sortBy === 'name-asc') {
    indices.sort(function (a, b) {
      return state.files[a].fileName.localeCompare(state.files[b].fileName);
    });
  } else if (state.settings.sortBy === 'name-desc') {
    indices.sort(function (a, b) {
      return state.files[b].fileName.localeCompare(state.files[a].fileName);
    });
  }

  indices.forEach(function (fileIdx, order) {
    const card = document.getElementById(cardId(fileIdx));
    if (!card) return;
    card.style.order = order;

    card.style.display = isFileVisible(state.files[fileIdx]) ? '' : 'none';
  });

  updateFileCount();

  if (state.activeCardIndex >= 0) {
    const activeCard = document.getElementById(cardId(state.activeCardIndex));
    if (activeCard && activeCard.style.display === 'none') {
      viewerCallbacks.deactivateCard();
    } else {
      requestAnimationFrame(function () {
        viewerCallbacks.positionViewerOnCard(state.activeCardIndex);
      });
    }
  }
}
