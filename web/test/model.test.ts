import { describe, expect, it } from 'vitest';
import { mergeAppearance, parseEffective } from '../src/model';

describe('appearance model', () => {
  it('merges each inherited field independently', () => {
    expect(mergeAppearance(
      {
        backdropOpacity: 100,
        backdropBlur: 0,
        panelGlassOpacity: 70,
        panelGlassBlur: 12
      },
      {
        backdropOpacity: null,
        backdropBlur: 18,
        panelGlassOpacity: 40,
        panelGlassBlur: null
      }
    )).toEqual({
      backdropOpacity: 100,
      backdropBlur: 18,
      panelGlassOpacity: 40,
      panelGlassBlur: 12
    });
  });

  it('parses a valid server response', () => {
    expect(parseEffective({
      requestedItemId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ownerItemId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      titleName: 'Example',
      titleKind: 'Series',
      viewedKind: 'Episode',
      hasBackdrop: true,
      values: {
        backdropOpacity: 90,
        backdropBlur: 7,
        panelGlassOpacity: 65,
        panelGlassBlur: 10
      }
    }).viewedKind).toBe('Episode');
  });

  it('rejects out-of-range wire values', () => {
    expect(() => parseEffective({
      requestedItemId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ownerItemId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      titleName: 'Example',
      titleKind: 'Movie',
      viewedKind: 'Movie',
      hasBackdrop: true,
      values: {
        backdropOpacity: 101,
        backdropBlur: 0,
        panelGlassOpacity: 70,
        panelGlassBlur: 12
      }
    })).toThrow(/backdropOpacity/);
  });
});
