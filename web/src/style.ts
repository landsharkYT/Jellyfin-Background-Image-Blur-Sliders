import type { Appearance } from './model';

const STYLE_ID = 'bibe-styles';
const PANEL_SELECTORS = ['.detailRibbon', '.detailPageSecondaryContainer'];

const css = `
.bibe-backdrop,
html .backdropContainer .bibe-backdrop,
#itemDetailPage #itemBackdrop.bibe-backdrop {
  opacity: calc(var(--bibe-backdrop-opacity, 100) / 100) !important;
  filter: var(--bibe-base-backdrop-filter, ) blur(calc(var(--bibe-backdrop-blur, 0) * 1px)) !important;
  transition: opacity 150ms ease, filter 150ms ease;
}
.bibe-panel,
#itemDetailPage .detailRibbon.bibe-panel,
#itemDetailPage .detailPageSecondaryContainer.bibe-panel,
html .actionSheet.bibe-panel {
  background-color: rgb(var(--bibe-panel-rgb, 24 24 24) / calc(var(--bibe-panel-opacity, 70) / 100)) !important;
  -webkit-backdrop-filter: blur(calc(var(--bibe-panel-blur, 0) * 1px)) !important;
  backdrop-filter: blur(calc(var(--bibe-panel-blur, 0) * 1px)) !important;
  transition: background-color 150ms ease, backdrop-filter 150ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .bibe-backdrop, .bibe-panel { transition: none !important; }
}
.bibe-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(0 0 0 / 55%);
}
.bibe-dialog {
  width: min(38rem, 100%);
  max-height: min(48rem, 92vh);
  overflow: auto;
  color: #fff;
  background: rgb(28 28 30 / 96%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 1rem;
  box-shadow: 0 1.5rem 5rem rgb(0 0 0 / 55%);
  padding: 1.25rem;
}
.bibe-dialog h2 { margin: 0 0 .25rem; }
.bibe-dialog-note { opacity: .72; margin: 0 0 1rem; }
.bibe-control { display: grid; grid-template-columns: 1fr 7rem; gap: .35rem 1rem; margin: 1rem 0; align-items: center; }
.bibe-control label { font-weight: 600; }
.bibe-control input[type=range] { width: 100%; }
.bibe-number { display: flex; align-items: center; gap: .35rem; }
.bibe-number input { width: 4.5rem; }
.bibe-inherit { grid-column: 1 / -1; font-size: .9rem; opacity: .85; }
.bibe-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .6rem; margin-top: 1.2rem; }
.bibe-actions .formDialogFooterItem {
  flex: 1 1 0;
  width: auto;
  min-width: 8rem;
  max-width: none;
  margin: 0 !important;
}
.bibe-error { color: #ffb4ab; min-height: 1.25rem; }
.bibe-admin { max-width: 72rem; margin: 0 auto; padding: 1rem; }
.bibe-admin-grid { display: grid; grid-template-columns: minmax(18rem, 1fr) minmax(18rem, 1fr); gap: 1.25rem; }
.bibe-card { padding: 1.1rem; border: 1px solid rgb(255 255 255 / 16%); border-radius: .8rem; background: rgb(255 255 255 / 5%); }
.bibe-preview { position: relative; min-height: 12rem; display: grid; place-items: center; border-radius: .8rem; overflow: hidden; }
.bibe-preview-image { position: absolute; inset: -3rem; background: linear-gradient(135deg,#8c1828,#44230c 55%,#170609); }
.bibe-preview-panel { position: relative; padding: 1rem 1.5rem; border-radius: .7rem; color: white; }
.bibe-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.bibe-table th, .bibe-table td { padding: .7rem; text-align: left; border-bottom: 1px solid rgb(255 255 255 / 12%); }
.bibe-missing { color: #ffb4ab; }
@media (max-width: 700px) { .bibe-admin-grid { grid-template-columns: 1fr; } .bibe-control { grid-template-columns: 1fr; } }
`;

export function installStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.append(style);
}

export function applyAppearance(values: Appearance, preserveBackdropBlur: boolean): void {
  const page = findDetailPage();
  if (page === null) {
    return;
  }

  const backdrops = new Set<HTMLElement>([
    ...document.querySelectorAll<HTMLElement>('.backdropContainer .backdropImage'),
    ...page.querySelectorAll<HTMLElement>('#itemBackdrop, .backdropImage')
  ]);
  for (const backdrop of backdrops) {
    const alreadyStyled = backdrop.classList.contains('bibe-backdrop');
    const themeFilter = alreadyStyled
      ? backdrop.style.getPropertyValue('--bibe-theme-backdrop-filter')
      : normalizeFilter(window.getComputedStyle(backdrop).filter);
    if (!alreadyStyled) {
      backdrop.style.setProperty('--bibe-theme-backdrop-filter', themeFilter);
    }
    backdrop.style.setProperty(
      '--bibe-base-backdrop-filter',
      preserveBackdropBlur ? themeFilter : removeBlur(themeFilter)
    );
    backdrop.classList.add('bibe-backdrop');
    backdrop.style.setProperty('--bibe-backdrop-opacity', String(values.backdropOpacity));
    backdrop.style.setProperty('--bibe-backdrop-blur', String(values.backdropBlur));
  }

  for (const selector of PANEL_SELECTORS) {
    for (const panel of page.querySelectorAll<HTMLElement>(selector)) {
      applyPanel(panel, values);
    }
  }
}

export function applyPanel(panel: HTMLElement, values: Appearance): void {
  panel.classList.add('bibe-panel');
  panel.style.setProperty('--bibe-panel-rgb', sampleBaseRgb());
  panel.style.setProperty('--bibe-panel-opacity', String(values.panelGlassOpacity));
  panel.style.setProperty('--bibe-panel-blur', supportsPanelBlur() ? String(values.panelGlassBlur) : '0');
}

export function clearAppearance(): void {
  for (const element of document.querySelectorAll<HTMLElement>('.bibe-backdrop, .bibe-panel')) {
    element.classList.remove('bibe-backdrop', 'bibe-panel');
    for (const property of [
      '--bibe-backdrop-opacity',
      '--bibe-backdrop-blur',
      '--bibe-theme-backdrop-filter',
      '--bibe-base-backdrop-filter',
      '--bibe-panel-rgb',
      '--bibe-panel-opacity',
      '--bibe-panel-blur'
    ]) {
      element.style.removeProperty(property);
    }
  }
}

function removeBlur(filter: string): string {
  return normalizeFilter(filter.replace(/\bblur\([^)]*\)/giu, ''));
}

function normalizeFilter(filter: string): string {
  return filter === 'none' ? '' : filter.replace(/\s+/gu, ' ').trim();
}

export function supportsPanelBlur(): boolean {
  return CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
}

function findDetailPage(): HTMLElement | null {
  const pages = document.querySelectorAll<HTMLElement>('#itemDetailPage');
  for (const page of pages) {
    if (!page.classList.contains('hide') && page.getClientRects().length > 0) {
      return page;
    }
  }
  return pages.item(pages.length - 1);
}

function sampleBaseRgb(): string {
  const color = window.getComputedStyle(document.body).backgroundColor;
  const match = /^rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i.exec(color);
  return match?.[1] !== undefined && match[2] !== undefined && match[3] !== undefined
    ? `${match[1]} ${match[2]} ${match[3]}`
    : '24 24 24';
}
