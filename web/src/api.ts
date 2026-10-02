import {
  type AdminSnapshot,
  type Appearance,
  type AppearanceOverride,
  type EditableAppearance,
  type EffectiveAppearance,
  type GlobalAppearance,
  parseEditable,
  parseEffective,
  parseGlobal,
  parseSnapshot
} from './model';

export class ApiConflictError extends Error {
  public constructor() {
    super('The appearance changed in another editor.');
  }
}

export class AppearanceApi {
  public async getSession(): Promise<{ canManage: boolean }> {
    const value = await this.request('GET', '/BackgroundBlurEditor/v1/session');
    if (!isRecord(value) || typeof value.canManage !== 'boolean') {
      throw new Error('The session response is invalid.');
    }
    return { canManage: value.canManage };
  }

  public async getEffective(itemId: string): Promise<EffectiveAppearance> {
    return parseEffective(await this.request('GET', `/BackgroundBlurEditor/v1/effective/${encodeURIComponent(itemId)}`));
  }

  public async getEditor(itemId: string): Promise<EditableAppearance> {
    return parseEditable(await this.request('GET', `/BackgroundBlurEditor/v1/admin/editor/${encodeURIComponent(itemId)}`));
  }

  public async getSnapshot(search = ''): Promise<AdminSnapshot> {
    const suffix = search.length === 0 ? '' : `?search=${encodeURIComponent(search)}`;
    return parseSnapshot(await this.request('GET', `/BackgroundBlurEditor/v1/admin/snapshot${suffix}`));
  }

  public async saveGlobal(values: Appearance, expectedRevision: string): Promise<GlobalAppearance> {
    return parseGlobal(await this.request('PUT', '/BackgroundBlurEditor/v1/admin/global', {
      expectedRevision,
      ...values
    }));
  }

  public async saveTitle(
    itemId: string,
    values: AppearanceOverride,
    expectedRevision: string
  ): Promise<EditableAppearance> {
    return parseEditable(await this.request(
      'PUT',
      `/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(itemId)}`,
      { expectedRevision, ...values }
    ));
  }

  public async resetTitle(itemId: string, expectedRevision: string): Promise<EditableAppearance> {
    const query = `?expectedRevision=${encodeURIComponent(expectedRevision)}`;
    return parseEditable(await this.request(
      'DELETE',
      `/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(itemId)}${query}`
    ));
  }

  private async request(method: 'GET' | 'PUT' | 'DELETE', path: string, body?: object): Promise<unknown> {
    const api = getApiClient();
    const options: JellyfinAjaxOptions = body === undefined
      ? { type: method, url: api.getUrl(path), dataType: 'json' }
      : {
          type: method,
          url: api.getUrl(path),
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify(body)
        };
    try {
      return await api.ajax(options);
    } catch (error: unknown) {
      if (readStatus(error) === 409) {
        throw new ApiConflictError();
      }
      throw error;
    }
  }
}

export function getApiClient(): JellyfinApiClient {
  const api = window.ApiClient;
  if (api === undefined) {
    throw new Error('Jellyfin ApiClient is not available.');
  }
  return api;
}

function readStatus(value: unknown): number | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.status === 'number') {
    return value.status;
  }
  if (typeof value.statusCode === 'number') {
    return value.statusCode;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
