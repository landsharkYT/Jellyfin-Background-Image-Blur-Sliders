interface JellyfinAjaxOptions {
  type: 'GET' | 'PUT' | 'DELETE';
  url: string;
  dataType?: 'json';
  contentType?: string;
  data?: string;
}

interface JellyfinApiClient {
  ajax(options: JellyfinAjaxOptions): Promise<unknown>;
  getCurrentUserId(): string | null;
  getUrl(path: string): string;
}

interface Window {
  ApiClient?: JellyfinApiClient;
  Dashboard?: {
    alert(message: string | { title: string; message: string }): void;
    processPluginConfigurationUpdateResult?(result: unknown): void;
    showLoadingMsg?(): void;
    hideLoadingMsg?(): void;
  };
  __backgroundBlurEditorDispose?: () => void;
}
