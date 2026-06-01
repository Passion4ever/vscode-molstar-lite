import { state } from './state.js';

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
  const canvas3d = v.plugin.canvas3d;
  try {
    // A plain camera reset reuses the current view direction (getFocus only
    // re-centers/zooms), so a viewer that was dragged keeps its rotation and
    // ends up mismatching its static thumbnail. Restore the default orientation
    // first (Mol*'s default camera snapshot), then re-fit — this keeps the
    // activated view aligned with the thumbnail every time. setState with
    // durationMs 0 applies instantly (no transition), before the reset runs.
    canvas3d.camera.setState({
      position: [0, 0, 100],
      up: [0, 1, 0],
      target: [0, 0, 0],
    }, 0);
    canvas3d.requestCameraReset({ durationMs: 0 });
  } catch (e) {
    try { canvas3d.requestCameraReset(); } catch (e2) { /* ignore */ }
  }
  return new Promise(function (resolve) {
    requestAnimationFrame(function () { setTimeout(resolve, 50); });
  });
}
