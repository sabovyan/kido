import type { Country, World } from '../countries';
import type { Paint } from './painter';

export type Focus = { lonLat: [number, number]; features: Country[]; id: number };

// What the game asks of a board (globe or flat map): show each country's paint
// state, move to a focused country, and report which country was clicked where.
export type BoardProps = {
  world: World;
  paints: Map<Country, Paint>;
  focus: Focus | null;
  onPick: (country: Country, lonLat: [number, number]) => void;
};
