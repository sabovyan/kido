import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';
import { FlagIcon, FlameIcon, HeartIcon, StarIcon } from './icons';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'UI/Chip',
  component: Chip,
  args: { children: <><StarIcon /><span className="font-display text-title-3 font-extrabold">120</span><span className="sr-only">points</span></> },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Surface: Story = {};

export const Reward: Story = {
  args: { tone: 'reward', children: <><FlameIcon /><span className="font-display text-title-3 font-extrabold">×4</span><span className="sr-only">streak</span></> },
};

const hearts = (
  <Chip tight role="img" aria-label="2 of 3 hearts left">
    <HeartIcon /><HeartIcon /><HeartIcon lost />
  </Chip>
);

// Flag Hunt's score bar.
export const ScoreBar: Story = {
  name: 'Score bar',
  render: () => (
    <div className="flex flex-wrap gap-3">
      {hearts}
      <Chip><StarIcon /><span className="font-display text-title-3 font-extrabold">120</span><span className="sr-only">points</span></Chip>
      <Chip tone="reward"><FlameIcon /><span className="font-display text-title-3 font-extrabold">×4</span><span className="sr-only">streak</span></Chip>
      <Chip><FlagIcon size={22} />8 / 40<span className="sr-only">flags</span></Chip>
      <Chip>Land 12.4%<ProgressBar value={0.124} label="Land painted" /></Chip>
    </div>
  ),
};

// On phones the chips sit borderless inside one score bar sticker.
export const PhoneBar: Story = {
  name: 'Phone bar',
  globals: { viewport: { value: 'phone' } },
  render: () => (
    <div className="box-border flex h-tap-icon items-center justify-between rounded-pill border-3 border-outline bg-surface px-4 shadow-drop-sm">
      <Chip tight phone="bar" role="img" aria-label="2 of 3 hearts left"><HeartIcon /><HeartIcon /><HeartIcon lost /></Chip>
      <Chip phone="bar"><StarIcon /><span className="font-display text-title-3 font-extrabold">120</span><span className="sr-only">points</span></Chip>
      <Chip phone="bar"><FlagIcon size={22} />8 / 40<span className="sr-only">flags</span></Chip>
    </div>
  ),
};

// Learn's progress chip: its own sticker on phones.
export const PhoneSticker: Story = {
  name: 'Phone sticker',
  globals: { viewport: { value: 'phone' } },
  render: () => (
    <div className="flex">
      <Chip phone="sticker" className="max-md:min-w-0 max-md:flex-1">
        <span className="shrink-0">Meet 2 / 6</span>
        <ProgressBar value={2 / 6} label="Session progress" className="max-md:w-auto max-md:flex-1" />
      </Chip>
    </div>
  ),
};

// End card stats and level pills.
export const Small: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Chip size="sm" tone="tint-hint">120 points</Chip>
        <Chip size="sm" tone="tint-correct">8 flags</Chip>
        <Chip size="sm" tone="tint-reward">Best streak 4</Chip>
        <Chip size="sm" tone="sunk">12.4% land</Chip>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip size="sm" tone="sunk">New</Chip>
        <Chip size="sm" tone="tint-hint">Met</Chip>
        <Chip size="sm" tone="tint-correct">Known</Chip>
        <Chip size="sm" tone="tint-reward"><StarIcon size={16} />Mastered</Chip>
      </div>
    </div>
  ),
};
