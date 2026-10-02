import type { EffectiveAppearance } from './model';
import { applyPanel } from './style';

const VIEWPORT_GUTTER = 10;

export function activateEditorAction(event: MouseEvent, openEditor: () => void): boolean {
  if (!(event.target instanceof Element)) {
    return false;
  }

  const action = event.target.closest<HTMLElement>('[data-bibe-edit-action]');
  if (action === null) {
    return false;
  }

  event.preventDefault();
  window.setTimeout(openEditor, 0);
  return true;
}

export function decorateActionSheet(current: EffectiveAppearance): boolean {
  const sheets = document.querySelectorAll<HTMLElement>('dialog.actionSheet, .actionSheet');
  const sheet = sheets.item(sheets.length - 1);
  if (sheet === null) {
    return false;
  }
  if (sheet.querySelector('[data-bibe-edit-action]') !== null) {
    return true;
  }

  const scroller = sheet.querySelector<HTMLElement>('.actionSheetScroller');
  if (scroller === null) {
    return false;
  }

  applyPanel(sheet, current.values);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'listItem listItem-button actionSheetMenuItem emby-button';
  button.dataset.bibeEditAction = 'true';
  button.innerHTML = '<span class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons blur_on" aria-hidden="true"></span><div class="listItemBody actionsheetListItemBody"><div class="listItemBodyText actionSheetItemText"></div></div>';
  const label = button.querySelector<HTMLElement>('.actionSheetItemText');
  if (label !== null) {
    label.textContent = current.viewedKind === 'Season' || current.viewedKind === 'Episode'
      ? 'Edit series background appearance'
      : 'Edit background appearance';
  }
  scroller.append(button);
  keepActionSheetInViewport(sheet);
  return true;
}

export function fitActionSheetToViewport(sheet: HTMLElement): void {
  if (sheet.classList.contains('actionsheet-fullscreen')) {
    return;
  }

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const availableWidth = Math.max(0, viewportWidth - (VIEWPORT_GUTTER * 2));
  const bounds = sheet.getBoundingClientRect();
  const width = Math.min(bounds.width, availableWidth);
  if (bounds.width > availableWidth) {
    sheet.style.maxWidth = `${availableWidth}px`;
  }

  const furthestLeft = Math.max(VIEWPORT_GUTTER, viewportWidth - VIEWPORT_GUTTER - width);
  const left = Math.min(Math.max(bounds.left, VIEWPORT_GUTTER), furthestLeft);
  if (Math.abs(left - bounds.left) >= 0.5) {
    sheet.style.left = `${left}px`;
  }
}

function keepActionSheetInViewport(sheet: HTMLElement): void {
  let pending = 0;
  const schedule = (): void => {
    if (pending !== 0) {
      return;
    }
    pending = window.setTimeout(() => {
      pending = 0;
      fitActionSheetToViewport(sheet);
    }, 0);
  };
  const viewport = window.visualViewport;
  const stop = (): void => {
    if (pending !== 0) {
      window.clearTimeout(pending);
    }
    window.removeEventListener('resize', schedule);
    viewport?.removeEventListener('resize', schedule);
  };

  window.addEventListener('resize', schedule);
  viewport?.addEventListener('resize', schedule);
  sheet.addEventListener('close', stop, { once: true });
  schedule();
}
