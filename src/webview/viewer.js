(function () {
  var viewer = null;
  var vscode = acquireVsCodeApi();

  function initViewer() {
    molstar.Viewer.create('app', {
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

      // Disable extensions we don't need
      volumeStreamingDisabled: true,
      disabledExtensions: [
        'assembly-symmetry',
        'model-export',
        'mp4-export',
        'geo-export',
        'zenodo-import',
        'pdbe-structure-quality-report',
        'rcsb-validation-report',
        'anvil-membrane-orientation',
        'g3d',
        'sb-ncbr-partial-charges',
        'tunnels',
        'dnatco-ntcs',
      ],
    }).then(function (v) {
      viewer = v;
      hideBuiltinSections();
      vscode.postMessage({ type: 'ready' });
    });
  }

  // Hide built-in UI elements that can't be disabled via config
  var HIDDEN_EXACT = ['Measurements'];  // exact match, hide whole section
  var HIDDEN_PREFIX = ['Unit Cell'];     // startsWith match, hide parent only

  function hideBuiltinSections() {
    var observer = new MutationObserver(function () {
      var buttons = document.querySelectorAll('button');
      buttons.forEach(function (btn) {
        if (btn.offsetParent === null) { return; }

        var text = btn.textContent.replace(/\s+/g, ' ').trim();

        // Exact match: hide whole section
        if (HIDDEN_EXACT.indexOf(text) !== -1) {
          var el = btn;
          while (el.parentElement) {
            var next = el.parentElement;
            if (next.classList.contains('msp-scrollable-container')
              || next.classList.contains('msp-layout-right')
              || next.id === 'app') {
              break;
            }
            el = next;
          }
          el.style.display = 'none';
          return;
        }

        // Prefix match: hide parent only (sub-items like Unit Cell)
        for (var i = 0; i < HIDDEN_PREFIX.length; i++) {
          if (text.lastIndexOf(HIDDEN_PREFIX[i], 0) === 0) {
            var parent = btn.parentElement;
            if (parent) { parent.style.display = 'none'; }
            return;
          }
        }
      });
    });
    observer.observe(document.getElementById('app'), {
      childList: true, subtree: true,
    });
  }

  function addMolecule(data, format, fileName) {
    if (!viewer) { return; }
    viewer.loadStructureFromData(data, format, false, {
      dataLabel: fileName,
    });
  }

  window.addEventListener('message', function (event) {
    var message = event.data;
    if (message.type === 'addMolecule') {
      addMolecule(message.data, message.format, message.fileName);
    }
  });

  initViewer();
})();
