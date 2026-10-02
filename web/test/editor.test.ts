// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { openTitleEditor } from '../src/editor';

const editable = {
  requestedItemId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  ownerItemId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  titleName: 'Example',
  titleKind: 'Series' as const,
  viewedKind: 'Series' as const,
  hasBackdrop: true,
  global: {
    backdropOpacity: 100,
    backdropBlur: 0,
    panelGlassOpacity: 70,
    panelGlassBlur: 12
  },
  override: {
    backdropOpacity: null,
    backdropBlur: null,
    panelGlassOpacity: null,
    panelGlassBlur: null
  },
  effective: {
    backdropOpacity: 100,
    backdropBlur: 0,
    panelGlassOpacity: 70,
    panelGlassBlur: 12
  },
  revision: '0'
};

describe('title editor loading', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('appears immediately and shows a request failure instead of leaving a dead overlay', async () => {
    let rejectRequest: ((reason: Error) => void) | undefined;
    const request = new Promise<never>((_resolve, reject) => {
      rejectRequest = reject;
    });
    const api = {
      getEditor: vi.fn(() => request),
      saveTitle: vi.fn(),
      resetTitle: vi.fn()
    };

    const opening = openTitleEditor(api, 'series-id', vi.fn());

    expect(document.querySelector('.bibe-dialog')).not.toBeNull();
    expect(document.querySelector('.bibe-dialog-note')?.textContent).toBe('Loading settings...');

    rejectRequest?.(new Error('Request denied'));
    await opening;

    expect(document.querySelector('.bibe-dialog-note')?.textContent).toBe('Could not load background appearance.');
    expect(document.querySelector('.bibe-error')?.textContent).toBe('Request denied');
    const close = document.querySelector<HTMLButtonElement>('.bibe-load-close');
    expect(close?.hidden).toBe(false);
    close?.click();
    expect(document.querySelector('.bibe-dialog-backdrop')).toBeNull();
  });

  it('previews an enabled slider and uses consistent Jellyfin button classes', async () => {
    vi.stubGlobal('CSS', { supports: () => true });
    const preview = vi.fn();
    const api = {
      getEditor: vi.fn(async () => editable),
      saveTitle: vi.fn(),
      resetTitle: vi.fn()
    };

    await openTitleEditor(api, editable.requestedItemId, preview);

    const buttons = document.querySelectorAll<HTMLButtonElement>('.bibe-actions button');
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button.classList).toContain('emby-button');
      expect(button.classList).toContain('raised');
      expect(button.classList).toContain('block');
      expect(button.classList).toContain('formDialogFooterItem');
    }
    expect(document.querySelector('.bibe-cancel')?.classList).toContain('button-cancel');

    const inherit = document.querySelector<HTMLInputElement>('#backdropOpacity-inherit');
    const range = document.querySelector<HTMLInputElement>('#backdropOpacity-range');
    if (inherit === null || range === null) {
      throw new Error('Backdrop opacity controls were not rendered.');
    }
    inherit.checked = false;
    inherit.dispatchEvent(new Event('change'));
    range.value = '40';
    range.dispatchEvent(new Event('input'));

    expect(range.disabled).toBe(false);
    expect(preview).toHaveBeenLastCalledWith({
      backdropOpacity: 40,
      backdropBlur: 0,
      panelGlassOpacity: 70,
      panelGlassBlur: 12
    }, true);

    const blurInherit = document.querySelector<HTMLInputElement>('#backdropBlur-inherit');
    const blurRange = document.querySelector<HTMLInputElement>('#backdropBlur-range');
    if (blurInherit === null || blurRange === null) {
      throw new Error('Backdrop blur controls were not rendered.');
    }
    blurInherit.checked = false;
    blurInherit.dispatchEvent(new Event('change'));
    blurRange.value = '0';
    blurRange.dispatchEvent(new Event('input'));

    expect(preview).toHaveBeenLastCalledWith({
      backdropOpacity: 40,
      backdropBlur: 0,
      panelGlassOpacity: 70,
      panelGlassBlur: 12
    }, false);
  });
});
