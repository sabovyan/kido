import { describe, expect, it } from 'vitest';
import { fitsSlot, isComplete, placePiece, shuffledPieces, slotAt, slotLabel, tileBackground } from './jigsaw';

// Deterministic random source cycling through the given values.
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('shuffledPieces', () => {
  it('returns every piece once', () => {
    for (let n = 1; n <= 9; n++) {
      expect([...shuffledPieces(n)].sort((a, b) => a - b)).toEqual([...Array(n).keys()]);
    }
  });

  it('never leaves all pieces in order', () => {
    // 0.999... keeps every swap in place on the first pass, so it must shuffle again.
    const order = shuffledPieces(4, seq(0.999, 0.999, 0.999, 0, 0, 0));
    expect(order).not.toEqual([0, 1, 2, 3]);
  });

  it('handles 0 and 1 piece', () => {
    expect(shuffledPieces(0)).toEqual([]);
    expect(shuffledPieces(1)).toEqual([0]);
  });
});

describe('placing pieces', () => {
  it('fits a piece only in its own slot', () => {
    expect(fitsSlot(2, 2)).toBe(true);
    expect(fitsSlot(2, 1)).toBe(false);
  });

  it('places a right piece and bounces a wrong one', () => {
    const empty = [false, false, false, false];
    expect(placePiece(empty, 1, 1)).toEqual([false, true, false, false]);
    expect(placePiece(empty, 1, 0)).toBeNull();
    expect(empty).toEqual([false, false, false, false]);
  });

  it('does not place twice', () => {
    expect(placePiece([false, true, false, false], 1, 1)).toBeNull();
  });

  it('is complete only when every slot is filled', () => {
    expect(isComplete([true, true, true, false])).toBe(false);
    expect(isComplete([true, true, true, true])).toBe(true);
    expect(isComplete([])).toBe(false);
  });
});

describe('slotAt', () => {
  const rects = [
    { left: 0, top: 0, right: 50, bottom: 50 },
    { left: 50, top: 0, right: 100, bottom: 50 },
  ];

  it('finds the slot under the point', () => {
    expect(slotAt(rects, 10, 10)).toBe(0);
    expect(slotAt(rects, 50, 10)).toBe(1);
  });

  it('returns -1 outside every slot', () => {
    expect(slotAt(rects, 10, 60)).toBe(-1);
    expect(slotAt(rects, 100, 10)).toBe(-1);
  });
});

describe('tileBackground', () => {
  it('shows each corner of the flag in a 2x2 grid', () => {
    expect(tileBackground(0, 2, 2)).toEqual({ backgroundSize: '200% 200%', backgroundPosition: '0% 0%' });
    expect(tileBackground(1, 2, 2).backgroundPosition).toBe('100% 0%');
    expect(tileBackground(2, 2, 2).backgroundPosition).toBe('0% 100%');
    expect(tileBackground(3, 2, 2).backgroundPosition).toBe('100% 100%');
  });

  it('spreads tiles evenly in a 3x2 grid', () => {
    expect(tileBackground(4, 3, 2)).toEqual({ backgroundSize: '300% 200%', backgroundPosition: '50% 100%' });
  });
});

describe('slotLabel', () => {
  it('names the spots of a 2x2 grid', () => {
    expect([0, 1, 2, 3].map(i => slotLabel(i, 2, 2))).toEqual([
      'Top left spot',
      'Top right spot',
      'Bottom left spot',
      'Bottom right spot',
    ]);
  });

  it('names the middle of a 3x3 grid', () => {
    expect(slotLabel(4, 3, 3)).toBe('Middle spot');
  });

  it('falls back to numbers for big grids', () => {
    expect(slotLabel(5, 4, 4)).toBe('Row 2, spot 2');
  });
});
