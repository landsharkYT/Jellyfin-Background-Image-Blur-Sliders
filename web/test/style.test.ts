// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyAppearance, clearAppearance } from '../src/style';

describe('detail-page appearance', () => {
  afterEach(() => {
    clearAppearance();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('applies live values to Jellyfin visible backdrop outside the detail page', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    document.body.innerHTML = `
      <div class="backdropContainer"><div class="backdropImage"></div></div>
      <main id="itemDetailPage"><div class="detailRibbon"></div></main>`;

    applyAppearance({
      backdropOpacity: 40,
      backdropBlur: 18,
      panelGlassOpacity: 55,
      panelGlassBlur: 9
    });

    const backdrop = document.querySelector<HTMLElement>('.backdropContainer .backdropImage');
    expect(backdrop?.classList).toContain('bibe-backdrop');
    expect(backdrop?.style.getPropertyValue('--bibe-backdrop-opacity')).toBe('40');
    expect(backdrop?.style.getPropertyValue('--bibe-backdrop-blur')).toBe('18');
  });
});
