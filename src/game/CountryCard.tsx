import { Fragment, useSyncExternalStore } from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import { factsOf } from '../data/facts';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Flag } from '../ui/Flag';
import { ArrowRightIcon, ChevronIcon } from '../ui/icons';

type Named = { code: string; name: string };

// Neighbours' names, best-known first (`order` puts famous flags first): up to 4 names,
// or 3 and how many more.
function neighbourNames(codes: string[], order: Named[]) {
  const names = order.filter(t => codes.includes(t.code)).map(t => t.name);
  if (names.length <= 1) return names[0];
  if (names.length <= 4) return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
}

// Phones get a "Fun facts" switch so the card covers no more of the map than before.
const WIDE = '(min-width: 768px)';
const onWideChange = (onChange: () => void) => {
  const media = window.matchMedia(WIDE);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const useWide = () => useSyncExternalStore(onWideChange, () => window.matchMedia(WIDE).matches, () => true);

// The meet step: flag, name and a few easy facts. Rows the dataset doesn't have are left out.
// `order`: every country, best-known first, for the neighbours' names.
export function CountryCard({ target, order, board, open, onOpenChange, saidHi, onNext }: {
  target: Named;
  order: Named[];
  board: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saidHi: boolean;
  onNext: () => void;
}) {
  const wide = useWide();
  const facts = factsOf(target.code);
  const neighbours = facts && neighbourNames(facts.neighbours, order);
  const rows = facts
    ? [
      { label: 'Continent', value: facts.continent },
      { label: 'Capital', value: facts.capital },
      { label: 'Flag', value: facts.flag },
      { label: facts.neighbours.length === 1 ? 'Neighbour' : 'Neighbours', value: neighbours },
    ].filter(r => r.value)
    : [];
  const next = (
    <Button variant="continue" size="md" fill disabled={saidHi} onClick={onNext}>
      Next <ArrowRightIcon />
    </Button>
  );

  return (
    <Collapsible.Root open={wide || open} onOpenChange={onOpenChange} render={<Card padding="sm" className="flex flex-col items-stretch gap-4" />}>
      <div className="flex items-center gap-4">
        <Flag code={target.code} alt={`Flag of ${target.name}`} className="md:h-20 md:w-30" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-display text-title-2">This is {target.name}</span>
          <span className="text-body text-fg-muted">Tap it on the {board} to say hi.</span>
        </span>
        {wide && next}
      </div>
      {rows.length > 0 && (
        <Collapsible.Panel className="max-h-[40dvh] overflow-y-auto rounded-md bg-surface-sunk px-4 py-3">
          <dl className="m-0 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1">
            {rows.map(r => (
              <Fragment key={r.label}>
                <dt className="text-caption text-fg-muted">{r.label}</dt>
                <dd className="m-0 text-body">{r.value}</dd>
              </Fragment>
            ))}
          </dl>
        </Collapsible.Panel>
      )}
      {!wide && (
        <div className="grid auto-cols-fr grid-flow-col gap-3">
          {rows.length > 0 && (
            <Collapsible.Trigger render={<Button size="md" fill className="[&[data-panel-open]_svg]:rotate-180" />}>
              Fun facts <ChevronIcon />
            </Collapsible.Trigger>
          )}
          {next}
        </div>
      )}
    </Collapsible.Root>
  );
}
