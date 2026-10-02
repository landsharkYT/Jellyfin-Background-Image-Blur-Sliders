import { AppearanceApi } from './api';
import { decorateActionSheet } from './actionSheet';
import { openTitleEditor } from './editor';
import type { EffectiveAppearance } from './model';
import { applyAppearance, clearAppearance, installStyles } from './style';

window.__backgroundBlurEditorDispose?.();

let retry = window.setInterval(() => {
  if (window.ApiClient?.getCurrentUserId()) {
    window.clearInterval(retry);
    retry = 0;
    void mount();
  }
}, 500);

if (window.ApiClient?.getCurrentUserId()) {
  window.clearInterval(retry);
  retry = 0;
  void mount();
}

window.__backgroundBlurEditorDispose = () => {
  if (retry !== 0) {
    window.clearInterval(retry);
  }
};

async function mount(): Promise<void> {
  installStyles();
  const api = new AppearanceApi();
  const session = await api.getSession();
  let current: EffectiveAppearance | null = null;
  let generation = 0;
  let scheduled = 0;
  let awaitingItemMenu = false;

  const sync = async (): Promise<void> => {
    const itemId = readItemId();
    if (itemId === null) {
      generation += 1;
      current = null;
      clearAppearance();
      removeActions();
      return;
    }

    if (current?.requestedItemId === itemId) {
      applyAppearance(current.values);
      return;
    }

    const ownGeneration = ++generation;
    try {
      const loaded = await api.getEffective(itemId);
      if (generation !== ownGeneration || readItemId() !== itemId) {
        return;
      }
      current = loaded;
      applyAppearance(loaded.values);
    } catch {
      if (generation === ownGeneration) {
        current = null;
        clearAppearance();
      }
    }
  };

  const scheduleSync = (): void => {
    if (scheduled !== 0) {
      return;
    }
    scheduled = window.setTimeout(() => {
      scheduled = 0;
      void sync();
    }, 40);
  };

  const observer = new MutationObserver(() => {
    scheduleSync();
    if (session.canManage && current !== null && awaitingItemMenu) {
      awaitingItemMenu = !decorateActionSheet(current);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const onNavigation = (): void => scheduleSync();
  window.addEventListener('hashchange', onNavigation);
  window.addEventListener('popstate', onNavigation);
  document.addEventListener('viewshow', onNavigation, true);
  document.addEventListener('viewbeforehide', onNavigation, true);

  const onClick = (event: MouseEvent): void => {
    if (!session.canManage || current === null || !(event.target instanceof Element)) {
      return;
    }

    const custom = event.target.closest<HTMLElement>('[data-bibe-edit-action]');
    if (custom !== null) {
      event.preventDefault();
      event.stopPropagation();
      const itemId = current.requestedItemId;
      const sheet = custom.closest<HTMLElement>('.actionSheet');
      if (sheet instanceof HTMLDialogElement) {
        sheet.close();
      } else {
        sheet?.remove();
      }
      void openTitleEditor(api, itemId, values => {
        applyAppearance(values);
        if (current !== null) {
          current = { ...current, values };
        }
      });
      return;
    }

    if (event.target.closest('.btnMoreCommands') !== null) {
      awaitingItemMenu = true;
      window.setTimeout(() => {
        if (current !== null) {
          awaitingItemMenu = !decorateActionSheet(current);
        }
      }, 20);
      window.setTimeout(() => {
        awaitingItemMenu = false;
      }, 1000);
    }
  };
  document.addEventListener('click', onClick, true);

  window.__backgroundBlurEditorDispose = () => {
    generation += 1;
    observer.disconnect();
    window.removeEventListener('hashchange', onNavigation);
    window.removeEventListener('popstate', onNavigation);
    document.removeEventListener('viewshow', onNavigation, true);
    document.removeEventListener('viewbeforehide', onNavigation, true);
    document.removeEventListener('click', onClick, true);
    if (scheduled !== 0) {
      window.clearTimeout(scheduled);
    }
    clearAppearance();
    removeActions();
    document.querySelector('.bibe-dialog-backdrop')?.remove();
    document.getElementById('bibe-styles')?.remove();
  };

  await sync();
}

function readItemId(): string | null {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) {
    return null;
  }
  const value = new URLSearchParams(hash.slice(queryIndex + 1)).get('id');
  return value !== null && /^[0-9a-f-]{32,36}$/i.test(value) ? value : null;
}

function removeActions(): void {
  for (const element of document.querySelectorAll('[data-bibe-edit-action]')) {
    element.remove();
  }
}
