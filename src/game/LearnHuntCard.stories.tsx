import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { LearnHuntCard } from './LearnHuntCard';
import { inOverlay } from './storyFrames';

const COUNTRIES = [
  { code: 'np', name: 'Nepal', level: 0 },
  { code: 'lu', name: 'Luxembourg', level: 1 },
  { code: 'md', name: 'Moldova', level: 0 },
  { code: 'bt', name: 'Bhutan', level: 2 },
  { code: 'lk', name: 'Sri Lanka', level: 0 },
  { code: 'mn', name: 'Mongolia', level: 3 },
];

// Learn's first card after Flag Hunt's "Learn these".
const meta = {
  title: 'Learn/From Flag Hunt card',
  component: LearnHuntCard,
  decorators: [inOverlay],
  args: { board: 'globe', loading: false, size: 3, countries: COUNTRIES.slice(0, 3), onStart: fn(), onNotNow: fn() },
} satisfies Meta<typeof LearnHuntCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OneFlag: Story = { args: { size: 1, countries: COUNTRIES.slice(0, 1) } };

export const SixFlags: Story = { args: { size: 6, countries: COUNTRIES } };

// Before the map loads the list waits.
export const Loading: Story = { args: { loading: true, countries: [] } };
