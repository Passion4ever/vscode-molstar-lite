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

export function waitForRender(viewer) {
  return new Promise(function (resolve) {
    const isBusy = viewer.plugin.behaviors.state.isBusy;
    let settled = false;

    function onReady() {
      if (settled) return;
      settled = true;
      requestAnimationFrame(function () { setTimeout(resolve, 16); });
    }

    // Timeout to prevent a bad file from stalling the entire queue
    setTimeout(onReady, 3000);

    if (!isBusy.value) {
      onReady();
      return;
    }

    const sub = isBusy.subscribe(function (busy) {
      if (!busy) {
        sub.unsubscribe();
        onReady();
      }
    });
  });
}
