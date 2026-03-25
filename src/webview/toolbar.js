import { state, vscode, cardId } from './state.js';

function createGroup() {
  const g = document.createElement('div');
  g.className = 'tb-group';
  return g;
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

  // ── Group: Appearance (Color, Repr, Style) ──
  const appearanceGroup = createGroup();

  const colorSelect = document.createElement('select');
  colorSelect.id = 'grid-color-select';
  [
    { value: 'default', label: 'Default' },
    { value: 'element-symbol', label: 'Element' },
    { value: 'residue-name', label: 'Residue' },
    { value: 'secondary-structure', label: 'Secondary' },
    { value: 'chain-id', label: 'Chain' },
    { value: 'uncertainty', label: 'pLDDT' },
    { value: 'sequence-id', label: 'Rainbow' },
    { value: 'illustrative', label: 'Illustrative' },
    { value: 'uniform', label: 'Uniform' },
  ].forEach(function (c) {
    const opt = document.createElement('option');
    opt.value = c.value;
    opt.textContent = c.label;
    colorSelect.appendChild(opt);
  });
  colorSelect.addEventListener('change', function () {
    state.settings.colorTheme = colorSelect.value;
    callbacks.onColorChange();
  });
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Color: ';
  colorLabel.appendChild(colorSelect);
  appearanceGroup.appendChild(colorLabel);

  const repSelect = document.createElement('select');
  repSelect.id = 'grid-rep-select';
  [
    { value: 'default', label: 'Default' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'ball-and-stick', label: 'Ball & Stick' },
    { value: 'spacefill', label: 'Spacefill' },
    { value: 'molecular-surface', label: 'Surface' },
    { value: 'gaussian-surface', label: 'Gaussian' },
  ].forEach(function (m) {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    repSelect.appendChild(opt);
  });
  repSelect.addEventListener('change', function () {
    state.settings.displayMode = repSelect.value;
    callbacks.onReprChange();
  });
  const repLabel = document.createElement('label');
  repLabel.textContent = 'Repr: ';
  repLabel.appendChild(repSelect);
  appearanceGroup.appendChild(repLabel);

  const styleSelect = document.createElement('select');
  styleSelect.id = 'grid-style-select';
  [
    { value: 'default', label: 'Default' },
    { value: 'illustrative', label: 'Illustrative' },
  ].forEach(function (s) {
    const opt = document.createElement('option');
    opt.value = s.value;
    opt.textContent = s.label;
    styleSelect.appendChild(opt);
  });
  styleSelect.addEventListener('change', function () {
    state.settings.style = styleSelect.value;
    callbacks.onStyleChange();
  });
  const styleLabel = document.createElement('label');
  styleLabel.textContent = 'Style: ';
  styleLabel.appendChild(styleSelect);
  appearanceGroup.appendChild(styleLabel);
  tb.appendChild(appearanceGroup);

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

  // ── Group: Filter (Search, Sort, Format) ──
  const filterGroup = createGroup();

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'search-wrapper';
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
  filterGroup.appendChild(searchWrapper);

  const sortSelect = document.createElement('select');
  sortSelect.id = 'grid-sort-select';
  [
    { value: 'name-asc', label: 'Name A\u2192Z' },
    { value: 'name-desc', label: 'Name Z\u2192A' },
  ].forEach(function (s) {
    const opt = document.createElement('option');
    opt.value = s.value;
    opt.textContent = s.label;
    sortSelect.appendChild(opt);
  });
  sortSelect.addEventListener('change', function () {
    state.settings.sortBy = sortSelect.value;
    callbacks.onFilterChange();
  });
  const sortLabel = document.createElement('label');
  sortLabel.textContent = 'Sort: ';
  sortLabel.appendChild(sortSelect);
  filterGroup.appendChild(sortLabel);

  const filterSelect = document.createElement('select');
  filterSelect.id = 'grid-filter-select';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All';
  filterSelect.appendChild(allOpt);
  filterSelect.addEventListener('change', function () {
    state.settings.filterFormat = filterSelect.value;
    callbacks.onFilterChange();
  });
  const filterLabel = document.createElement('label');
  filterLabel.textContent = 'Format: ';
  filterLabel.appendChild(filterSelect);
  filterGroup.appendChild(filterLabel);
  tb.appendChild(filterGroup);

  // ── File count (pushed to right) ──
  const fileCount = document.createElement('span');
  fileCount.id = 'file-count';
  fileCount.className = 'file-count';
  tb.appendChild(fileCount);

  return tb;
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
      const matchFormat = state.settings.filterFormat === 'all' || f.format === state.settings.filterFormat;
      const matchSearch = !state.settings.searchText || f.fileName.toLowerCase().indexOf(state.settings.searchText) !== -1;
      if (matchFormat && matchSearch) visible++;
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

    const matchFormat = state.settings.filterFormat === 'all' || state.files[fileIdx].format === state.settings.filterFormat;
    const matchSearch = !state.settings.searchText || state.files[fileIdx].fileName.toLowerCase().indexOf(state.settings.searchText) !== -1;
    card.style.display = (matchFormat && matchSearch) ? '' : 'none';
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
