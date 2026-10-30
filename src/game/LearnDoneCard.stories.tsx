import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { LearnDoneCard } from './LearnDoneCard';
import { inOverlay } from './storyFrames';

const meta = {
  title: 'Learn/Done card',
  component: LearnDoneCard,
  decorators: [inOverlay],
  args: {
    knew: 2,
    met: 3,
    practiced: 5,
    countries: [
      { code: 'fr', name: 'France', level: 2 },
      { code: 'jp', name: 'Japan', level: 2 },
      { code: 'np', name: 'Nepal', level: 2 },
      { code: 'lu', name: 'Luxembourg', level: 1 },
      { code: 'md', name: 'Moldova', level: 2 },
    ],
    more: 3,
    onMore: fn(),
  },
} satisfies Meta<typeof LearnDoneCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MetNew: Story = {};

// A review session: nothing new to meet.
export const Practiced: Story = {
  args: {
    knew: 0,
    met: 0,
    practiced: 2,
    countries: [
      { code: 'np', name: 'Nepal', level: 3 },
      { code: 'lu', name: 'Luxembourg', level: 2 },
    ],
  },
};

export const NothingLeft: Story = { args: { more: undefined } };
