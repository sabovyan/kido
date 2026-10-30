import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { HuntEndCard } from './HuntEndCard';
import { inOverlay } from './storyFrames';

const MISSED = [
  { code: 'np', name: 'Nepal' },
  { code: 'lu', name: 'Luxembourg' },
  { code: 'md', name: 'Moldova' },
];

const meta = {
  title: 'Flag Hunt/End card',
  component: HuntEndCard,
  decorators: [inOverlay],
  args: {
    view: 'globe',
    outOfHearts: false,
    perfect: false,
    found: 45,
    total: 48,
    missed: MISSED,
    score: 512,
    bestStreak: 17,
    land: 0.612,
    mode: 'easy',
    nextMode: 'medium',
    onPlay: fn(),
    onChangeMode: fn(),
  },
} satisfies Meta<typeof HuntEndCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RoundDone: Story = {};

export const Perfect: Story = { args: { perfect: true, found: 48, missed: [], score: 640, bestStreak: 48, land: 0.68 } };

export const OutOfHearts: Story = { args: { outOfHearts: true, found: 9, nextMode: undefined, score: 104, bestStreak: 6, land: 0.21 } };

// Hard has no next mode.
export const LastMode: Story = { args: { mode: 'hard', nextMode: undefined, found: 190, total: 197 } };

export const OneMissed: Story = { args: { found: 47, missed: MISSED.slice(0, 1) } };

export const ManyMissed: Story = {
  args: {
    found: 40,
    missed: [
      ...MISSED,
      { code: 'bt', name: 'Bhutan' },
      { code: 'bd', name: 'Bangladesh' },
      { code: 'lk', name: 'Sri Lanka' },
      { code: 'mn', name: 'Mongolia' },
      { code: 'kz', name: 'Kazakhstan' },
    ],
  },
};
