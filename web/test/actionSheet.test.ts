// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activateEditorAction, decorateActionSheet } from '../src/actionSheet';
import type { EffectiveAppearance } from '../src/model';

const appearance = {
  requestedItemId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  ownerItemId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  titleName: 'Example movie',
  titleKind: 'Movie',
  viewedKind: 'Movie',
  hasBackdrop: true,
  backdropBlurInherited: true,
  values: {
    backdropOpacity: 100,
    backdropBlur: 0,
    panelGlassOpacity: 70,
    panelGlassBlur: 12
  }
} satisfies EffectiveAppearance;

describe('action-sheet decoration', () => {
  beforeEach(() => {
    vi.stubGlobal('CSS', { supports: () => false });
    document.body.innerHTML = `
      <dialog class="actionSheet">
        <div class="actionSheetContent">
          <div class="actionSheetScroller">
            <button class="actionSheetMenuItem" data-id="native-one">Native one</button>
            <button class="actionSheetMenuItem" data-id="native-two">Native two</button>
          </div>
        </div>
      </dialog>`;
  });

  it('adds one editor command inside the native scroller without displacing native commands', () => {
    expect(decorateActionSheet(appearance)).toBe(true);

    const sheet = document.querySelector('.actionSheet');
    const scroller = document.querySelector('.actionSheetScroller');
    expect(sheet?.children).toHaveLength(1);
    expect(scroller?.querySelectorAll(':scope > .actionSheetMenuItem')).toHaveLength(3);
    expect(scroller?.querySelector('[data-id="native-one"]')).not.toBeNull();
    expect(scroller?.querySelector('[data-id="native-two"]')).not.toBeNull();
    expect(scroller?.querySelectorAll('[data-bibe-edit-action]')).toHaveLength(1);
    expect(scroller?.querySelector('[data-bibe-edit-action] .actionsheetMenuItemIcon.blur_on')).not.toBeNull();
    expect(scroller?.querySelector('[data-bibe-edit-action] .actionsheetListItemBody')).not.toBeNull();
    expect(scroller?.querySelector('[data-bibe-edit-action] .actionSheetItemText')?.textContent)
      .toBe('Edit background appearance');
  });

  it('waits for Jellyfin to create its native scroller', () => {
    document.querySelector('.actionSheetContent')?.remove();

    expect(decorateActionSheet(appearance)).toBe(false);
    expect(document.querySelector('[data-bibe-edit-action]')).toBeNull();
  });
});

describe('editor command activation', () => {
  it('allows Jellyfin to receive the click and remove its modal backdrop', () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div class="dialogContainer">
        <dialog class="actionSheet">
          <div class="actionSheetScroller">
            <button data-bibe-edit-action="true"><span class="label">Edit</span></button>
          </div>
        </dialog>
      </div>`;
    const sheet = document.querySelector<HTMLDialogElement>('.actionSheet');
    const label = document.querySelector<HTMLElement>('.label');
    if (sheet === null || label === null) {
      throw new Error('Test action sheet was not created.');
    }
    sheet.close = vi.fn();
    const opened = vi.fn();
    sheet.addEventListener('click', () => sheet.closest('.dialogContainer')?.remove());
    const listener = (event: MouseEvent): void => {
      activateEditorAction(event, opened);
    };
    document.addEventListener('click', listener, true);

    label.click();
    vi.advanceTimersByTime(0);

    document.removeEventListener('click', listener, true);
    expect(document.querySelector('.dialogContainer')).toBeNull();
    expect(sheet.close).not.toHaveBeenCalled();
    expect(opened).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
