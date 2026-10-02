import { describe, expect, it, vi } from 'vitest';
import type { EffectiveAppearance } from '../src/model';
import { DetailAppearanceSession } from '../src/navigation';

const first = appearance('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 70);
const second = appearance('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 35);

describe('detail appearance session', () => {
  it('loads one appearance while repeated DOM synchronization is in progress', async () => {
    const pending = deferred<EffectiveAppearance>();
    const load = vi.fn(() => pending.promise);
    const render = vi.fn();
    const clear = vi.fn();
    const session = new DetailAppearanceSession({ load, render, clear });

    for (let index = 0; index < 25; index += 1) {
      session.sync(first.requestedItemId);
    }

    expect(load).toHaveBeenCalledOnce();
    expect(render).not.toHaveBeenCalled();
    pending.resolve(first);
    await pending.promise;
    await Promise.resolve();

    expect(session.current).toEqual(first);
    expect(render).toHaveBeenCalledOnce();
    expect(clear).not.toHaveBeenCalled();
  });

  it('ignores a stale response after navigating to another title', async () => {
    const firstPending = deferred<EffectiveAppearance>();
    const secondPending = deferred<EffectiveAppearance>();
    const load = vi.fn((itemId: string) => itemId === first.requestedItemId
      ? firstPending.promise
      : secondPending.promise);
    const render = vi.fn();
    const session = new DetailAppearanceSession({ load, render, clear: vi.fn() });

    session.sync(first.requestedItemId);
    session.sync(second.requestedItemId);
    firstPending.resolve(first);
    await firstPending.promise;
    await Promise.resolve();

    expect(render).not.toHaveBeenCalled();
    secondPending.resolve(second);
    await secondPending.promise;
    await Promise.resolve();

    expect(session.current).toEqual(second);
    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith(second);
  });

  it('keeps the previous appearance visible while the next title loads', async () => {
    const firstPending = deferred<EffectiveAppearance>();
    const secondPending = deferred<EffectiveAppearance>();
    const load = vi.fn((itemId: string) => itemId === first.requestedItemId
      ? firstPending.promise
      : secondPending.promise);
    const render = vi.fn();
    const clear = vi.fn();
    const session = new DetailAppearanceSession({ load, render, clear });

    session.sync(first.requestedItemId);
    firstPending.resolve(first);
    await firstPending.promise;
    await Promise.resolve();
    render.mockClear();

    session.sync(second.requestedItemId);
    session.sync(second.requestedItemId);

    expect(load).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenCalledWith(first);
    expect(clear).not.toHaveBeenCalled();
    expect(session.current).toBeNull();
  });
});

function appearance(itemId: string, panelGlassOpacity: number): EffectiveAppearance {
  return {
    requestedItemId: itemId,
    ownerItemId: itemId,
    titleName: itemId,
    titleKind: 'Series',
    viewedKind: 'Series',
    hasBackdrop: true,
    backdropBlurInherited: true,
    values: {
      backdropOpacity: 100,
      backdropBlur: 0,
      panelGlassOpacity,
      panelGlassBlur: 12
    }
  };
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolvePromise: ((value: T) => void) | null = null;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve: (value) => resolvePromise?.(value)
  };
}
