import { state, cardId, vscode } from './state.js';

// cacheInfo ({ uri, appearance }, optional): also persist the screenshot to
// the extension-side disk cache. The uri is captured by the caller because
// the toBlob callback is async — by the time it fires, a card deletion may
// have shifted indices, and a lookup via state.files[index] could associate
// the image with the wrong file.
export function takeScreenshotFrom(container, index, cacheInfo) {
  const canvas = container.querySelector('canvas');
  if (!canvas) return;
  try {
    canvas.toBlob(function (blob) {
      if (!blob) return;
      revokeScreenshot(index);
      const url = URL.createObjectURL(blob);
      state.screenshots[index] = url;
      updateCardImage(index, url);
      if (cacheInfo) {
        const reader = new FileReader();
        reader.onload = function () {
          vscode.postMessage({
            type: 'storeThumb',
            uri: cacheInfo.uri,
            appearance: cacheInfo.appearance,
            dataUrl: reader.result,
          });
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/webp', 0.8);
  } catch (e) { /* ignore */ }
}

export function revokeScreenshot(index) {
  if (state.screenshots[index]) {
    try { URL.revokeObjectURL(state.screenshots[index]); } catch (e) { /* ignore */ }
  }
}

export function updateCardImage(index, dataUrl) {
  const card = document.getElementById(cardId(index));
  if (!card) return;
  const imgArea = card.querySelector('.card-img-area');
  imgArea.classList.remove('loading');

  let img = imgArea.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    imgArea.appendChild(img);
  }
  img.src = dataUrl || blankPixel();
  img.alt = state.files[index].fileName;
}

export function markCardFailed(index) {
  const card = document.getElementById(cardId(index));
  if (!card) return;
  const imgArea = card.querySelector('.card-img-area');
  imgArea.classList.remove('loading');
  const existing = imgArea.querySelector('.fail-label');
  if (!existing) {
    const span = document.createElement('span');
    span.className = 'fail-label';
    span.textContent = 'Failed';
    imgArea.appendChild(span);
  }
}

export function blankPixel() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

// Resolve when the canvas paints a frame *after* this call — the real "the
// render is on screen" signal, replacing a fixed-duration guess. didDraw is a
// BehaviorSubject, so it replays the most recent (stale) draw synchronously on
// subscribe; skip that first value and resolve on the next genuine draw. Falls
// back on a timeout so a viewer that never redraws can't stall the queue.
export function waitForNextDraw(canvas3d, timeoutMs) {
  return new Promise(function (resolve) {
    let done = false;
    let primed = false;
    function finish() {
      if (done) return;
      done = true;
      try { sub.unsubscribe(); } catch (e) { /* ignore */ }
      clearTimeout(timer);
      resolve();
    }
    const timer = setTimeout(finish, timeoutMs);
    const sub = canvas3d.didDraw.subscribe(function () {
      if (!primed) { primed = true; return; }
      finish();
    });
  });
}

// Wait until the structure is both fully computed (state no longer busy) and
// actually painted to the canvas. Previously this waited a fixed rAF + 16ms
// after the state settled, which for small molecules was longer than the real
// render; now it waits for the genuine post-commit draw event instead.
export function waitForRender(viewer) {
  return new Promise(function (resolve) {
    const plugin = viewer.plugin;
    const isBusy = plugin.behaviors.state.isBusy;
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(hard);
      resolve();
    }

    // Overall safety cap so a malformed file can't stall the queue.
    const hard = setTimeout(finish, 3000);

    let busySub = null;
    function afterStateSettled() {
      if (done) return;
      if (busySub) { busySub.unsubscribe(); busySub = null; }
      const canvas3d = plugin.canvas3d;
      if (!canvas3d) { finish(); return; }
      waitForNextDraw(canvas3d, 1500).then(finish);
    }

    if (!isBusy.value) {
      afterStateSettled();
      return;
    }

    busySub = isBusy.subscribe(function (busy) {
      if (!busy) afterStateSettled();
    });
  });
}
