import type { EffectiveAppearance } from './model';
import { applyPanel } from './style';

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
  button.innerHTML = '<span class="listItemIcon material-icons" aria-hidden="true">blur_on</span><span class="listItemBody"></span>';
  const label = button.querySelector<HTMLElement>('.listItemBody');
  if (label !== null) {
    label.textContent = current.viewedKind === 'Season' || current.viewedKind === 'Episode'
      ? 'Edit series background appearance'
      : 'Edit background appearance';
  }
  scroller.append(button);
  return true;
}
