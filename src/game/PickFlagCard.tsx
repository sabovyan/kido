import { Card } from '../ui/Card';
import { Flag } from '../ui/Flag';
import { FOCUS_RING } from '../ui/focus';

// A flag answer: a big sticker button holding a flag. No primitive has its square, padded shape.
const FLAG_CHOICE = `grid cursor-pointer place-items-center rounded-md border-3 border-outline bg-surface p-2 shadow-drop-md transition-transform duration-(--dur-tap) hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-none motion-reduce:transition-none ${FOCUS_RING} disabled:cursor-default disabled:shadow-none disabled:hover:translate-y-0`;

// Learn's practice: the country is lit up on the board, the kid picks its flag.
export function PickFlagCard({ choices, disabled = false, onPick }: {
  choices: { code: string; name: string }[];
  disabled?: boolean;
  onPick: (code: string, name: string) => void;
}) {
  return (
    <Card padding="sm" className="flex flex-col items-stretch gap-4">
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-title-2">Which flag is this country's?</span>
        <span className="text-body text-fg-muted">Look at the yellow country.</span>
      </span>
      <div className="grid grid-cols-3 gap-3">
        {choices.map(c => (
          <button
            type="button"
            key={c.code}
            aria-label={`Flag of ${c.name}`}
            disabled={disabled}
            onClick={() => onPick(c.code, c.name)}
            className={FLAG_CHOICE}
          >
            <Flag code={c.code} size="fill" alt="" />
          </button>
        ))}
      </div>
    </Card>
  );
}
