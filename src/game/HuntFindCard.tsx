import { Card } from '../ui/Card';
import { Flag } from '../ui/Flag';

// Flag Hunt's question. On phones the card is just the flag, centred; the alt text carries the
// instruction. `hidden`: on phones the feedback takes the card's place instead of stacking on it.
export function HuntFindCard({ code, hidden = false }: { code: string; hidden?: boolean }) {
  return (
    <Card padding="sm" className={`flex items-center gap-4 max-md:self-center max-md:p-2.5 ${hidden ? 'max-md:hidden' : ''}`}>
      <Flag code={code} alt="Find the country with this flag" className="max-md:h-20 max-md:w-30" />
      <span className="flex flex-col gap-0.5 max-md:hidden">
        <span className="font-display text-title-2">Find this country</span>
      </span>
    </Card>
  );
}
