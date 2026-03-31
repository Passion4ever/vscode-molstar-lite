import { state, cardId } from './state.js';

export function takeScreenshotFrom(container, index) {
  const canvas = container.querySelector('canvas');
  if (!canvas) return;
  try {
    canvas.toBlob(function (blob) {
      if (!blob) return;
      revokeScreenshot(index);
      const url = URL.createObjectURL(blob);
      state.screenshots[index] = url;
      updateCardImage(index, url);
    }, 'image/png');
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

export function waitForRender() {
  return new Promise(function (resolve) {
    const isBusy = state.thumbViewer.plugin.behaviors.state.isBusy;
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
