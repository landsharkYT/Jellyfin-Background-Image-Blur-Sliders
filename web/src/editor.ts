import { ApiConflictError, AppearanceApi } from './api';
import {
  type Appearance,
  type AppearanceOverride,
  type EditableAppearance,
  mergeAppearance
} from './model';
import { supportsPanelBlur } from './style';

type Preview = (values: Appearance) => void;
type FieldName = 'backdropOpacity' | 'backdropBlur' | 'panelGlassOpacity' | 'panelGlassBlur';
type EditorApi = Pick<AppearanceApi, 'getEditor' | 'saveTitle' | 'resetTitle'>;

const fields: readonly Readonly<{ key: FieldName; label: string; unit: string; maximum: number }>[] = [
  { key: 'backdropOpacity', label: 'Backdrop opacity', unit: '%', maximum: 100 },
  { key: 'backdropBlur', label: 'Backdrop blur', unit: 'px', maximum: 50 },
  { key: 'panelGlassOpacity', label: 'Panel glass opacity', unit: '%', maximum: 100 },
  { key: 'panelGlassBlur', label: 'Panel glass blur', unit: 'px', maximum: 50 }
];

export async function openTitleEditor(
  api: EditorApi,
  itemId: string,
  preview: Preview,
  onCommitted: () => void = () => undefined
): Promise<void> {
  document.querySelector('.bibe-dialog-backdrop')?.remove();
  const loading = document.createElement('div');
  loading.className = 'bibe-dialog-backdrop';
  loading.innerHTML = `
    <section class="bibe-dialog" role="dialog" aria-modal="true" aria-labelledby="bibe-editor-title">
      <h2 id="bibe-editor-title">Background appearance</h2>
      <p class="bibe-dialog-note">Loading settings...</p>
      <p class="bibe-error" role="alert"></p>
      <div class="bibe-actions">
        <button is="emby-button" type="button" class="bibe-load-close" hidden>Close</button>
      </div>
    </section>`;
  const note = requireElement<HTMLElement>(loading, '.bibe-dialog-note');
  const error = requireElement<HTMLElement>(loading, '.bibe-error');
  const close = requireElement<HTMLButtonElement>(loading, '.bibe-load-close');
  close.addEventListener('click', () => loading.remove());
  document.body.append(loading);

  try {
    const editable = await api.getEditor(itemId);
    loading.remove();
    showEditor(api, editable, preview, onCommitted);
  } catch (caught: unknown) {
    note.textContent = 'Could not load background appearance.';
    error.textContent = caught instanceof Error ? caught.message : 'The server request failed.';
    close.hidden = false;
    close.focus();
  }
}

function showEditor(
  api: EditorApi,
  editable: EditableAppearance,
  preview: Preview,
  onCommitted: () => void
): void {
  document.querySelector('.bibe-dialog-backdrop')?.remove();
  const backdrop = document.createElement('div');
  backdrop.className = 'bibe-dialog-backdrop';
  backdrop.innerHTML = `
    <section class="bibe-dialog" role="dialog" aria-modal="true" aria-labelledby="bibe-editor-title">
      <h2 id="bibe-editor-title"></h2>
      <p class="bibe-dialog-note"></p>
      <form class="bibe-editor-form">
        <div class="bibe-controls"></div>
        <p class="bibe-error" role="alert"></p>
        <div class="bibe-actions">
          <button is="emby-button" type="button" class="raised bibe-reset">Reset title</button>
          <button is="emby-button" type="button" class="bibe-cancel">Cancel</button>
          <button is="emby-button" type="submit" class="raised button-submit">Save</button>
        </div>
      </form>
    </section>`;

  const title = requireElement<HTMLElement>(backdrop, '#bibe-editor-title');
  title.textContent = editable.viewedKind === 'Season' || editable.viewedKind === 'Episode'
    ? `Edit series background appearance: ${editable.titleName}`
    : `Edit background appearance: ${editable.titleName}`;

  const note = requireElement<HTMLElement>(backdrop, '.bibe-dialog-note');
  const notes: string[] = [];
  if (!editable.hasBackdrop) {
    notes.push('This title has no backdrop image.');
  }
  if (!supportsPanelBlur()) {
    notes.push('This browser does not support panel backdrop blur.');
  }
  note.textContent = notes.join(' ');

  const controls = requireElement<HTMLElement>(backdrop, '.bibe-controls');
  for (const field of fields) {
    controls.insertAdjacentHTML('beforeend', controlMarkup(field));
    initializeControl(controls, field, editable);
  }

  const error = requireElement<HTMLElement>(backdrop, '.bibe-error');
  const form = requireElement<HTMLFormElement>(backdrop, '.bibe-editor-form');
  const cancel = requireElement<HTMLButtonElement>(backdrop, '.bibe-cancel');
  const reset = requireElement<HTMLButtonElement>(backdrop, '.bibe-reset');

  const restoreAndClose = (): void => {
    preview(editable.effective);
    backdrop.remove();
  };

  for (const field of fields) {
    const range = requireInput(controls, `${field.key}-range`);
    const number = requireInput(controls, `${field.key}-number`);
    const inherit = requireInput(controls, `${field.key}-inherit`);
    range.addEventListener('input', () => {
      number.value = range.value;
      preview(mergeAppearance(editable.global, readOverride(controls, editable)));
    });
    number.addEventListener('input', () => {
      range.value = number.value;
      preview(mergeAppearance(editable.global, readOverride(controls, editable)));
    });
    inherit.addEventListener('change', () => {
      range.disabled = inherit.checked || isUnavailable(field.key, editable);
      number.disabled = inherit.checked || isUnavailable(field.key, editable);
      preview(mergeAppearance(editable.global, readOverride(controls, editable)));
    });
  }

  cancel.addEventListener('click', restoreAndClose);
  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) {
      restoreAndClose();
    }
  });

  reset.addEventListener('click', async () => {
    if (!window.confirm(`Reset ${editable.titleName} to the global appearance?`)) {
      return;
    }
    setBusy(form, true);
    try {
      const saved = await api.resetTitle(editable.ownerItemId, editable.revision);
      preview(saved.effective);
      backdrop.remove();
      onCommitted();
    } catch (caught: unknown) {
      await handleError(caught, api, editable, preview, onCommitted, error, backdrop);
    } finally {
      setBusy(form, false);
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setBusy(form, true);
    error.textContent = '';
    try {
      const saved = await api.saveTitle(
        editable.ownerItemId,
        readOverride(controls, editable),
        editable.revision
      );
      preview(saved.effective);
      backdrop.remove();
      onCommitted();
    } catch (caught: unknown) {
      await handleError(caught, api, editable, preview, onCommitted, error, backdrop);
    } finally {
      setBusy(form, false);
    }
  });

  document.body.append(backdrop);
  requireInput(controls, 'backdropOpacity-range').focus();
}

async function handleError(
  caught: unknown,
  api: EditorApi,
  editable: EditableAppearance,
  preview: Preview,
  onCommitted: () => void,
  error: HTMLElement,
  backdrop: HTMLElement
): Promise<void> {
  if (caught instanceof ApiConflictError) {
    error.textContent = 'These settings changed in another editor.';
    if (window.confirm('Reload the current saved values?')) {
      const latest = await api.getEditor(editable.ownerItemId);
      backdrop.remove();
      preview(latest.effective);
      showEditor(api, latest, preview, onCommitted);
    }
    return;
  }
  error.textContent = caught instanceof Error ? caught.message : 'Could not save the appearance.';
}

function controlMarkup(field: Readonly<{ key: FieldName; label: string; unit: string; maximum: number }>): string {
  return `<div class="bibe-control" data-field="${field.key}">
    <label for="${field.key}-range">${field.label}</label>
    <span class="bibe-number"><input id="${field.key}-number" type="number" min="0" max="${field.maximum}" step="1"><span>${field.unit}</span></span>
    <input id="${field.key}-range" type="range" min="0" max="${field.maximum}" step="1">
    <label class="bibe-inherit"><input id="${field.key}-inherit" type="checkbox"> Use global value</label>
  </div>`;
}

function initializeControl(
  root: ParentNode,
  field: Readonly<{ key: FieldName }>,
  editable: EditableAppearance
): void {
  const inherited = editable.override[field.key] === null;
  const value = editable.override[field.key] ?? editable.global[field.key];
  const range = requireInput(root, `${field.key}-range`);
  const number = requireInput(root, `${field.key}-number`);
  const inherit = requireInput(root, `${field.key}-inherit`);
  range.value = String(value);
  number.value = String(value);
  inherit.checked = inherited;
  const disabled = inherited || isUnavailable(field.key, editable);
  range.disabled = disabled;
  number.disabled = disabled;
  inherit.disabled = isUnavailable(field.key, editable);
}

function readOverride(root: ParentNode, editable: EditableAppearance): AppearanceOverride {
  return {
    backdropOpacity: readField(root, 'backdropOpacity', editable),
    backdropBlur: readField(root, 'backdropBlur', editable),
    panelGlassOpacity: readField(root, 'panelGlassOpacity', editable),
    panelGlassBlur: readField(root, 'panelGlassBlur', editable)
  };
}

function readField(root: ParentNode, field: FieldName, editable: EditableAppearance): number | null {
  if (isUnavailable(field, editable)) {
    return editable.override[field];
  }
  const inherit = requireInput(root, `${field}-inherit`);
  return inherit.checked ? null : Number.parseInt(requireInput(root, `${field}-number`).value, 10);
}

function isUnavailable(field: FieldName, editable: EditableAppearance): boolean {
  return !editable.hasBackdrop && (field === 'backdropOpacity' || field === 'backdropBlur');
}

function setBusy(form: HTMLFormElement, busy: boolean): void {
  for (const button of form.querySelectorAll<HTMLButtonElement>('button')) {
    button.disabled = busy;
  }
}

function requireInput(root: ParentNode, id: string): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>(`#${id}`);
  if (input === null) {
    throw new Error(`Missing editor input ${id}.`);
  }
  return input;
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing editor element ${selector}.`);
  }
  return element;
}
