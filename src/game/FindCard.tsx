import { Card } from '../ui/Card';
import { Flag } from '../ui/Flag';

// Learn's practice: find a country by its flag. With `name` the card says which one;
// without it the flag is the only clue.
export function FindCard({ code, name, board }: { code: string; name?: string; board: string }) {
  return (
    <Card padding="sm" className="flex items-center gap-4">
      <Flag code={code} alt="Flag to find" />
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-title-2">{name ? `Find ${name}` : 'Find this country'}</span>
        <span className="text-body text-fg-muted">{name ? `Tap it on the ${board}.` : 'No name this time!'}</span>
      </span>
    </Card>
  );
}
