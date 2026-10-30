import { Link } from '@tanstack/react-router';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ArrowRightIcon, StarIcon } from '../ui/icons';
import { type LevelRow, LevelList } from './LevelList';

const countryWord = (n: number) => (n === 1 ? 'country' : 'countries');

// Learn's end card. `knew`: flags known in the quick check; `met`: new countries met;
// `practiced`: countries in the session. `more`: how many the next session learns, if any.
export function LearnDoneCard({ knew, met, practiced, countries, more, onMore }: {
  knew: number;
  met: number;
  practiced: number;
  countries: LevelRow[];
  more?: number;
  onMore: () => void;
}) {
  return (
    <Card render={<section />} className="box-border flex w-[560px] max-w-full flex-col gap-4 text-center max-h-full overflow-y-auto">
      <div className="flex items-end justify-center gap-1.5">
        <StarIcon size={44} /><StarIcon size={60} /><StarIcon size={44} />
      </div>
      <h2 className="m-0 font-display text-title-1">Great job!</h2>
      <p className="m-0 text-body-lg">
        {knew > 0 && `You already knew ${knew}! `}
        {met ? `You met ${met} new ${countryWord(met)}.` : practiced ? `You practiced ${practiced} ${countryWord(practiced)}.` : ''}
      </p>
      <LevelList countries={countries} />
      <div className="mt-2 flex flex-wrap justify-center gap-3 max-md:flex-col">
        {more !== undefined && (
          <Button variant="main" fill onClick={onMore}>
            Learn {more} more <ArrowRightIcon />
          </Button>
        )}
        <Button fill render={<Link to="/country/games" />}>Play Flag Hunt</Button>
      </div>
    </Card>
  );
}
