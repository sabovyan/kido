import { FOCUS_RING } from '../ui/focus';
import { StarIcon } from '../ui/icons';

export type Mode = 'easy' | 'medium' | 'hard';

// `phone`: on phones Easy is the one main (sun) action and the others are plain rows.
export const MODES: { mode: Mode; label: string; blurb: string; tint: string; phone: string }[] = [
  { mode: 'easy', label: 'Easy', blurb: 'Big countries, famous flags', tint: 'bg-tint-correct text-on-tint-correct', phone: 'max-md:border-on-sun max-md:bg-sun-400 max-md:text-on-sun' },
  { mode: 'medium', label: 'Medium', blurb: 'More flags to spot', tint: 'bg-tint-hint text-on-tint-hint', phone: 'max-md:bg-surface max-md:text-fg' },
  { mode: 'hard', label: 'Hard', blurb: 'Every flag, tiny islands too', tint: 'bg-tint-oops text-on-tint-oops', phone: 'max-md:bg-surface max-md:text-fg' },
];

// Stable keys for the star row.
const STARS = ['star-1', 'star-2', 'star-3'];

const MODE_CARD = `max-md:min-h-18 max-md:flex-row max-md:items-center max-md:gap-3 max-md:px-4 max-md:py-3 max-md:disabled:border-outline max-md:disabled:bg-surface-sunk max-md:disabled:text-fg-muted flex cursor-pointer flex-col items-start gap-2 rounded-lg border-3 border-outline p-[18px] text-left font-body shadow-drop-lg transition-transform duration-(--dur-tap) hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-none motion-reduce:transition-none ${FOCUS_RING} disabled:cursor-default disabled:border-dashed disabled:bg-surface-sunk disabled:text-fg-muted disabled:shadow-none disabled:hover:translate-y-0`;

// Flag Hunt's Easy / Medium / Hard cards. `counts`: how many flags each mode asks.
export function ModePicker({ counts, disabled = false, onPick }: {
  counts: Partial<Record<Mode, number>>;
  disabled?: boolean;
  onPick: (mode: Mode) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 max-md:grid-cols-1 max-md:gap-3">
      {MODES.map((m, i) => (
        <button type="button" key={m.mode} disabled={disabled} onClick={() => onPick(m.mode)} className={`${MODE_CARD} ${m.tint} ${m.phone}`}>
          <span className="flex gap-0.5 max-md:w-[70px] max-md:shrink-0">
            {STARS.slice(0, i + 1).map(key => <StarIcon key={key} size={22} />)}
          </span>
          <span className="flex flex-col gap-2 max-md:min-w-0 max-md:flex-1 max-md:gap-0">
            <span className="font-display text-title-2 font-extrabold max-md:text-title-3">{m.label}</span>
            <span className="text-caption">{m.blurb}<span className="max-md:hidden"> · {counts[m.mode] ?? 0} flags</span></span>
          </span>
          <span className="shrink-0 text-caption tabular-nums md:hidden">{counts[m.mode] ?? 0} flags</span>
        </button>
      ))}
    </div>
  );
}
