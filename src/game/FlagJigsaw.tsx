import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { flagPngUrl, flagUrl } from '../countries';
import { Card } from '../ui/Card';
import { Feedback } from '../ui/Feedback';
import { FOCUS_RING } from '../ui/focus';
import { isComplete, JIGSAW_COLS, JIGSAW_ROWS, placePiece, shuffledPieces, slotAt, slotLabel, tileBackground } from './jigsaw';

type Message = { tone: 'idle' | 'correct' | 'hint'; text: string };
type Drag = { piece: number; pointerId: number; x0: number; y0: number; moved: boolean };

const PIECES = JIGSAW_COLS * JIGSAW_ROWS;
// Widest the flag frame gets, and tallest, so tall flags (Nepal) stay on screen.
const FRAME_MAX_W = 320;
const FRAME_MAX_H = 220;
// Pointer travel (px) before a press turns into a drag instead of a tap.
const DRAG_START = 6;
// Matches --dur-pop.
const POP_MS = 240;
// Time to enjoy the finished flag before moving on.
const DONE_DELAY_MS = 900;

const IDLE: Message = { tone: 'idle', text: 'Drag a piece to its spot. Or tap a piece, then a spot.' };

const newGame = (code: string) => ({ code, order: shuffledPieces(PIECES), placed: Array<boolean>(PIECES).fill(false) });

// Width / height of the flag image, read from its PNG. Falls back to 3:2 until it loads.
function useFlagRatio(code: string) {
  const [ratio, setRatio] = useState({ code, value: 3 / 2 });
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) setRatio({ code, value: img.naturalWidth / img.naturalHeight });
    };
    img.src = flagPngUrl(code);
    return () => { img.onload = null; };
  }, [code]);
  return ratio.code === code ? ratio.value : 3 / 2;
}

// Rebuild a country's flag from shuffled tiles: drag them into the frame, or tap a tile then a spot.
export function FlagJigsaw({ code, name, onDone }: { code: string; name: string; onDone: () => void }) {
  const [game, setGame] = useState(() => newGame(code));
  const [selected, setSelected] = useState<number | null>(null);
  const [offset, setOffset] = useState<{ piece: number; x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState<Message>(IDLE);
  const [pop, setPop] = useState(false);
  const ratio = useFlagRatio(code);
  const drag = useRef<Drag | null>(null);
  const skipClick = useRef(false);
  const slots = useRef<(HTMLButtonElement | null)[]>([]);
  const onDoneRef = useRef(onDone);
  const doneFor = useRef<string | null>(null);

  if (game.code !== code) {
    setGame(newGame(code));
    setSelected(null);
    setOffset(null);
    setFeedback(IDLE);
  }

  const complete = isComplete(game.placed);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!complete) return;
    setPop(true);
    const unpop = setTimeout(() => setPop(false), POP_MS);
    const done = setTimeout(() => {
      if (doneFor.current === code) return;
      doneFor.current = code;
      onDoneRef.current();
    }, DONE_DELAY_MS);
    return () => {
      clearTimeout(unpop);
      clearTimeout(done);
    };
  }, [complete, code]);

  function drop(piece: number, slot: number) {
    const placed = placePiece(game.placed, piece, slot);
    if (!placed) {
      setFeedback({ tone: 'hint', text: 'Not that spot. Try another one!' });
      return;
    }
    setGame({ ...game, placed });
    setSelected(null);
    setFeedback(isComplete(placed)
      ? { tone: 'correct', text: `You built the flag of ${name}!` }
      : { tone: 'correct', text: 'Yes! It fits.' });
  }

  function pickPiece(piece: number) {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    if (selected === piece) {
      setSelected(null);
      setFeedback(IDLE);
      return;
    }
    setSelected(piece);
    setFeedback({ tone: 'idle', text: 'Now tap the spot where it goes.' });
  }

  function pickSlot(slot: number) {
    if (game.placed[slot] || complete) return;
    if (selected === null) {
      setFeedback({ tone: 'hint', text: 'Pick a piece first.' });
      return;
    }
    drop(selected, slot);
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, piece: number) {
    skipClick.current = false;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { piece, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const x = e.clientX - d.x0;
    const y = e.clientY - d.y0;
    if (!d.moved && Math.hypot(x, y) < DRAG_START) return;
    d.moved = true;
    setOffset({ piece: d.piece, x, y });
  }

  function onPointerUp(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    skipClick.current = true;
    // Clearing the offset slides a wrong piece back to the tray.
    setOffset(null);
    const rects = slots.current.map(s => s?.getBoundingClientRect() ?? { left: 0, top: 0, right: 0, bottom: 0 });
    const slot = slotAt(rects, e.clientX, e.clientY);
    if (slot >= 0 && !game.placed[slot]) drop(d.piece, slot);
  }

  function onPointerCancel() {
    drag.current = null;
    setOffset(null);
  }

  const frameW = Math.min(FRAME_MAX_W, FRAME_MAX_H * ratio);
  const tileRatio = (ratio * JIGSAW_ROWS) / JIGSAW_COLS;
  const image = `url(${flagUrl(code)})`;
  const grid = { gridTemplateColumns: `repeat(${JIGSAW_COLS}, minmax(0, 1fr))` };

  return (
    <Card padding="md" render={<section />} className="box-border flex w-full flex-col items-center gap-4 font-body">
      <h2 className="m-0 text-center font-display text-title-2">Build the flag of {name}</h2>

      <fieldset
        className={`m-0 box-border grid min-w-0 max-w-full overflow-hidden p-0 rounded-md border-3 border-outline bg-surface-sunk transition-transform duration-(--dur-pop) ease-bouncy motion-reduce:transition-none ${pop ? 'scale-110 motion-reduce:scale-100' : ''}`}
        // Border-box so the flag inside stays exactly frameW wide; the 3px border is outside it.
        style={{ ...grid, width: frameW + 6, aspectRatio: `${frameW + 6} / ${frameW / ratio + 6}` }}
      >
        <legend className="sr-only">Flag of {name}</legend>
        {Array.from({ length: PIECES }, (_, slot) => {
          const placed = game.placed[slot];
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: slots are fixed grid cells
              key={slot}
              ref={el => { slots.current[slot] = el; }}
              type="button"
              aria-label={placed ? `${slotLabel(slot)}, done` : slotLabel(slot)}
              aria-disabled={placed || complete || undefined}
              onClick={() => pickSlot(slot)}
              className={`relative m-0 box-border min-h-0 min-w-0 cursor-pointer border-2 border-dashed bg-transparent p-0 ${FOCUS_RING} focus-visible:-outline-offset-4 ${placed ? 'cursor-default border-transparent' : selected === null ? 'border-fg-muted' : 'border-ocean-500 bg-surface hover:bg-tint-hint'}`}
            >
              {placed && (
                <span
                  aria-hidden="true"
                  className="absolute -inset-0.5 bg-no-repeat transition-transform duration-(--dur-pop) ease-bouncy starting:scale-75 motion-reduce:transition-none"
                  style={{ backgroundImage: image, ...tileBackground(slot) }}
                />
              )}
            </button>
          );
        })}
      </fieldset>

      <Feedback tone={feedback.tone} detail={feedback.text} className="w-full" />

      {/* Empty spots keep the tray's size while playing; it goes away once the flag is built. */}
      <fieldset className={`m-0 min-w-0 max-w-full gap-3 border-0 p-0 ${complete ? 'hidden' : 'grid'}`} style={{ ...grid, width: frameW + 12 * (JIGSAW_COLS - 1) }}>
        <legend className="sr-only">Pieces</legend>
        {game.order.map((piece, i) => {
          if (game.placed[piece]) return <span key={piece} aria-hidden="true" style={{ aspectRatio: String(tileRatio), minWidth: 48 }} />;
          const dragging = offset?.piece === piece;
          return (
            <button
              key={piece}
              type="button"
              aria-label={`Piece ${i + 1}`}
              aria-pressed={selected === piece}
              onClick={() => pickPiece(piece)}
              onPointerDown={e => onPointerDown(e, piece)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              className={`relative m-0 box-border min-h-tap-min min-w-tap-min cursor-grab touch-none rounded-sm border-3 border-outline bg-surface bg-no-repeat p-0 shadow-drop-sm select-none ${FOCUS_RING} aria-pressed:-translate-y-1.5 aria-pressed:shadow-drop-lg aria-pressed:outline-3 aria-pressed:outline-offset-2 aria-pressed:outline-sun-400 ${dragging ? 'z-1 scale-105 cursor-grabbing shadow-drop-lg' : 'transition-[translate,scale,transform] duration-(--dur-pop) ease-bouncy hover:-translate-y-0.5 motion-reduce:transition-none'}`}
              style={{
                aspectRatio: String(tileRatio),
                backgroundImage: image,
                ...tileBackground(piece),
                transform: dragging ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
              }}
            />
          );
        })}
      </fieldset>
    </Card>
  );
}
