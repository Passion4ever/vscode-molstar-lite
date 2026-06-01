export const vscode = acquireVsCodeApi();

export const state = {
  files: [],

  // Mol* viewer instances
  viewer: null,
  fullViewer: null,

  // Parallel offscreen thumbnail renderers — each entry: { viewer, container, busy }
  thumbWorkers: [],
  activeWorkers: 0,

  activeCardIndex: -1,
  screenshots: {},
  fullViewerSnapshots: {},

  // Background re-render state
  reRenderQueue: [],
  reRenderGen: 0,
  needsRender: new Set(),
  visibleCards: new Set(),
  cardObserver: null,

  // Selection mode state
  selectMode: false,
  selectedCards: new Set(),
  lastClickedIndex: -1,
  isInitialLoad: true,
  pendingSingleFileOpen: false,
  isLoading: false,

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
  fullViewerOverlay: null,
  fullViewerIndex: -1,

  // Undo state (single level)
  undoState: null,
  undoTimer: null,
};

// Number of parallel offscreen thumbnail renderers. 2 captures most of the
// speedup (the main thread is the bottleneck); more gives diminishing returns.
export const THUMB_WORKER_COUNT = 2;

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
  layoutShowRemoteState: true,
  layoutShowSequence: true,
  layoutShowLog: false,
  layoutShowLeftPanel: true,
  collapseLeftPanel: true,
  collapseRightPanel: false,
  // Both hidden: the Expand button's hover exposes a browser-Fullscreen button
  // that VS Code's sandboxed webview iframe blocks (it does nothing), and Mol*
  // ties the two together. The in-panel full viewer already fills the panel.
  viewportShowExpand: false,
  viewportShowToggleFullscreen: false,
  viewportShowControls: true,
  viewportShowSettings: true,
  viewportShowSelectionMode: true,
  viewportShowAnimation: true,
  volumeStreamingDisabled: false,
};

export function cardId(index) {
  return 'card-' + index;
}
