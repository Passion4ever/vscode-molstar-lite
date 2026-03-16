export const vscode = acquireVsCodeApi();

export const state = {
  files: [],

  // Mol* viewer instances
  viewer: null,
  thumbViewer: null,
  fullViewer: null,

  activeCardIndex: -1,
  screenshots: {},
  fullViewerSnapshots: {},

  // Background re-render state
  reRenderQueue: [],
  reRenderGen: 0,
  isReRendering: false,
  needsRender: new Set(),
  visibleCards: new Set(),
  cardObserver: null,

  // Selection mode state
  selectMode: false,
  selectedCards: new Set(),
  lastClickedIndex: -1,
  isInitialLoad: true,
  pendingSingleFileOpen: false,

  settings: {
    colorTheme: 'default',
    displayMode: 'default',
    style: 'default',
    gridSize: 'medium',
    sortBy: 'name-asc',
    filterFormat: 'all',
    searchText: '',
  },

  // DOM references (set during init)
  gridWrapper: null,
  gridContainer: null,
  viewerOverlay: null,
  thumbRenderer: null,
  fullViewerOverlay: null,
  fullViewerIndex: -1,
  fullViewerSectionObserver: null,

  // Undo state (single level)
  undoState: null,
  undoTimer: null,
};

export const MOLSTAR_CONFIG = {
  layoutIsExpanded: false,
  layoutShowControls: false,
  layoutShowRemoteState: false,
  layoutShowSequence: false,
  layoutShowLog: false,
  layoutShowLeftPanel: false,
  collapseLeftPanel: true,
  collapseRightPanel: true,
  viewportShowExpand: false,
  viewportShowToggleFullscreen: false,
  viewportShowControls: false,
  viewportShowSettings: false,
  viewportShowSelectionMode: false,
  viewportShowAnimation: false,
  volumeStreamingDisabled: true,
  disabledExtensions: [
    'assembly-symmetry', 'model-export', 'mp4-export', 'geo-export',
    'zenodo-import', 'pdbe-structure-quality-report', 'rcsb-validation-report',
    'anvil-membrane-orientation', 'g3d', 'sb-ncbr-partial-charges',
    'tunnels', 'dnatco-ntcs',
  ],
};

export const FULL_VIEWER_CONFIG = {
  layoutIsExpanded: false,
  layoutShowControls: true,
  layoutShowRemoteState: false,
  layoutShowSequence: true,
  layoutShowLog: false,
  layoutShowLeftPanel: true,
  collapseLeftPanel: true,
  collapseRightPanel: false,
  viewportShowExpand: false,
  viewportShowToggleFullscreen: false,
  viewportShowControls: true,
  viewportShowSettings: false,
  viewportShowSelectionMode: true,
  viewportShowAnimation: false,
  volumeStreamingDisabled: true,
  disabledExtensions: MOLSTAR_CONFIG.disabledExtensions,
};

export function cardId(index) {
  return 'card-' + index;
}
