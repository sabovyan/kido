import type { Decorator } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { loadWorld, type Country, type World } from '../countries';
import { Overlay } from '../ui/Overlay';
import type { Focus } from './board';
import type { MemoryCountry } from './memory';
import type { Paint } from './painter';
import { QuestionDock } from './QuestionDock';
import { buildTargets, withPaint } from './targets';

// Story helpers: the game screen around a card, and board fixtures. Not used by the app.

// The game screen: the board's sea (or the globe's backdrop), filling the story frame
// through the preview's padding.
export function Screen({ globe = false, children }: { globe?: boolean; children: ReactNode }) {
  return <div className={`relative -m-4 h-dvh overflow-hidden font-body text-fg ${globe ? 'bg-backdrop' : 'bg-map-sea'}`}>{children}</div>;
}

export const onScreen: Decorator = Story => <Screen><Story /></Screen>;

// Start, end, build and match cards sit on the dimmed board.
export const inOverlay: Decorator = Story => <Screen><Overlay><Story /></Overlay></Screen>;
export const inScrollOverlay: Decorator = Story => <Screen><Overlay scroll><Story /></Overlay></Screen>;

// Question cards sit at the bottom of the board.
export const inDock: Decorator = Story => <Screen><QuestionDock><Story /></QuestionDock></Screen>;

export type BoardScene = { world: World; paints: Map<Country, Paint>; focus: Focus | null };

// A story loader for a board: `target` lit up (and turned to), `flags` painted, `wrong` marked as a miss.
export function loadScene({ target, flags = [], wrong = [] }: { target?: string; flags?: string[]; wrong?: string[] }) {
  return async (): Promise<BoardScene> => {
    const world = await loadWorld();
    const byCode = new Map(buildTargets(world).map(t => [t.code, t]));
    const features = (codes: string[]) => codes.flatMap(c => byCode.get(c)?.features ?? []);
    let paints = withPaint(new Map(), features(flags), 'flag');
    paints = withPaint(paints, features(wrong), 'wrong');
    const t = target ? byCode.get(target) : undefined;
    if (t) paints = withPaint(paints, t.features, 'answer');
    return { world, paints, focus: t ? { lonLat: t.center, features: t.features, id: 1 } : null };
  };
}

// A story loader for the memory game's countries, with their map shapes.
export function loadCountries(codes: string[]) {
  return async (): Promise<{ countries: MemoryCountry[] }> => {
    const targets = buildTargets(await loadWorld());
    return { countries: codes.flatMap(c => targets.filter(t => t.code === c)) };
  };
}
