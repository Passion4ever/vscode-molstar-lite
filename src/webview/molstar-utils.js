import { state } from './state.js';

const HIDDEN_EXACT = ['Measurements'];
const HIDDEN_PREFIX = ['Unit Cell'];

export function hideBuiltinSections(container) {
  const observer = new MutationObserver(function () {
    const buttons = container.querySelectorAll('button');
    buttons.forEach(function (btn) {
      if (btn.offsetParent === null) return;
      const text = btn.textContent.replace(/\s+/g, ' ').trim();

      if (HIDDEN_EXACT.indexOf(text) !== -1) {
        let el = btn;
        while (el.parentElement) {
          const next = el.parentElement;
          if (next.classList.contains('msp-scrollable-container')
            || next.classList.contains('msp-layout-right')
            || next === container) {
            break;
          }
          el = next;
        }
        el.style.display = 'none';
        return;
      }

      for (let i = 0; i < HIDDEN_PREFIX.length; i++) {
        if (text.lastIndexOf(HIDDEN_PREFIX[i], 0) === 0) {
          const parent = btn.parentElement;
          if (parent) parent.style.display = 'none';
          return;
        }
      }
    });
  });
  observer.observe(container, { childList: true, subtree: true });
  return observer;
}

export function hideAxes(v) {
  if (!v || !v.plugin.canvas3d) return;
  try {
    v.plugin.canvas3d.setProps({
      camera: { helper: { axes: { name: 'off', params: {} } } }
    });
  } catch (e) { /* ignore */ }
}

export function applyCurrentColorTheme(v) {
  if (!v) return;
  const theme = state.settings.colorTheme;
  const structures = v.plugin.managers.structure.hierarchy.current.structures;
  structures.forEach(function (s) {
    v.plugin.managers.structure.component.updateRepresentationsTheme(
      s.components, { color: theme }
    );
  });
}

export function applyCanvasStyle(v) {
  if (!v || !v.plugin.canvas3d) return;
  const plugin = v.plugin;

  if (state.settings.style === 'illustrative') {
    try {
      plugin.managers.structure.component.setOptions({
        ignoreLight: true,
      });
    } catch (e) { /* ignore */ }

    plugin.canvas3d.setProps({
      postprocessing: {
        outline: {
          name: 'on',
          params: {
            scale: 0.65,
            color: 0x000000,
            threshold: 0.33,
            includeTransparent: true,
          },
        },
        occlusion: {
          name: 'on',
          params: {
            multiScale: { name: 'off', params: {} },
            radius: 5,
            bias: 0.8,
            blurKernelSize: 15,
            blurDepthBias: 0.5,
            samples: 32,
            resolutionScale: 1,
            color: 0x000000,
            transparentThreshold: 0.4,
          },
        },
        shadow: { name: 'off', params: {} },
      },
    });
  } else {
    try {
      plugin.managers.structure.component.setOptions({
        ignoreLight: false,
      });
    } catch (e) { /* ignore */ }

    plugin.canvas3d.setProps({
      postprocessing: {
        outline: { name: 'off', params: {} },
        occlusion: { name: 'off', params: {} },
        shadow: { name: 'off', params: {} },
      },
    });
  }
}

export function applyRepresentationTypeTo(v, typeName) {
  if (!v) return Promise.resolve();
  const plugin = v.plugin;

  function getComponents() {
    const components = [];
    plugin.managers.structure.hierarchy.current.structures.forEach(function (s) {
      s.components.forEach(function (c) { components.push(c); });
    });
    return components;
  }

  const allComponents = getComponents();
  if (allComponents.length === 0) return Promise.resolve();

  return Promise.resolve(
    plugin.managers.structure.component.removeRepresentations(allComponents)
  ).then(function () {
    // Reuse same components — they persist after removing representations
    if (allComponents.length === 0) return;
    return plugin.managers.structure.component.addRepresentation(
      allComponents, typeName
    );
  });
}

export function resetCameraOf(v) {
  if (!v || !v.plugin.canvas3d) return Promise.resolve();
  try {
    v.plugin.canvas3d.requestCameraReset({ durationMs: 0 });
  } catch (e) {
    try { v.plugin.canvas3d.requestCameraReset(); } catch (e2) { /* ignore */ }
  }
  return new Promise(function (resolve) {
    requestAnimationFrame(function () { setTimeout(resolve, 150); });
  });
}
