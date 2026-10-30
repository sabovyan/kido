import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ViewSwitch } from '../ViewSwitch';
import { LearnStartCard } from './LearnStartCard';
import { inOverlay } from './storyFrames';

const meta = {
  title: 'Learn/Start card',
  component: LearnStartCard,
  decorators: [inOverlay],
  args: { board: 'globe', loading: false, counts: [197, 0, 0, 0], due: 0, hasNext: true, onStart: fn() },
} satisfies Meta<typeof LearnStartCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstTime: Story = {};

export const Returning: Story = { args: { counts: [161, 14, 18, 4], due: 5 } };

export const Loading: Story = { args: { loading: true } };

export const AllKnown: Story = { args: { counts: [0, 0, 12, 185], hasNext: false } };

// On phones the card holds the Map / Globe switch.
export const WithViewSwitch: Story = {
  args: { viewSwitch: <ViewSwitch from="/country/learn" isMap={false} /> },
  parameters: { router: { path: '/country/learn' } },
};
