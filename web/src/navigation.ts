import type { Appearance, EffectiveAppearance } from './model';

type AppearanceSessionDependencies = {
  load: (itemId: string) => Promise<EffectiveAppearance>;
  render: (appearance: EffectiveAppearance) => void;
  clear: () => void;
};

type SessionState =
  | { kind: 'outside' }
  | { kind: 'loading'; itemId: string; request: number; fallback: EffectiveAppearance | null }
  | { kind: 'ready'; appearance: EffectiveAppearance }
  | { kind: 'failed'; itemId: string }
  | { kind: 'disposed' };

export class DetailAppearanceSession {
  private state: SessionState = { kind: 'outside' };
  private request = 0;

  public constructor(private readonly dependencies: AppearanceSessionDependencies) {}

  public get current(): EffectiveAppearance | null {
    return this.state.kind === 'ready' ? this.state.appearance : null;
  }

  public sync(itemId: string | null): void {
    if (this.state.kind === 'disposed') {
      return;
    }
    if (itemId === null) {
      if (this.state.kind !== 'outside') {
        this.request += 1;
        this.state = { kind: 'outside' };
        this.dependencies.clear();
      }
      return;
    }

    if (stateItemId(this.state) === itemId) {
      const appearance = visibleAppearance(this.state);
      if (appearance !== null) {
        this.dependencies.render(appearance);
      }
      return;
    }

    const fallback = visibleAppearance(this.state);
    const request = ++this.request;
    this.state = { kind: 'loading', itemId, request, fallback };
    if (fallback !== null) {
      this.dependencies.render(fallback);
    }
    void this.load(itemId, request);
  }

  public updateCurrent(values: Appearance, backdropBlurInherited: boolean): void {
    if (this.state.kind !== 'ready') {
      return;
    }
    const appearance = { ...this.state.appearance, values, backdropBlurInherited };
    this.state = { kind: 'ready', appearance };
    this.dependencies.render(appearance);
  }

  public dispose(): void {
    if (this.state.kind === 'disposed') {
      return;
    }
    this.request += 1;
    this.state = { kind: 'disposed' };
    this.dependencies.clear();
  }

  private async load(itemId: string, request: number): Promise<void> {
    try {
      const appearance = await this.dependencies.load(itemId);
      if (this.state.kind !== 'loading'
        || this.state.request !== request
        || appearance.requestedItemId !== itemId) {
        return;
      }
      this.state = { kind: 'ready', appearance };
      this.dependencies.render(appearance);
    } catch {
      if (this.state.kind === 'loading' && this.state.request === request) {
        this.state = { kind: 'failed', itemId };
        this.dependencies.clear();
      }
    }
  }
}

function stateItemId(state: SessionState): string | null {
  switch (state.kind) {
    case 'loading':
    case 'failed':
      return state.itemId;
    case 'ready':
      return state.appearance.requestedItemId;
    case 'outside':
    case 'disposed':
      return null;
  }
}

function visibleAppearance(state: SessionState): EffectiveAppearance | null {
  switch (state.kind) {
    case 'loading':
      return state.fallback;
    case 'ready':
      return state.appearance;
    case 'outside':
    case 'failed':
    case 'disposed':
      return null;
  }
}
