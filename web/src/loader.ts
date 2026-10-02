import { AppearanceApi } from './api';
import { activateEditorAction, decorateActionSheet } from './actionSheet';
import { openTitleEditor } from './editor';
import { DetailAppearanceSession } from './navigation';
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
  let scheduled = 0;
  let awaitingItemMenu = false;
  const appearances = new DetailAppearanceSession({
    load: (itemId) => api.getEffective(itemId),
    render: (appearance) => applyAppearance(appearance.values, appearance.backdropBlurInherited),
    clear: clearAppearance
  });

  const sync = (): void => {
    const itemId = readItemId();
    appearances.sync(itemId);
    if (itemId === null) {
      removeActions();
    }
  };

  const scheduleSync = (): void => {
    if (scheduled !== 0) {
      return;
    }
    scheduled = window.setTimeout(() => {
      scheduled = 0;
      sync();
    }, 40);
  };

  const observer = new MutationObserver(() => {
    scheduleSync();
    const current = appearances.current;
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
    const current = appearances.current;
    if (!session.canManage || current === null || !(event.target instanceof Element)) {
      return;
    }

    const requestedItemId = current.requestedItemId;
    if (activateEditorAction(event, () => {
      void openTitleEditor(api, requestedItemId, (values, backdropBlurInherited) => {
        appearances.updateCurrent(values, backdropBlurInherited);
      });
    })) {
      return;
    }

    if (event.target.closest('.btnMoreCommands') !== null) {
      awaitingItemMenu = true;
      window.setTimeout(() => {
        const current = appearances.current;
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
    observer.disconnect();
    window.removeEventListener('hashchange', onNavigation);
    window.removeEventListener('popstate', onNavigation);
    document.removeEventListener('viewshow', onNavigation, true);
    document.removeEventListener('viewbeforehide', onNavigation, true);
    document.removeEventListener('click', onClick, true);
    if (scheduled !== 0) {
      window.clearTimeout(scheduled);
    }
    appearances.dispose();
    removeActions();
    document.querySelector('.bibe-dialog-backdrop')?.remove();
    document.getElementById('bibe-styles')?.remove();
  };

  sync();
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
