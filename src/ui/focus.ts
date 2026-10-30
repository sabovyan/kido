// The focus ring every focusable sticker shows when reached by keyboard.
export const FOCUS_RING = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';

// Joins class strings, skipping empty ones. Primitives own every visual class, so there is nothing to merge.
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}
