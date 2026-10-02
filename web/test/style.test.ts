// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyAppearance, clearAppearance, installStyles } from '../src/style';

describe('detail-page appearance', () => {
  afterEach(() => {
    clearAppearance();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('applies live values to Jellyfin visible backdrop outside the detail page', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    document.body.innerHTML = `
      <div class="backdropContainer"><div class="backdropImage" style="filter: blur(24px) saturate(1.35) contrast(1.02) brightness(.55)"></div></div>
      <main id="itemDetailPage"><div class="detailRibbon"></div></main>`;

    applyAppearance({
      backdropOpacity: 40,
      backdropBlur: 18,
      panelGlassOpacity: 55,
      panelGlassBlur: 9
    }, false);

    const backdrop = document.querySelector<HTMLElement>('.backdropContainer .backdropImage');
    expect(backdrop?.classList).toContain('bibe-backdrop');
    expect(backdrop?.style.getPropertyValue('--bibe-backdrop-opacity')).toBe('40');
    expect(backdrop?.style.getPropertyValue('--bibe-backdrop-blur')).toBe('18');
    expect(backdrop?.style.getPropertyValue('--bibe-base-backdrop-filter')).toBe('saturate(1.35) contrast(1.02) brightness(.55)');
    expect(backdrop?.style.getPropertyValue('--bibe-base-backdrop-filter')).not.toContain('blur(');

    const panel = document.querySelector<HTMLElement>('.detailRibbon');
    expect(panel?.style.getPropertyValue('--bibe-panel-opacity')).toBe('55');
    expect(panel?.style.getPropertyValue('--bibe-panel-blur')).toBe('9');
  });

  it('preserves theme blur when backdrop blur is inherited', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    document.body.innerHTML = `
      <div class="backdropContainer"><div class="backdropImage" style="filter: blur(24px) saturate(1.35)"></div></div>
      <main id="itemDetailPage"></main>`;

    applyAppearance({
      backdropOpacity: 100,
      backdropBlur: 0,
      panelGlassOpacity: 70,
      panelGlassBlur: 12
    }, true);

    const backdrop = document.querySelector<HTMLElement>('.backdropImage');
    expect(backdrop?.style.getPropertyValue('--bibe-base-backdrop-filter')).toBe('blur(24px) saturate(1.35)');
  });

  it('installs selectors that outrank the active detail-page theme', () => {
    installStyles();
    const rules = document.querySelector('#bibe-styles')?.textContent ?? '';

    expect(rules).toContain('#itemDetailPage .detailRibbon.bibe-panel');
    expect(rules).toContain('html .backdropContainer .bibe-backdrop');
  });
});
