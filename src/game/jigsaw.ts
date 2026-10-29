// Pure logic for the flag jigsaw (FlagJigsaw.tsx). Piece i belongs in slot i,
// counted left to right, top to bottom.

export const JIGSAW_COLS = 2;
export const JIGSAW_ROWS = 2;

export type Rect = { left: number; top: number; right: number; bottom: number };

// Tray order for the pieces: a shuffle that never leaves every piece in its own spot.
export function shuffledPieces(count: number, random = Math.random) {
  const order = Array.from({ length: count }, (_, i) => i);
  if (count < 2) return order;
  do {
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  } while (order.every((piece, i) => piece === i));
  return order;
}

export const fitsSlot = (piece: number, slot: number) => piece === slot;

// Places a piece if it fits; returns null when the drop should bounce back.
export function placePiece(placed: boolean[], piece: number, slot: number) {
  if (!fitsSlot(piece, slot) || placed[slot]) return null;
  return placed.map((p, i) => p || i === slot);
}

export const isComplete = (placed: boolean[]) => placed.length > 0 && placed.every(Boolean);

// Index of the slot under the point, or -1.
export function slotAt(rects: Rect[], x: number, y: number) {
  return rects.findIndex(r => x >= r.left && x < r.right && y >= r.top && y < r.bottom);
}

// CSS background that shows one tile's part of the flag image.
export function tileBackground(index: number, cols = JIGSAW_COLS, rows = JIGSAW_ROWS) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const at = (i: number, n: number) => (n > 1 ? (i / (n - 1)) * 100 : 0);
  return {
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${at(col, cols)}% ${at(row, rows)}%`,
  };
}

const ROW_NAMES: Record<number, string[]> = { 2: ['Top', 'Bottom'], 3: ['Top', 'Middle', 'Bottom'] };
const COL_NAMES: Record<number, string[]> = { 2: ['left', 'right'], 3: ['left', 'middle', 'right'] };

// "Top left spot", or "Row 2, spot 3" for bigger grids.
export function slotLabel(index: number, cols = JIGSAW_COLS, rows = JIGSAW_ROWS) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const rowName = ROW_NAMES[rows]?.[row];
  const colName = COL_NAMES[cols]?.[col];
  if (rowName === 'Middle' && colName === 'middle') return 'Middle spot';
  if (rowName && colName) return `${rowName} ${colName} spot`;
  return `Row ${row + 1}, spot ${col + 1}`;
}
