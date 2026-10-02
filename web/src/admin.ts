import { ApiConflictError, AppearanceApi } from './api';
import { openTitleEditor } from './editor';
import type { AdminSnapshot, Appearance, ConfiguredTitle } from './model';
import { installStyles, supportsPanelBlur } from './style';

type GlobalField = 'backdropOpacity' | 'backdropBlur' | 'panelGlassOpacity' | 'panelGlassBlur';

const globalFields: readonly Readonly<{ key: GlobalField; label: string; unit: string; maximum: number }>[] = [
  { key: 'backdropOpacity', label: 'Backdrop opacity', unit: '%', maximum: 100 },
  { key: 'backdropBlur', label: 'Backdrop blur', unit: 'px', maximum: 50 },
  { key: 'panelGlassOpacity', label: 'Panel glass opacity', unit: '%', maximum: 100 },
  { key: 'panelGlassBlur', label: 'Panel glass blur', unit: 'px', maximum: 50 }
];

const onPageShow = (): void => {
  const root = document.getElementById('BackgroundBlurEditorConfigPage');
  if (root !== null) {
    void initialize(root);
  }
};

document.addEventListener('pageshow', onPageShow);
onPageShow();

async function initialize(page: HTMLElement): Promise<void> {
  if (page.dataset.bibeInitialized === 'true') {
    return;
  }
  page.dataset.bibeInitialized = 'true';
  installStyles();
  const api = new AppearanceApi();
  const host = requireElement<HTMLElement>(page, '.bibe-admin-host');
  host.innerHTML = `
    <main class="bibe-admin">
      <h1>Background Image Blur Editor</h1>
      <p>Set the global glass treatment and manage movie or series overrides.</p>
      <div class="bibe-admin-grid">
        <form class="bibe-card bibe-global-form">
          <h2>Global appearance</h2>
          <div class="bibe-global-controls"></div>
          <p class="bibe-error" role="alert"></p>
          <button is="emby-button" type="submit" class="raised button-submit">Save global appearance</button>
        </form>
        <section class="bibe-card">
          <h2>Preview</h2>
          <div class="bibe-preview"><div class="bibe-preview-image"></div><div class="bibe-preview-panel">Text and controls stay sharp</div></div>
          <p class="bibe-dialog-note bibe-blur-support"></p>
        </section>
      </div>
      <section class="bibe-card" style="margin-top:1.25rem">
        <h2>Configured titles</h2>
        <label for="bibe-search">Search</label>
        <input is="emby-input" id="bibe-search" type="search" placeholder="Movie or series name">
        <div class="bibe-title-table"></div>
      </section>
    </main>`;

  const controls = requireElement<HTMLElement>(host, '.bibe-global-controls');
  for (const field of globalFields) {
    controls.insertAdjacentHTML('beforeend', globalControlMarkup(field));
  }

  const blurNote = requireElement<HTMLElement>(host, '.bibe-blur-support');
  blurNote.textContent = supportsPanelBlur()
    ? 'Panel backdrop blur is supported in this browser.'
    : 'Panel backdrop blur is unavailable in this browser; opacity still works.';

  let snapshot: AdminSnapshot;
  try {
    snapshot = await api.getSnapshot();
  } catch (error: unknown) {
    host.textContent = error instanceof Error ? error.message : 'Could not load plugin settings.';
    return;
  }

  populateGlobal(host, snapshot.global.values);
  renderPreview(host, snapshot.global.values);
  const refreshTitles = async (): Promise<void> => {
    snapshot = await api.getSnapshot(requireInput(host, 'bibe-search').value);
    renderTitles(host, snapshot, api, refreshTitles);
  };
  renderTitles(host, snapshot, api, refreshTitles);

  for (const field of globalFields) {
    const range = requireInput(host, `${field.key}-range`);
    const number = requireInput(host, `${field.key}-number`);
    range.addEventListener('input', () => {
      number.value = range.value;
      renderPreview(host, readGlobal(host));
    });
    number.addEventListener('input', () => {
      range.value = number.value;
      renderPreview(host, readGlobal(host));
    });
  }

  const form = requireElement<HTMLFormElement>(host, '.bibe-global-form');
  const error = requireElement<HTMLElement>(form, '.bibe-error');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    setButtons(form, true);
    error.textContent = '';
    try {
      const saved = await api.saveGlobal(readGlobal(host), snapshot.global.revision);
      snapshot = { ...snapshot, global: saved };
      populateGlobal(host, saved.values);
      renderPreview(host, saved.values);
    } catch (caught: unknown) {
      if (caught instanceof ApiConflictError) {
        error.textContent = 'Global settings changed in another editor. Reloading saved values.';
        snapshot = await api.getSnapshot(requireInput(host, 'bibe-search').value);
        populateGlobal(host, snapshot.global.values);
        renderPreview(host, snapshot.global.values);
      } else {
        error.textContent = caught instanceof Error ? caught.message : 'Could not save global settings.';
      }
    } finally {
      setButtons(form, false);
    }
  });

  let searchTimer = 0;
  requireInput(host, 'bibe-search').addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(async () => {
      await refreshTitles();
    }, 180);
  });
}

function renderTitles(
  root: HTMLElement,
  snapshot: AdminSnapshot,
  api: AppearanceApi,
  refresh: () => Promise<void>
): void {
  const host = requireElement<HTMLElement>(root, '.bibe-title-table');
  host.replaceChildren();
  if (snapshot.titles.length === 0) {
    host.textContent = 'No title overrides match this search.';
    return;
  }

  const table = document.createElement('table');
  table.className = 'bibe-table';
  table.innerHTML = '<thead><tr><th>Title</th><th>Backdrop</th><th>Panel glass</th><th>Actions</th></tr></thead><tbody></tbody>';
  const body = requireElement<HTMLTableSectionElement>(table, 'tbody');
  for (const title of snapshot.titles) {
    body.append(createTitleRow(title, api, refresh));
  }
  host.append(table);
}

function createTitleRow(title: ConfiguredTitle, api: AppearanceApi, refresh: () => Promise<void>): HTMLTableRowElement {
  const row = document.createElement('tr');
  const nameCell = document.createElement('td');
  nameCell.textContent = title.titleName;
  if (title.isMissing) {
    nameCell.className = 'bibe-missing';
    nameCell.textContent += ' (missing)';
  }

  const backdropCell = document.createElement('td');
  backdropCell.textContent = `${title.effective.backdropOpacity}% / ${title.effective.backdropBlur}px`;
  const panelCell = document.createElement('td');
  panelCell.textContent = `${title.effective.panelGlassOpacity}% / ${title.effective.panelGlassBlur}px`;
  const actions = document.createElement('td');

  if (!title.isMissing) {
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => {
      void openTitleEditor(api, title.itemId, () => undefined, () => void refresh());
    });
    actions.append(edit);
  }

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = title.isMissing ? 'Remove' : 'Reset';
  reset.addEventListener('click', async () => {
    if (window.confirm(`${reset.textContent} ${title.titleName}?`)) {
      await api.resetTitle(title.itemId, title.revision);
      await refresh();
    }
  });
  actions.append(reset);
  row.append(nameCell, backdropCell, panelCell, actions);
  return row;
}

function globalControlMarkup(field: Readonly<{ key: GlobalField; label: string; unit: string; maximum: number }>): string {
  return `<div class="bibe-control">
    <label for="${field.key}-range">${field.label}</label>
    <span class="bibe-number"><input id="${field.key}-number" type="number" min="0" max="${field.maximum}" step="1"><span>${field.unit}</span></span>
    <input id="${field.key}-range" type="range" min="0" max="${field.maximum}" step="1">
  </div>`;
}

function populateGlobal(root: ParentNode, values: Appearance): void {
  for (const field of globalFields) {
    requireInput(root, `${field.key}-range`).value = String(values[field.key]);
    requireInput(root, `${field.key}-number`).value = String(values[field.key]);
  }
}

function readGlobal(root: ParentNode): Appearance {
  return {
    backdropOpacity: Number.parseInt(requireInput(root, 'backdropOpacity-number').value, 10),
    backdropBlur: Number.parseInt(requireInput(root, 'backdropBlur-number').value, 10),
    panelGlassOpacity: Number.parseInt(requireInput(root, 'panelGlassOpacity-number').value, 10),
    panelGlassBlur: Number.parseInt(requireInput(root, 'panelGlassBlur-number').value, 10)
  };
}

function renderPreview(root: ParentNode, values: Appearance): void {
  const image = requireElement<HTMLElement>(root, '.bibe-preview-image');
  const panel = requireElement<HTMLElement>(root, '.bibe-preview-panel');
  image.style.opacity = String(values.backdropOpacity / 100);
  image.style.filter = `blur(${values.backdropBlur}px)`;
  panel.style.backgroundColor = `rgb(24 24 24 / ${values.panelGlassOpacity}%)`;
  panel.style.backdropFilter = supportsPanelBlur() ? `blur(${values.panelGlassBlur}px)` : 'none';
}

function setButtons(root: ParentNode, disabled: boolean): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>('button')) {
    button.disabled = disabled;
  }
}

function requireInput(root: ParentNode, id: string): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>(`#${id}`);
  if (input === null) {
    throw new Error(`Missing setting input ${id}.`);
  }
  return input;
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing settings element ${selector}.`);
  }
  return element;
}
