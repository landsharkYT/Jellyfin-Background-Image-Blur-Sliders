// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { openTitleEditor } from '../src/editor';

describe('title editor loading', () => {
  afterEach(() => {
    document.body.replaceChildren();
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
});
