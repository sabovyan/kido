import { useEffect, useMemo, useRef, useState } from 'react';
import { flagUrl } from '../countries';
import { buildDeck, flip, isDone, MEMORY_START, type MemoryCard, type MemoryCountry, outlinePath } from './memory';

export type { MemoryCountry } from './memory';

type Props = {
  // 2 to 6 countries. Give the component a new key to deal a new round.
  countries: MemoryCountry[];
  onMatch: (code: string) => void;
  onDone: () => void;
};

// How long a miss stays up before it flips back, and the last pair before onDone.
const MISS_PAUSE = 1000;
const DONE_PAUSE = 900;
const SHAPE_W = 100, SHAPE_H = 70;

const CARD = 'group relative block aspect-square w-full cursor-pointer border-0 bg-transparent rounded-lg p-0 font-body text-fg perspective-[800px] transition-transform duration-(--dur-tap) motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 disabled:cursor-default max-md:aspect-[4/5]';
const FACE = 'absolute inset-0 box-border flex flex-col items-center justify-center gap-1 rounded-lg border-3 border-outline shadow-drop-md backface-hidden transition-opacity duration-(--dur-pop) motion-reduce:transform-none motion-reduce:backface-visible';

export function MemoryMatch({ countries, onMatch, onDone }: Props) {
  const [deck] = useState(() => buildDeck(countries));
  const [state, setState] = useState(MEMORY_START);
  const [message, setMessage] = useState('');
  const shapes = useMemo(() => new Map(countries.map(c => [c.code, outlinePath(c.features, SHAPE_W, SHAPE_H)])), [countries]);
  const done = isDone(deck, state);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // A miss stays up for a moment, then both cards turn back.
  useEffect(() => {
    if (state.open.length < 2) return;
    const timer = setTimeout(() => setState(s => (s.open.length === 2 ? { ...s, open: [] } : s)), MISS_PAUSE);
    return () => clearTimeout(timer);
  }, [state.open]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => onDoneRef.current(), DONE_PAUSE);
    return () => clearTimeout(timer);
  }, [done]);

  const pick = (i: number) => {
    const next = flip(deck, state, i);
    if (next === state) return;
    setState(next);
    if (next.matched.length > state.matched.length) {
      setMessage(isDone(deck, next) ? 'You found all the pairs!' : `Yes! ${deck[i].name} is a pair.`);
      onMatch(deck[i].code);
    } else if (next.open.length === 2) {
      setMessage('Not a pair yet. Try again!');
    } else {
      setMessage('');
    }
  };

  return (
    <div className="w-full max-w-160">
      <ul aria-label="Memory cards" className="m-0 grid list-none grid-cols-4 gap-3 p-0 max-md:grid-cols-3">
        {deck.map((card, i) => {
          const matched = state.matched.includes(card.code);
          const up = matched || state.open.includes(i);
          return (
            <li key={card.id}>
              <button
                type="button"
                aria-label={up ? cardLabel(card) : `Card ${i + 1}, face down`}
                disabled={matched}
                onClick={() => pick(i)}
                className={`${CARD} ${up ? '' : 'hover:-translate-y-0.5 active:translate-y-[5px]'}`}
              >
                <span className={`block size-full transform-3d transition-transform duration-(--dur-pop) ease-bouncy motion-reduce:transform-none motion-reduce:transition-none ${up ? 'rotate-y-180' : ''}`}>
                  <span className={`${FACE} bg-ocean-500 text-on-ocean group-active:shadow-none ${up ? 'motion-reduce:opacity-0' : ''}`}>
                    <GlobeIcon />
                  </span>
                  <span className={`${FACE} rotate-y-180 p-2 ${matched ? 'bg-tint-correct text-on-tint-correct' : 'bg-surface'} ${up ? '' : 'motion-reduce:opacity-0'}`}>
                    {card.face === 'flag' ? (
                      <img src={flagUrl(card.code)} alt="" className="block aspect-[3/2] w-full rounded-sm border-2 border-outline object-cover" />
                    ) : (
                      <>
                        <svg aria-hidden="true" viewBox={`0 0 ${SHAPE_W} ${SHAPE_H}`} className="block min-h-0 w-full flex-1">
                          <path d={shapes.get(card.code)} className="fill-map-land stroke-map-border stroke-[1.5] [stroke-linejoin:round] [vector-effect:non-scaling-stroke]" />
                        </svg>
                        <span className="text-center text-label text-balance max-md:text-caption">{card.name}</span>
                      </>
                    )}
                    {matched && (
                      <span className="absolute -top-2.5 -right-2.5 grid size-8 place-items-center rounded-full border-3 border-on-leaf bg-leaf-500 text-on-leaf">
                        <CheckIcon />
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <output className="sr-only">{message}</output>
    </div>
  );
}

const cardLabel = (card: MemoryCard) => (card.face === 'flag' ? `Flag of ${card.name}` : `${card.name}, country shape`);

function GlobeIcon() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
