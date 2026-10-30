import { Chip, type ChipProps } from '../ui/Chip';
import { Flag } from '../ui/Flag';
import { StarIcon } from '../ui/icons';

export type LevelRow = { code: string; name: string; level: number };

export const LEVELS: { label: string; tone: ChipProps['tone'] }[] = [
  { label: 'New', tone: 'sunk' },
  { label: 'Met', tone: 'tint-hint' },
  { label: 'Known', tone: 'tint-correct' },
  { label: 'Mastered', tone: 'tint-reward' },
];

export function LevelChip({ level }: { level: number }) {
  const { label, tone } = LEVELS[level] ?? LEVELS[0];
  return (
    <Chip size="sm" tone={tone}>
      {level === 3 && <StarIcon size={16} />}
      {label}
    </Chip>
  );
}

// Countries with their flag and how well the kid knows them.
export function LevelList({ countries }: { countries: LevelRow[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0 text-left">
      {countries.map(t => (
        <li key={t.code} className="flex items-center gap-3 rounded-md border-3 border-outline bg-surface-sunk px-3 py-2">
          <Flag code={t.code} size="sm" alt="" />
          <span className="min-w-0 flex-1 text-body font-bold">{t.name}</span>
          <LevelChip level={t.level} />
        </li>
      ))}
    </ul>
  );
}
